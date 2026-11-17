"""Archive obsolete generated media outside the watched folders (dry run by default)."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import time
from urllib.parse import unquote, urlsplit

FOLDERS = ("ocr", "pre", "out", "pdfs")
EXTENSIONS = {".txt", ".pdf", ".docx", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}


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


def candidates(workspace, days):
    media = (workspace / "backend/media").resolve()
    cutoff = time.time() - days * 86400
    protected, documents = protected_paths(workspace)
    for folder in FOLDERS:
        root = media / folder
        if root.is_symlink() or not inside(root, media):
            raise RuntimeError("Unsafe media folder: " + str(root))
        for directory, dirs, files in os.walk(root, followlinks=False):
            dirs[:] = [name for name in dirs if not Path(directory, name).is_symlink()
                       and name.lower() not in {"models", "ocr_models", "dictionaries"}]
            for name in files:
                path = Path(directory, name)
                if path.is_symlink() or not inside(path, root) or path.suffix.lower() not in EXTENSIONS:
                    continue
                if path.resolve() in protected:
                    continue
                relative = path.relative_to(media).as_posix()
                if any(relative in document.replace("\\", "/") for document in documents):
                    continue
                stat = path.stat()
                if stat.st_mtime < cutoff:
                    yield path, relative, stat


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
    archive_root = workspace / ".ops/media-archive"
    if archive_root.is_symlink() or not inside(archive_root, workspace / ".ops"):
        raise RuntimeError("Unsafe archive root")
    run = archive_root / dt.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    run.mkdir(parents=True, exist_ok=False)
    moved = skipped = 0
    with (run / "manifest.jsonl").open("w", encoding="utf-8") as manifest:
        for source, relative, stat in selected:
            destination = run / relative
            # Check resolved paths and modification time again immediately before moving.
            if not inside(source, workspace / "backend/media") or not inside(destination, run):
                raise RuntimeError("Archive path escaped allowed roots")
            try:
                current = source.stat()
                if current.st_mtime_ns != stat.st_mtime_ns or current.st_size != stat.st_size:
                    skipped += 1
                    continue
                destination.parent.mkdir(parents=True, exist_ok=True)
                source.rename(destination)
                manifest.write(json.dumps({"path": relative, "bytes": stat.st_size,
                                           "mtime": stat.st_mtime}) + "\n")
                manifest.flush()
                moved += 1
            except (PermissionError, FileNotFoundError):
                # A file in use or already removed will be reconsidered next run.
                skipped += 1
    print(json.dumps({"archived": moved, "skipped": skipped, "archive": str(run)}))


if __name__ == "__main__":
    main()
