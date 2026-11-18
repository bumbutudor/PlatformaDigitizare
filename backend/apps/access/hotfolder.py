"""Period-specific Hot Folder inputs; publish only complete images."""
import os
import tempfile
import uuid
from pathlib import Path

from django.conf import settings
from .scantailor import ScanTailorInputError, media_file

PERIODS = ('secolulXVII', 'secolulXVIII', 'secolulXIX', 'secolulXX')


def opencv_inbox(period):
    if period not in PERIODS:
        raise ScanTailorInputError('Selectează perioada documentului înainte de preprocesare.')
    return Path(settings.MEDIA_ROOT) / 'pre' / 'OpenCV' / period


def preprocess_opencv(data, processor):
    inbox = opencv_inbox(data.get('period'))
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
