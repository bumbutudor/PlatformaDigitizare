"""Archive obsolete generated media outside the watched folders (dry run by default)."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import time
import re
import uuid
from urllib.parse import unquote, urlsplit

FOLDERS = ("ocr", "pre", "out", "pdfs")
EXTENSIONS = {".txt", ".pdf", ".docx", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}
DIGI_NAME = re.compile(r'^digi_([0-9a-f]{32})_')


def inside(path, root):
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def protected_paths(workspace):
    # A failed protection check must stop cleanup rather than delete more files.
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z", "backend/media"], cwd=workspace
    ).decode("utf-8").split("\0")
    protected = {(workspace / p).resolve() for p in tracked if p}
    media = workspace / "backend/media"
    db = workspace / "backend/db.sqlite3"
    with sqlite3.connect(db.as_uri() + "?mode=ro", uri=True) as connection:
        for table, column in (("access_file", "image"), ("access_ocrmodel", "model_file")):
            for (value,) in connection.execute("SELECT " + column + " FROM " + table):
                if not value:
                    continue
                path = unquote(urlsplit(value).path).replace("\\", "/").lstrip("/")
                if path.startswith("media/"):
                    path = path[len("media/"):]
                protected.add((media / path).resolve())
        # Published/saved documents can contain arbitrary output references.
        documents = [row[0] or "" for row in connection.execute("SELECT digi_object FROM access_digidocument")]
    return protected, documents


def job_retention(workspace):
    """Expired jobs may be archived; queued/processing jobs are always protected."""
    expired, live, references = set(), set(), []
    with sqlite3.connect((workspace / 'backend/db.sqlite3').as_uri() + '?mode=ro', uri=True) as db:
        columns = {row[1] for row in db.execute('PRAGMA table_info(access_digijob)')}
        request_data = 'request_data' if 'request_data' in columns else "'{}'"
        for job_id, status, expires, files, request in db.execute(
                'SELECT id,status,expires_at,files,' + request_data + ' FROM access_digijob'):
            identity = uuid.UUID(job_id).hex
            deadline = dt.datetime.fromisoformat(expires)
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=dt.timezone.utc)
            if deadline <= dt.datetime.now(dt.timezone.utc) and status not in ('queued', 'processing'):
                expired.add(identity)
            else:
                live.add(identity)
                references.extend((files or '', request or ''))
    return expired, live, references


def candidates(workspace, days):
    media = (workspace / "backend/media").resolve()
    cutoff = time.time() - days * 86400
    protected, documents = protected_paths(workspace)
    expired, live, active_references = job_retention(workspace)
    documents += active_references
    for folder in (*FOLDERS, ''):
        root = media / folder
        if root.is_symlink() or not inside(root, media):
            raise RuntimeError("Unsafe media folder: " + str(root))
        for directory, dirs, files in os.walk(root, followlinks=False):
            if not folder:
                # Only Digi originals at the media root; ordinary originals stay put.
                dirs[:] = []
            dirs[:] = [name for name in dirs if not Path(directory, name).is_symlink()
                       and name.lower() not in {"models", "ocr_models", "dictionaries"}]
            for name in files:
                digi = DIGI_NAME.match(name)
                if (not folder and not digi) or (digi and digi[1] in live):
                    continue
                path = Path(directory, name)
                if path.is_symlink() or not inside(path, root) or path.suffix.lower() not in EXTENSIONS:
                    continue
                if path.resolve() in protected:
                    continue
                relative = path.relative_to(media).as_posix()
                if any(relative in document.replace("\\", "/") or name in document for document in documents):
                    continue
                stat = path.stat()
                if stat.st_mtime < cutoff or (digi and digi[1] in expired):
                    yield path, path.relative_to(workspace).as_posix(), stat
    private = workspace / '.ops/digi-jobs'
    if private.is_symlink() or not inside(private, workspace / '.ops'):
        raise RuntimeError('Unsafe Digi job root')
    if private.exists():
        for folder in private.iterdir():
            try:
                identity = uuid.UUID(folder.name).hex
            except ValueError:
                continue
            if identity not in expired or folder.is_symlink() or not folder.is_dir():
                continue
            if not inside(folder, private) or any(p.is_symlink() for p in folder.rglob('*')):
                raise RuntimeError('Unsafe expired Digi job folder')
            yield folder, folder.relative_to(workspace).as_posix(), folder.stat()


def archive_candidates(workspace, selected):
    """Move files/directories atomically; keep a restoration manifest outside Hot Folder."""
    archive_root = workspace / '.ops/media-archive'
    if archive_root.is_symlink() or not inside(archive_root, workspace / '.ops'):
        raise RuntimeError('Unsafe archive root')
    run = archive_root / dt.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    run.mkdir(parents=True, exist_ok=False)
    moved = skipped = 0
    # Recheck live jobs before moving a prepared selection.
    allowed = {str(path.resolve()) for path, _, _ in candidates(workspace, 7)}
    with (run / 'manifest.jsonl').open('w', encoding='utf-8') as manifest:
        for source, relative, stat in selected:
            destination = run / relative
            roots = (workspace / 'backend/media', workspace / '.ops/digi-jobs')
            if not any(inside(source, root) for root in roots) or not inside(destination, run):
                raise RuntimeError('Archive path escaped allowed roots')
            try:
                current = source.stat()
                if (str(source.resolve()) not in allowed or current.st_mtime_ns != stat.st_mtime_ns
                        or current.st_size != stat.st_size):
                    skipped += 1
                    continue
                is_directory = source.is_dir()
                destination.parent.mkdir(parents=True, exist_ok=True)
                source.rename(destination)
                manifest.write(json.dumps({'version': 2, 'path': relative,
                    'directory': is_directory, 'bytes': stat.st_size, 'mtime': stat.st_mtime}) + '\n')
                manifest.flush()
                moved += 1
            except (PermissionError, FileNotFoundError):
                skipped += 1
    return {'archived': moved, 'skipped': skipped, 'archive': str(run)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()
    if args.days < 7:
        parser.error("Retention must be at least 7 days")
    workspace = Path(__file__).resolve().parents[1]
    selected = list(candidates(workspace, args.days))
    summary = {"apply": args.apply, "days": args.days, "files": len(selected),
               "bytes": sum(stat.st_size for _, _, stat in selected)}
    print(json.dumps(summary), flush=True)
    if not args.apply or not selected:
        return
    print(json.dumps(archive_candidates(workspace, selected)))


if __name__ == "__main__":
    main()
