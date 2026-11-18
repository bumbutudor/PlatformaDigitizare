import base64
import hashlib
import json
import tempfile
from datetime import timedelta
from pathlib import Path
from unittest.mock import Mock, patch

import requests
from PIL import Image
from django.test import TestCase, override_settings
from django.utils import timezone

from . import gemini_ocr, ocr_jobs, ocr_cache
from .models import DigiJob
from .ocr import OcrNoTextError, OcrTimeoutError


@override_settings(GEMINI_API_KEY='test-key-never-publish', GEMINI_OCR_ENABLED=True,
                   GEMINI_OCR_MODEL='gemini-4-hydrogen', GEMINI_OCR_THINKING_LEVEL='medium')
class GeminiOcrTests(TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        setting = override_settings(MEDIA_ROOT=str(self.root))
        setting.enable()
        self.addCleanup(setting.disable)
        Image.new('RGB', (40, 40), 'white').save(self.root / 'original.png')
        self.data = {'sourceFiles': [{'name': 'original.png'}], 'period': 'secolulXX'}

    def reply(self, text='Текст', **changes):
        result = {'text': text, 'has_readable_text': True, 'complete': True, **changes}
        return Mock(status_code=200, json=lambda: {'status': 'completed', 'steps': [
            {'type': 'thought', 'content': [{'type': 'text', 'text': 'not OCR output'}]},
            {'type': 'model_output', 'content': [{'type': 'text', 'text': json.dumps(result)}]}]})

    def parent(self, **changes):
        return DigiJob.objects.create(mode='ocr', status='error', files=self.data['sourceFiles'],
            request_data=self.data, token_hash=hashlib.sha256(b'capability').hexdigest(),
            expires_at=timezone.now() + timedelta(hours=2), **changes)

    def retry(self, parent, consent=True, token='capability'):
        return self.client.post(f'/ocr/jobs/{parent.id}/gemini/', json.dumps({'consent': consent}),
            content_type='application/json', HTTP_AUTHORIZATION='Bearer ' + token)

    @patch('apps.access.gemini_ocr.requests.post')
    def test_reads_original_image_and_only_final_structured_transcription(self, post):
        post.return_value = self.reply()
        result = gemini_ocr.transcribe(self.data)
        self.assertEqual(result, {'ocrResults': ['Текст'], 'searchablePdfs': [None]})
        payload = post.call_args.kwargs['json']
        self.assertEqual(base64.b64decode(payload['input'][1]['data']), (self.root / 'original.png').read_bytes())
        self.assertFalse(payload['store'])
        self.assertNotIn('tools', payload)
        self.assertNotIn('test-key-never-publish', json.dumps(payload))
        self.assertEqual(payload['generation_config']['thinking_level'], 'medium')

    def test_thinking_level_separates_cached_results(self):
        data = {**self.data, 'ocrEngine': 'gemini'}
        medium = ocr_cache.identity(data)[1]
        with override_settings(GEMINI_OCR_THINKING_LEVEL='high'):
            self.assertNotEqual(ocr_cache.identity(data)[1], medium)

    @patch('apps.access.gemini_ocr.requests.post')
    def test_unreadable_or_incomplete_text_is_not_a_success(self, post):
        for result in (self.reply('', has_readable_text=False), self.reply('[ilizibil]')):
            post.return_value = result
            with self.assertRaises(OcrNoTextError):
                gemini_ocr.transcribe(self.data)
        post.return_value = self.reply('truncated', complete=False)
        with self.assertRaises(gemini_ocr.GeminiOcrError):
            gemini_ocr.transcribe(self.data)

    @patch('apps.access.gemini_ocr.requests.post')
    def test_timeout_and_provider_errors_do_not_expose_response_credentials(self, post):
        post.side_effect = requests.Timeout('private transport detail')
        with self.assertRaises(OcrTimeoutError):
            gemini_ocr.transcribe(self.data)
        post.side_effect = None
        post.return_value = Mock(status_code=429, text='test-key-never-publish')
        with self.assertRaises(gemini_ocr.GeminiOcrError) as raised:
            gemini_ocr.transcribe(self.data)
        self.assertIn('Limita Gemini', str(raised.exception))
        self.assertNotIn('test-key-never-publish', str(raised.exception))

    def test_pdf_uses_period_folder_and_paths_cannot_escape_media(self):
        pdf = self.root / 'pdfs/secolulXX/document.pdf'
        pdf.parent.mkdir(parents=True)
        pdf.write_bytes(b'%PDF-1.4\nfixture')
        data = {'sourceFiles': [{'name': 'document.pdf', 'isPdf': True}], 'period': 'secolulXX'}
        self.assertEqual(gemini_ocr.source_path(data), pdf)
        self.assertEqual(gemini_ocr.document_part(pdf)['type'], 'document')
        with self.assertRaises(gemini_ocr.GeminiOcrError):
            gemini_ocr.source_path({'sourceFiles': [{'name': '../secret.png'}]})

    @patch('apps.access.gemini_ocr.requests.post')
    def test_consent_capability_failure_and_configuration_are_required(self, post):
        parent = self.parent()
        self.assertEqual(self.retry(parent, token='wrong').status_code, 403)
        self.assertEqual(self.retry(parent, consent=False).status_code, 400)
        with override_settings(GEMINI_OCR_ENABLED=False):
            self.assertEqual(self.retry(parent).status_code, 503)
        parent.status = 'processing'
        parent.save()
        self.assertEqual(self.retry(parent).status_code, 409)
        parent.expires_at = timezone.now() - timedelta(seconds=1)
        parent.save()
        self.assertEqual(self.retry(parent).status_code, 410)
        self.assertEqual(DigiJob.objects.count(), 1)
        post.assert_not_called()

    @patch('apps.access.gemini_ocr.transcribe', return_value={'ocrResults': ['Gemini text'], 'searchablePdfs': [None]})
    @patch('apps.access.ocr_jobs.local_ocr')
    def test_fallback_is_idempotent_and_preserves_completed_files(self, local, gemini):
        self.data['sourceFiles'] = [{'name': 'done.png'}, {'name': 'original.png'}]
        parent = self.parent(results=[{'ocr': 'local text', 'pdf': 'done.pdf'}])
        receipt = self.retry(parent).json()
        self.assertEqual(self.retry(parent).json()['id'], receipt['id'])
        self.assertEqual(DigiJob.objects.count(), 2)
        job = DigiJob.objects.get(pk=receipt['id'])
        ocr_jobs.process_job(job)
        result = self.client.get(f'/ocr/jobs/{job.id}/', HTTP_AUTHORIZATION='Bearer capability').json()
        self.assertEqual(result['ocrResults'], ['local text', 'Gemini text'])
        self.assertEqual(result['searchablePdfs'], ['done.pdf', None])
        self.assertEqual(result['ocrEngine'], 'gemini')
        self.assertEqual(gemini.call_args.args[0]['sourceFiles'], [{'name': 'original.png'}])
        local.assert_not_called()

    @patch('apps.access.gemini_ocr.transcribe', side_effect=gemini_ocr.GeminiOcrError('Limit reached'))
    def test_gemini_failure_can_be_retried_with_a_new_child(self, gemini):
        receipt = self.retry(self.parent()).json()
        child = DigiJob.objects.get(pk=receipt['id'])
        ocr_jobs.process_job(child)
        child.refresh_from_db()
        self.assertEqual(child.status, 'error')
        self.assertEqual(child.error, 'Limit reached')
        self.assertNotEqual(self.retry(child).json()['id'], receipt['id'])

    def test_regular_submit_cannot_enable_gemini_without_consent(self):
        response = self.client.post('/ocr/', json.dumps({**self.data, 'ocrEngine': 'gemini'}), content_type='application/json')
        self.assertNotIn('ocrEngine', DigiJob.objects.get(pk=response.json()['id']).request_data)
