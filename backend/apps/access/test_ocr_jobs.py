import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from django.test import TestCase
from .models import DigiJob
from . import ocr_jobs
from .ocr import OcrTimeoutError


def run_queued_ocr(client, data, **kwargs):
    accepted = client.post('/ocr/', data=data, **kwargs)
    assert accepted.status_code == 202, accepted.content
    receipt = accepted.json()
    # These legacy endpoint tests isolate result/error handling; test_ocr_cache covers staging/reuse.
    def direct_result(data, runner):
        result = runner(data)
        return result if isinstance(result, dict) else {'ocrResults': result}
    with patch('apps.access.ocr_jobs.ocr_cache.recognize', side_effect=direct_result):
        ocr_jobs.process_job(DigiJob.objects.get(pk=receipt['id']))
    return client.get('/ocr/jobs/' + receipt['id'] + '/', HTTP_AUTHORIZATION='Bearer ' + receipt['token'])


class OcrQueueTests(TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        override = self.settings(MEDIA_ROOT=temporary.name)
        override.enable()
        self.addCleanup(override.disable)
        for name in ('page.png', 'a.png', 'b.png'):
            Path(temporary.name, name).write_bytes(name.encode())

    def submit(self, **extra):
        return self.client.post('/ocr/', json.dumps({'sourceFiles': [{'name': 'page.png'}],
            'period': 'secolulXX', 'alphabet': 'cyrillic', **extra}), content_type='application/json')

    def status(self, receipt):
        return self.client.get('/ocr/jobs/' + receipt['id'] + '/', HTTP_AUTHORIZATION='Bearer ' + receipt['token'])

    @patch('apps.access.ocr_jobs.local_ocr', return_value={'ocrResults': ['text'], 'searchablePdfs': ['page.pdf']})
    def test_submission_returns_immediately_and_worker_publishes_results(self, local):
        accepted = self.submit()
        self.assertEqual(accepted.status_code, 202)
        receipt = accepted.json()
        self.assertEqual(receipt['status'], 'queued')
        local.assert_not_called()
        ocr_jobs.process_job(DigiJob.objects.get(pk=receipt['id']))
        result = self.status(receipt).json()
        self.assertEqual(result['status'], 'done')
        self.assertEqual(result['ocrResults'], ['text'])
        self.assertEqual(result['searchablePdfs'], ['page.pdf'])
        self.assertEqual(local.call_args.kwargs['timeout'], 300)

    @patch('apps.access.ocr_jobs.local_ocr', side_effect=OcrTimeoutError('FineReader: page.png timeout după 300 de secunde'))
    def test_timeout_keeps_the_server_message(self, local):
        receipt = self.submit().json()
        ocr_jobs.process_job(DigiJob.objects.get(pk=receipt['id']))
        result = self.status(receipt).json()
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['code'], 504)
        self.assertIn('page.png timeout', result['msg'])
        self.assertNotIn('ocrResults', result)

    @patch('apps.access.ocr_jobs.local_ocr', return_value={'ocrResults': ['\ufeff ^ ']})
    def test_empty_text_is_an_error_and_retry_gets_a_new_job(self, local):
        first = self.submit().json()
        ocr_jobs.process_job(DigiJob.objects.get(pk=first['id']))
        failed = self.status(first).json()
        self.assertEqual(failed['error'], 'ocr_no_text')
        self.assertIn('page.png', failed['msg'])
        self.assertNotIn('searchablePdfs', failed)
        local.return_value = {'ocrResults': ['recunoscut']}
        retry = self.submit().json()
        self.assertNotEqual(first['id'], retry['id'])
        ocr_jobs.process_job(DigiJob.objects.get(pk=retry['id']))
        self.assertEqual(self.status(retry).json()['ocrResults'], ['recunoscut'])

    @patch('apps.access.ocr_jobs.local_ocr', return_value={'ocrResults': ['tesseract']})
    def test_tesseract_uses_the_same_queue(self, local):
        receipt = self.submit(ocrOptions={'useTesseract': True}).json()
        ocr_jobs.process_job(DigiJob.objects.get(pk=receipt['id']))
        self.assertTrue(local.call_args.args[0]['ocrOptions']['useTesseract'])
        self.assertEqual(self.status(receipt).json()['status'], 'done')

    @patch('apps.access.ocr_jobs.local_ocr', return_value={'ocrResults': ['second']})
    def test_worker_resumes_after_the_completed_file(self, local):
        receipt = self.submit(sourceFiles=[{'name': 'a.png'}, {'name': 'b.png'}]).json()
        job = DigiJob.objects.get(pk=receipt['id'])
        job.results = [{'ocr': 'first', 'pdf': None}]
        job.save()
        ocr_jobs.process_job(job)
        self.assertEqual(local.call_count, 1)
        self.assertEqual(local.call_args.args[0]['sourceFiles'], [{'name': 'b.png'}])
        self.assertEqual(self.status(receipt).json()['ocrResults'], ['first', 'second'])

    def test_status_requires_the_job_capability(self):
        receipt = self.submit().json()
        self.assertEqual(self.client.get('/ocr/jobs/' + receipt['id'] + '/').status_code, 403)
        self.assertEqual(self.status(receipt)['Cache-Control'], 'no-store')
        self.assertNotIn('token', self.status(receipt).json())

    def test_invalid_requests_do_not_enter_the_queue(self):
        self.assertEqual(self.submit(sourceFiles=[]).status_code, 400)
        self.assertEqual(self.submit(sourceFiles=[{'name': '../secret.txt'}]).status_code, 400)
        self.assertFalse(DigiJob.objects.exists())
