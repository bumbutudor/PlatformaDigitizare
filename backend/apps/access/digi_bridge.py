"""Authenticated Digi jobs and a browser handoff scoped to one job.

Originals are held outside MEDIA_ROOT. The worker only stages complete files
under unique names in the existing FineReader inboxes. No historic files are
deleted or reused. A shared service credential never reaches the browser.
"""
import hashlib
import hmac
import json
import logging
import os
import shutil
import uuid
import tempfile
from datetime import timedelta
from pathlib import Path

import requests
from PIL import Image
from django.conf import settings
from django.http import JsonResponse
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import DigiJob
from .ocr import OcrError, validate_ocr_results, wait_for_finereader_text
from .utils import load_txt

log = logging.getLogger(__name__)
MAX_FILES = 20
MAX_BYTES = 100 * 1024 * 1024
ALLOWED_SUFFIXES = {'.pdf', '.jpg', '.jpeg', '.png', '.tif', '.tiff'}


def private_root():
    return Path(getattr(settings, 'DIGI_JOB_ROOT', Path(settings.BASE_DIR).parent / '.ops/digi-jobs'))


def service_key():
    return os.environ.get('DIGI_BRIDGE_KEY', '')


def service_authorized(request):
    key = service_key()
    return len(key) >= 32 and hmac.compare_digest(request.headers.get('X-Digi-Key', ''), key)


def error(message, status=400):
    return JsonResponse({'code': status, 'msg': message}, status=status)


def get_job(request, job_id, browser=False):
    if not browser and not service_authorized(request):
        raise PermissionError('Acces neautorizat.')
    job = DigiJob.objects.get(pk=job_id)
    if job.mode == 'ocr':
        raise DigiJob.DoesNotExist()
    if job.expires_at <= timezone.now():
        raise PermissionError('Legătura cu Digi a expirat. Reia conectarea din Digi.')
    if browser:
        value = request.headers.get('Authorization', '').removeprefix('Bearer ')
        if job.expires_at < timezone.now() or not hmac.compare_digest(
                hashlib.sha256(value.encode()).hexdigest(), job.token_hash):
            raise PermissionError('Legătura cu Digi a expirat. Reia conectarea din Digi.')
    return job


def job_json(job):
    response = JsonResponse({'id': str(job.id), 'status': job.status,
                            'results': job.results, 'msg': job.error,
                            'publication': job.publication})
    response['Cache-Control'] = 'no-store'
    return response


@csrf_exempt
@require_http_methods(['POST'])
def submit(request):
    if not service_authorized(request):
        return error('Acces neautorizat.', 403)
    try:
        job_id = uuid.UUID(request.POST['id'])
        mode = request.POST['mode']
        token = request.POST['handoff_token']
        metadata = json.loads(request.POST['files'])
        if not isinstance(metadata, list) or len({str(item['id']) for item in metadata}) != len(metadata):
            raise ValueError('Lista fișierelor este invalidă.')
        uploads = [request.FILES.get('document_' + str(i)) for i in range(len(metadata))]
        if mode not in ('simple', 'advanced') or len(token) < 32:
            raise ValueError('Cerere invalidă.')
        if not isinstance(metadata, list) or any(upload is None for upload in uploads):
            raise ValueError('Lista fișierelor nu corespunde documentelor încărcate.')
        if len(uploads) > MAX_FILES or (mode == 'simple' and not uploads):
            raise ValueError('Selectează între 1 și 20 de documente.')
        if sum(f.size for f in uploads) > MAX_BYTES:
            raise ValueError('Documentele depășesc limita de 100 MB per cerere.')
        existing = DigiJob.objects.filter(pk=job_id).first()
        if existing:
            return job_json(existing)
        root = private_root().resolve()
        root.mkdir(parents=True, exist_ok=True)
        # Each submit owns its temporary directory, including concurrent retries.
        # Invalid uploads never leave .upload files or an orphan job directory.
        with tempfile.TemporaryDirectory(prefix='.upload-', dir=root) as working:
            folder = Path(working)
            folder.resolve().relative_to(root)
            files = []
            for i, (meta, uploaded) in enumerate(zip(metadata, uploads)):
                suffix = Path(uploaded.name).suffix.lower()
                if suffix not in ALLOWED_SUFFIXES:
                    raise ValueError('Sunt acceptate PDF, JPG, PNG și TIFF.')
                destination = folder / (str(i) + suffix)
                temporary = folder / (str(uuid.uuid4()) + '.upload')
                with temporary.open('wb') as out:
                    for chunk in uploaded.chunks():
                        out.write(chunk)
                if suffix == '.pdf':
                    with temporary.open('rb') as check:
                        if not check.read(1024).lstrip().startswith(b'%PDF-'):
                            raise ValueError('Fișierul PDF este invalid.')
                else:
                    with Image.open(temporary) as check:
                        check.verify()
                os.replace(temporary, destination)
                files.append({'id': str(meta['id']), 'name': str(meta['name'])[:255],
                              'url': str(meta['url']), 'stored': destination.name})
            try:
                with transaction.atomic():
                    job = DigiJob.objects.create(
                        id=job_id, mode=mode, status='queued' if mode == 'simple' else 'advanced',
                        token_hash=hashlib.sha256(token.encode()).hexdigest(), files=files,
                        expires_at=timezone.now() + timedelta(hours=48))
                    destination = root / str(job_id)
                    if destination.exists():
                        raise ValueError('Există fișiere pentru această cerere. Reia trimiterea din Digi.')
                    folder.rename(destination)
            except IntegrityError:
                job = DigiJob.objects.get(pk=job_id)
        return job_json(job)
    except (ValueError, KeyError, TypeError, Image.UnidentifiedImageError) as exc:
        return error(str(exc))


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def status(request, job_id):
    try:
        job = get_job(request, job_id)
        if request.method == 'POST' and job.status == 'error' and job.mode == 'simple':
            job.status, job.error = 'queued', ''
            job.save(update_fields=['status', 'error', 'updated_at'])
        return job_json(job)
    except PermissionError as exc:
        return error(str(exc), 403)
    except DigiJob.DoesNotExist:
        return error('Cererea de digitizare nu există.', 404)


def stage(job, item, index, advanced=False):
    """Publish a complete, uniquely named input to Hot Folder by atomic rename."""
    original = private_root() / str(job.id) / item['stored']
    suffix = original.suffix.lower()
    name = f'digi_{job.id.hex}_{index}'
    is_pdf = suffix == '.pdf'
    if is_pdf:
        relative = Path('pdfs/secolulXX') / (name + '.pdf')
    else:
        relative = Path(name + '.png') if advanced else Path('pre/OpenCV/secolulXX') / (name + '.png')
    destination = Path(settings.MEDIA_ROOT) / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        temporary = destination.with_suffix('.pending')
        if is_pdf:
            shutil.copyfile(original, temporary)
        else:
            with Image.open(original) as image:
                if getattr(image, 'n_frames', 1) > 1:
                    # Preserve multi-page TIFFs by sending all pages to FineReader.
                    pages = []
                    for n in range(image.n_frames):
                        image.seek(n)
                        pages.append(image.convert('RGB'))
                    relative = Path('pdfs/secolulXX') / (name + '.pdf')
                    destination = Path(settings.MEDIA_ROOT) / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    temporary = destination.with_suffix('.pending')
                    pages[0].save(temporary, 'PDF', save_all=True, append_images=pages[1:], resolution=300)
                    is_pdf = True
                else:
                    image.convert('RGB').save(temporary, 'PNG', dpi=image.info.get('dpi', (300, 300)))
        os.replace(temporary, destination)
    return {'name': destination.name, 'originalName': item['name'], 'isPdf': is_pdf,
            'period': 'secolulXX', 'url': item['url'], 'size': destination.stat().st_size}


@csrf_exempt
@require_http_methods(['POST'])
def import_job(request, job_id):
    try:
        job = get_job(request, job_id, browser=True)
        if job.mode != 'advanced':
            return error('Această cerere nu este pentru procesare avansată.')
        files = [stage(job, item, i, advanced=True) for i, item in enumerate(job.files)]
        if any(file['isPdf'] for file in files):
            # The existing wizard skips image preprocessing for mixed PDF batches.
            for i, (item, staged) in enumerate(zip(job.files, files)):
                if not staged['isPdf']:
                    stage(job, item, i)
        response = JsonResponse({'code': 200, 'sourceFiles': files, 's3SourceFiles': files,
                                 'period': 'secolulXX', 'alphabet': 'cyrillic'})
        response['Cache-Control'] = 'no-store'
        return response
    except PermissionError as exc:
        return error(str(exc), 403)
    except DigiJob.DoesNotExist:
        return error('Cererea de digitizare nu există.', 404)


def process_job(job):
    from .views import transliterate_texts
    try:
        results = list(job.results)
        for i, item in enumerate(job.files):
            if any(result['id'] == item['id'] for result in results):
                continue
            staged = stage(job, item, i)
            paths = wait_for_finereader_text(
                [staged], str(Path(settings.MEDIA_ROOT) / 'ocr/secolulXX/cyrillic'), timeout=300)
            text = validate_ocr_results([load_txt(paths[0])], [staged])[0]
            transliterated = transliterate_texts([text], 'secolulXX', {'actualizeWordForm': True})[0]
            results.append({'id': item['id'], 'name': item['name'], 'ocr': text, 'trans': transliterated})
            job.results = results
            job.save(update_fields=['results', 'updated_at'])
        job.status, job.error = 'done', ''
    except (OcrError, requests.RequestException, ValueError) as exc:
        job.status, job.error = 'error', str(exc)
    except Exception:
        log.exception('Digi job %s failed', job.id)
        job.status, job.error = 'error', 'Procesarea a fost întreruptă. Rezultatele deja obținute sunt păstrate; poți reîncerca.'
    job.save(update_fields=['status', 'error', 'updated_at'])


@csrf_exempt
@require_http_methods(['POST'])
def publish(request):
    try:
        data = json.loads(request.body)
        job = get_job(request, uuid.UUID(data['digiJobId']), browser=True)
        texts = validate_ocr_results(data.get('ocrResults'), data.get('sourceFiles'))
        trans = data.get('transResults', [])
        if not isinstance(trans, list) or len(trans) != len(texts) or not all(isinstance(t, str) and t.strip() for t in trans):
            return error('Verifică textul recunoscut și transliterarea înainte de salvare.')
        payload = {'id': str(job.id), 'ocrResults': texts, 'transResults': trans,
                   'period': str(data.get('period', 'secolulXX')),
                   'sourceFiles': data.get('s3SourceFiles', [])}
        response = requests.post(
            'https://digi.emoldova.org/api/digitization/results', json=payload,
            headers={'X-Digi-Key': service_key()}, timeout=(10, 30))
        if response.status_code != 200:
            return error('Digi nu a confirmat salvarea. Rezultatele sunt păstrate aici; reîncearcă.', 502)
        publication = response.json()
        if not publication.get('draftId') or not str(publication.get('url', '')).startswith('https://digi.emoldova.org/'):
            return error('Digi a răspuns fără confirmarea documentului salvat.', 502)
        job.publication = publication
        job.save(update_fields=['publication', 'updated_at'])
        return JsonResponse({'code': 200, **publication})
    except PermissionError as exc:
        return error(str(exc), 403)
    except DigiJob.DoesNotExist:
        return error('Conectează contul Digi înainte de salvare.', 403)
    except (ValueError, KeyError, TypeError, OcrError):
        return error('Conectează contul Digi și verifică rezultatele înainte de salvare.')
    except requests.RequestException:
        return error('Digi este temporar indisponibil. Rezultatele sunt păstrate aici; reîncearcă.', 503)
