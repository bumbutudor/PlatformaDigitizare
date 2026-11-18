"""Content-based OCR reuse. Failed/empty results and guessed filename matches never enter it."""
import hashlib
import json
import logging
import os
import re
import shutil
import uuid
from datetime import timedelta
from functools import lru_cache
from pathlib import Path
from urllib.parse import unquote, urlsplit, quote
from xml.etree import ElementTree as ET

from django.conf import settings
from django.db import DatabaseError
from django.utils import timezone

from .models import OcrCacheEntry
from .hotfolder import ocr_input_path
from .scantailor import ScanTailorError, media_file

log = logging.getLogger(__name__)


def file_digest(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


@lru_cache(maxsize=64)
def _model_digest(path, size, modified):
    return file_digest(Path(path))


def model_file_digest(path):
    stat = path.stat()
    return _model_digest(str(path.resolve()), stat.st_size, stat.st_mtime_ns)


@lru_cache(maxsize=32)
def _hotfolder_config(path, size, modified):
    root = ET.parse(path).getroot()
    engine = next(iter(root))
    digest = hashlib.sha256()
    # Runtime status/last-run timestamps live on the task root; exclude them.
    for child in engine:
        if child.tag.rsplit('}', 1)[-1] in ('openBatch', 'analyzeRecognize', 'saveStepsCollection'):
            digest.update(ET.tostring(child, encoding='utf-8'))
    external_paths = []
    for element in engine.iter():
        for key, value in element.attrib.items():
            if key.lower().endswith('path') and value and len(value) < 1024:
                external = Path(value)
                if external.is_file():
                    external_paths.append(str(external))
    return digest.hexdigest(), tuple(external_paths)


def _hotfolder_digest(path, size, modified):
    configuration, external_paths = _hotfolder_config(path, size, modified)
    digest = hashlib.sha256(configuration.encode())
    for external in external_paths:
        digest.update(model_file_digest(Path(external)).encode())
    return digest.hexdigest()


def engine_signature(data, path):
    from . import gemini_ocr, ocr
    if data.get('ocrEngine') == 'gemini':
        return ':'.join(('gemini', gemini_ocr.model_name(), gemini_ocr.thinking_level(),
                         model_file_digest(Path(gemini_ocr.__file__))))
    implementation = model_file_digest(Path(ocr.__file__))
    if (data.get('ocrOptions') or {}).get('useTesseract'):
        import pytesseract
        executable = shutil.which(pytesseract.pytesseract.tesseract_cmd)
        if not executable:
            return None
        tessdata = Path(os.environ.get('TESSDATA_PREFIX') or str(Path(executable).parent / 'tessdata'))
        model = tessdata / 'RTS_from_Cyrillic.traineddata'
        if not model.is_file():
            return None
        return ':'.join(('tesseract', implementation, model_file_digest(Path(executable)), model_file_digest(model)))
    period = str(data.get('period') or '').removeprefix('secolul')
    suffix = '_PDF' if path.suffix.lower() == '.pdf' else '_OpenCV'
    config = Path(settings.FINEREADER_HOTFOLDER_CONFIG_DIR)
    for task in sorted(config.glob('*.hft')):
        with task.open('rb') as stream:
            header = stream.read(4096)
        encoding = 'utf-16' if header.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig'
        name = re.search(r'\bname="([^"]+)"', header.decode(encoding, errors='ignore'))
        if name and name[1].startswith('Sec' + period + '_') and name[1].endswith(suffix):
            stat = task.stat()
            model = _hotfolder_digest(str(task), stat.st_size, stat.st_mtime_ns)
            return ':'.join(('finereader', implementation, model))
    # Unknown local model/configuration: process normally, without unsafe reuse.
    return None


def identity(data):
    """Hash actual engine input and options, never the original filename or job ID."""
    from . import gemini_ocr
    path = gemini_ocr.source_path(data) if data.get('ocrEngine') == 'gemini' else ocr_input_path(data)
    try:
        signature = engine_signature(data, path) if settings.OCR_CACHE_ENABLED else None
    except (OSError, ValueError, ET.ParseError):
        return path, None
    if not signature:
        return path, None
    options = {key: data.get(key) for key in ('period', 'alphabet', 'ocrModel', 'ocrOptions',
               'preprocessWith', 'preprocessMode', 'preprocessOpenCV', 'preprocessScanTailor', 'preprocessFR')}
    payload = {'version': settings.OCR_CACHE_REVISION, 'input': file_digest(path),
               'engine': signature, 'options': options}
    return path, hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def _expiry():
    return timezone.now() + timedelta(days=settings.OCR_CACHE_DAYS)


def lookup(key, data):
    from .ocr import has_ocr_text
    entry = OcrCacheEntry.objects.filter(pk=key, expires_at__gt=timezone.now()).first()
    if not entry or not has_ocr_text(entry.text):
        return None
    pdf = None
    if entry.pdf_path:
        try:
            artifact = media_file(entry.pdf_path)
            if file_digest(artifact) != entry.pdf_digest:
                return None
            pdf = data.get('api', '').rstrip('/') + '/media/' + quote(entry.pdf_path, safe='/')
        except (ScanTailorError, OSError):
            return None
    OcrCacheEntry.objects.filter(pk=key).update(last_used_at=timezone.now(), expires_at=_expiry())
    return {'ocrResults': [entry.text], 'searchablePdfs': [pdf], 'cached': True}


def save_result(key, data, result):
    from .ocr import validate_ocr_results
    text = validate_ocr_results(result['ocrResults'], data['sourceFiles'])[0]
    pdf = (result.get('searchablePdfs') or [None])[0]
    relative, digest = '', ''
    if pdf:
        url_path = unquote(urlsplit(pdf).path)
        if '/media/' not in url_path:
            return  # An unverified artifact must never become a cache hit.
        source = media_file(url_path.split('/media/', 1)[1])
        folder = Path(settings.MEDIA_ROOT) / 'ocr/cache' / key
        folder.mkdir(parents=True, exist_ok=True)
        destination = folder / (uuid.uuid4().hex + '.pdf')
        temporary = destination.with_suffix('.pending')
        try:
            shutil.copyfile(source, temporary)
            digest = file_digest(temporary)
            os.replace(temporary, destination)
        finally:
            if temporary.exists():
                temporary.unlink()
        relative = destination.relative_to(settings.MEDIA_ROOT).as_posix()
    OcrCacheEntry.objects.update_or_create(key=key, defaults={'text': text, 'pdf_path': relative,
        'pdf_digest': digest, 'last_used_at': timezone.now(), 'expires_at': _expiry()})


def recognize(data, runner):
    """The single durable worker serializes misses; later duplicate jobs reuse the first success."""
    from .ocr import validate_ocr_results, OcrError
    path, key = None, None
    try:
        path, key = identity(data)
        if settings.OCR_CACHE_ENABLED and key and not data.get('forceOcr'):
            result = lookup(key, data)
            if result:
                return result
    except (OSError, ValueError, OcrError, ET.ParseError, DatabaseError):
        log.warning('OCR cache lookup unavailable; processing this file normally.')
    if path is None:
        # A missing/invalid source must never fall back to an old TXT with the same name.
        from . import gemini_ocr
        path = gemini_ocr.source_path(data) if data.get('ocrEngine') == 'gemini' else ocr_input_path(data)
    execution = dict(data)
    if path and data.get('ocrEngine') != 'gemini':
        execution['_ocr_input_path'] = path.relative_to(settings.MEDIA_ROOT).as_posix()
    result = runner(execution)
    if not isinstance(result, dict):
        result = {'ocrResults': result, 'searchablePdfs': []}
    result['ocrResults'] = validate_ocr_results(result.get('ocrResults'), data['sourceFiles'])
    if len(result['ocrResults']) != 1:
        raise OcrError('Motorul OCR nu a returnat un rezultat pentru fiecare fișier.')
    if settings.OCR_CACHE_ENABLED and key:
        try:
            # Do not associate output with an input/model changed during recognition.
            if identity(data)[1] == key:
                save_result(key, data, result)
        except (OSError, ValueError, OcrError, ScanTailorError, DatabaseError):
            log.warning('OCR succeeded but its cache entry could not be saved.')
    return {**result, 'cached': False}


def cached_prefix(data, completed=None):
    """Return immediately reusable leading files before exposing a queued job to the worker."""
    results = list(completed or [])
    from .ocr import OcrError
    if not settings.OCR_CACHE_ENABLED or data.get('forceOcr'):
        return results
    for index in range(len(results), len(data['sourceFiles'])):
        single = dict(data)
        for field in ('sourceFiles', 's3SourceFiles', 'preprocessedFiles'):
            if isinstance(single.get(field), list):
                single[field] = single[field][index:index + 1]
        try:
            _, key = identity(single)
            hit = lookup(key, single) if key else None
        except (OSError, ValueError, OcrError, ScanTailorError, DatabaseError, ET.ParseError):
            break
        if not hit:
            break
        results.append({'ocr': hit['ocrResults'][0], 'pdf': hit['searchablePdfs'][0], 'cached': True})
    return results
