"""Durable step-3 OCR jobs, handled by the existing single Digi worker."""
import hashlib
import hmac
import json
import logging
import secrets
import ntpath
from datetime import timedelta

from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import DigiJob
from .ocr import local_ocr, validate_ocr_results, OcrError, OcrNoTextError, OcrTimeoutError
from .scantailor import ScanTailorError
from .codex_ocr_review import create_ocr_review_refs

log = logging.getLogger(__name__)
FILE_TIMEOUT_SECONDS = 300
REQUEST_FIELDS = ('sourceFiles', 's3SourceFiles', 'preprocessedFiles', 'period', 'alphabet',
                  'preprocessWith', 'preprocessMode', 'ocrModel', 'ocrOptions')


def job_response(job, token=None, http_status=200):
    code = 200 if job.status == 'done' else 202
    if job.status == 'error':
        code = {'ocr_no_text': 422, 'ocr_timeout': 504, 'ocr_input': 400,
                'ocr_unavailable': 503}.get(job.error_code, 500)
    end = job.finished_at or timezone.now()
    body = {'id': str(job.id), 'status': job.status, 'code': code, 'msg': job.error,
            'error': job.error_code, 'createdAt': job.created_at.isoformat(),
            'elapsedSeconds': max(0, int((end - job.created_at).total_seconds())),
            'completedFiles': len(job.results), 'totalFiles': len(job.files),
            'timeoutSecondsPerFile': FILE_TIMEOUT_SECONDS}
    if token:
        body['token'] = token
    if job.error_code == 'ocr_no_text':
        item = job.files[min(len(job.results), len(job.files) - 1)]
        body['files'] = [str(item.get('originalName') or item['name']).replace('\\', '/').rsplit('/', 1)[-1]]
    if job.status == 'done':
        body.update(ocrResults=[item['ocr'] for item in job.results],
                    searchablePdfs=[item.get('pdf') for item in job.results],
                    ocrReviewRefs=create_ocr_review_refs(job.request_data, len(job.results)))
    response = JsonResponse(body, status=http_status)
    response['Cache-Control'] = 'no-store'
    return response


@csrf_exempt
@require_http_methods(['POST'])
def submit(request):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict):
            raise ValueError('Cererea OCR trebuie să fie un obiect JSON.')
        files = data.get('sourceFiles')
        if not isinstance(files, list) or not 1 <= len(files) <= 20:
            raise ValueError('Selectează între 1 și 20 de fișiere pentru OCR.')
        if any(not isinstance(item, dict) or not isinstance(item.get('name'), str)
               or not item['name'] or len(item['name']) > 1024 for item in files):
            raise ValueError('Lista fișierelor pentru OCR este invalidă.')
        for item in files:
            name = item['name'].replace('\\', '/')
            if '\x00' in name or ntpath.splitdrive(name)[0] or name.startswith('/') or '..' in name.split('/'):
                raise ValueError('Calea fișierului pentru OCR este invalidă.')
        payload = {key: data[key] for key in REQUEST_FIELDS if key in data}
        # Use the actual API origin instead of persisting an arbitrary supplied URL.
        payload['api'] = request.build_absolute_uri('/')
        token = secrets.token_urlsafe(32)
        job = DigiJob.objects.create(mode='ocr', files=files, request_data=payload,
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(hours=48))
        return job_response(job, token, 202)
    except (ValueError, TypeError, UnicodeDecodeError) as exc:
        return JsonResponse({'code': 400, 'msg': str(exc)}, status=400)


@require_http_methods(['GET'])
def status(request, job_id):
    try:
        job = DigiJob.objects.get(pk=job_id, mode='ocr')
    except DigiJob.DoesNotExist:
        return JsonResponse({'code': 404, 'msg': 'Cererea OCR nu există.'}, status=404)
    token = request.headers.get('Authorization', '').removeprefix('Bearer ')
    if not token or not hmac.compare_digest(hashlib.sha256(token.encode()).hexdigest(), job.token_hash):
        return JsonResponse({'code': 403, 'msg': 'Acces neautorizat la cererea OCR.'}, status=403)
    if job.expires_at <= timezone.now():
        return JsonResponse({'code': 410, 'msg': 'Cererea OCR a expirat. Reia recunoașterea.'}, status=410)
    return job_response(job)


def process_job(job):
    """Checkpoint every completed file so a worker restart does not repeat it."""
    if not job.started_at:
        job.started_at = timezone.now()
    job.status, job.error, job.error_code = 'processing', '', ''
    job.save(update_fields=['status', 'started_at', 'error', 'error_code', 'updated_at'])
    try:
        if job.expires_at <= timezone.now():
            raise OcrError('Cererea OCR a expirat. Reia recunoașterea.')
        for index in range(len(job.results), len(job.files)):
            data = dict(job.request_data)
            for field in ('sourceFiles', 's3SourceFiles', 'preprocessedFiles'):
                if isinstance(data.get(field), list):
                    data[field] = data[field][index:index + 1]
            result = local_ocr(data, settings.MEDIA_ROOT, timeout=FILE_TIMEOUT_SECONDS)
            texts = validate_ocr_results(result.get('ocrResults') if isinstance(result, dict) else result, data['sourceFiles'])
            if len(texts) != 1:
                raise OcrError('Motorul OCR nu a returnat un rezultat pentru fiecare fișier.')
            pdfs = result.get('searchablePdfs', []) if isinstance(result, dict) else []
            job.results = list(job.results) + [{'ocr': texts[0], 'pdf': pdfs[0] if pdfs else None}]
            job.save(update_fields=['results', 'updated_at'])
        job.status = 'done'
    except OcrNoTextError as exc:
        job.status, job.error, job.error_code = 'error', str(exc), 'ocr_no_text'
    except OcrTimeoutError as exc:
        job.status, job.error, job.error_code = 'error', str(exc), 'ocr_timeout'
    except ScanTailorError as exc:
        job.status, job.error = 'error', str(exc)
        job.error_code = 'ocr_input' if exc.status_code == 400 else 'ocr_unavailable'
    except (OcrError, ValueError, OSError) as exc:
        job.status, job.error, job.error_code = 'error', str(exc), 'ocr_failed'
    except Exception:
        log.exception('OCR job %s failed', job.id)
        job.status, job.error, job.error_code = 'error', 'Procesarea OCR a fost întreruptă. Poți reîncerca.', 'ocr_failed'
    job.finished_at = timezone.now()
    job.save(update_fields=['status', 'error', 'error_code', 'finished_at', 'updated_at'])
