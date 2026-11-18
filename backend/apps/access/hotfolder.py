"""Period-specific Hot Folder inputs; publish only complete images."""
import os
import shutil
import tempfile
import uuid
from pathlib import Path

from django.conf import settings
from .scantailor import ScanTailorInputError, ScanTailorUnavailable, media_file, processed_ocr_paths

PERIODS = ('secolulXVII', 'secolulXVIII', 'secolulXIX', 'secolulXX')


def opencv_inbox(period):
    if period not in PERIODS:
        raise ScanTailorInputError('Selectează perioada documentului înainte de preprocesare.')
    return Path(settings.MEDIA_ROOT) / 'pre' / 'OpenCV' / period


def preprocess_opencv(data, processor):
    # Prepare outside watched inboxes. The OCR worker checks the cache before submission.
    opencv_inbox(data.get('period'))  # Validate the period.
    inbox = Path(settings.MEDIA_ROOT) / 'pre/OpenCV/prepared' / data['period']
    files = data.get('sourceFiles')
    if not isinstance(files, list) or not 1 <= len(files) <= 20:
        raise ScanTailorInputError('Selectează între 1 și 20 de imagini.')
    sources = [media_file(file['name'], settings.MEDIA_ROOT) for file in files]
    options = data.get('preprocessOpenCV') or {}
    resolution = int(options['resolution']) if options.get('setResolution') else None
    inbox.mkdir(parents=True, exist_ok=True)
    results = []
    # Work outside watched folders, then atomically expose the finished image.
    with tempfile.TemporaryDirectory(dir=settings.MEDIA_ROOT, prefix='.opencv-') as temporary:
        for source in sources:
            name = f'cv_{uuid.uuid4().hex}.png'
            working = Path(temporary) / name
            args = [str(source), str(working)]
            if resolution is not None:
                args.append(resolution)
            processor(*args)
            destination = inbox / name
            os.replace(working, destination)
            results.append(destination.relative_to(settings.MEDIA_ROOT).as_posix())
    return results


def other_processed_paths(data, media_root):
    values = data.get('preprocessedFiles')
    if all(file.get('isPdf') for file in data['sourceFiles']):
        return None
    if not values:
        return None
    if not isinstance(values, list) or len(values) != len(data['sourceFiles']):
        raise ScanTailorInputError('Rezultatele preprocesării nu corespund imaginilor. Reia pasul 2.')
    paths = []
    for index, value in enumerate(values):
        if isinstance(value, dict) and data.get('preprocessWith') == 'None':
            value = value.get('name')
        # Legacy FineReader responses used a leading slash on media-relative paths.
        if not isinstance(value, str):
            raise ScanTailorInputError('Calea imaginii preprocesate este invalidă.')
        value = value.lstrip('/')
        original = data['sourceFiles'][index]['name']
        if not value.startswith(('pre/OpenCV/', 'pre/FR/', 'out/')) and not (
                data.get('preprocessWith') == 'None' and value == original):
            raise ScanTailorInputError('Calea imaginii preprocesate este invalidă.')
        paths.append(media_file(value, media_root))
    return paths


def ocr_input_path(data, media_root=None):
    root = media_root or settings.MEDIA_ROOT
    processed = processed_ocr_paths(data, root) or other_processed_paths(data, root)
    if processed:
        return processed[0]
    name = data['sourceFiles'][0]['name']
    candidates = [name]
    if name.lower().endswith('.pdf') and data.get('period') in PERIODS:
        # Existing sessions uploaded PDFs directly to their period inbox.
        candidates.append('pdfs/' + data['period'] + '/' + Path(name).name)
    for candidate in candidates:
        try:
            return media_file(candidate, root)
        except ScanTailorInputError:
            continue
    raise ScanTailorInputError('Fișierul pentru OCR nu mai este disponibil. Încarcă-l din nou.')


def stage_ocr_input(source, period):
    """Only cache misses reach an inbox; every execution gets a fresh output name."""
    opencv_inbox(period)
    if source.suffix.lower() == '.pdf':
        inbox = Path(settings.MEDIA_ROOT) / 'pdfs' / period
    else:
        configured = settings.FINEREADER_SCANTAILOR_INPUT_DIRS.get(period)
        if not configured:
            raise ScanTailorUnavailable('Nu există un Hot Folder pentru perioada selectată.')
        inbox = Path(configured)
    inbox.mkdir(parents=True, exist_ok=True)
    destination = inbox / ('ocr_' + uuid.uuid4().hex + source.suffix.lower())
    temporary = destination.with_suffix('.pending')
    try:
        shutil.copyfile(source, temporary)
        os.replace(temporary, destination)
    finally:
        if temporary.exists():
            temporary.unlink()
    return destination
