import hashlib
import io
import json
import os
import tempfile
import uuid
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch, Mock

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
import requests

from .models import DigiJob
from . import digi_bridge as bridge


class DigiBridgeTests(TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        settings = override_settings(MEDIA_ROOT=str(self.root / 'media'), DIGI_JOB_ROOT=self.root / 'private')
        settings.enable()
        self.addCleanup(settings.disable)
        env = patch.dict(os.environ, {'DIGI_BRIDGE_KEY': 's' * 64})
        env.start()
        self.addCleanup(env.stop)
        self.token = 'a' * 64

    def submit(self, name='document cu spații.png', mode='simple', job_id=None, **headers):
        raw = io.BytesIO()
        Image.new('RGB', (40, 40), 'white').save(raw, 'PNG')
        return self.client.post('/digi/jobs/', {
            'id': str(job_id or uuid.uuid4()), 'mode': mode, 'handoff_token': self.token,
            'files': json.dumps([{'id': '42', 'name': name, 'url': 'https://digi.emoldova.org/assets/files/test.png'}]),
            'document_0': SimpleUploadedFile(name, raw.getvalue(), content_type='image/png'),
        }, **headers)

    def authorized_submit(self, **kwargs):
        return self.submit(HTTP_X_DIGI_KEY='s' * 64, **kwargs)

    def job(self, mode='advanced'):
        return DigiJob.objects.create(mode=mode, status=mode,
            token_hash=hashlib.sha256(self.token.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(hours=48))

    def publish(self, job, **payload):
        return self.client.post('/publish/', json.dumps({
            'digiJobId': str(job.id), 'ocrResults': ['Тест'], 'transResults': ['Test'],
            's3SourceFiles': [{'url': 'https://digi.emoldova.org/assets/files/test.png'}], **payload,
        }), content_type='application/json', HTTP_AUTHORIZATION='Bearer ' + self.token)

    def test_service_endpoints_reject_missing_or_wrong_credentials(self):
        self.assertEqual(self.submit().status_code, 403)
        self.assertEqual(self.submit(HTTP_X_DIGI_KEY='wrong').status_code, 403)
        self.assertFalse(DigiJob.objects.exists())
        job = self.job()
        self.assertEqual(self.client.get(f'/digi/jobs/{job.id}/').status_code, 403)

    def test_submitting_same_id_is_idempotent(self):
        job_id = uuid.uuid4()
        self.assertEqual(self.authorized_submit(job_id=job_id).status_code, 200)
        self.assertEqual(self.authorized_submit(job_id=job_id).status_code, 200)
        self.assertEqual(DigiJob.objects.count(), 1)

    def test_same_filename_in_two_jobs_never_shares_output_name(self):
        first = self.authorized_submit().json()['id']
        second = self.authorized_submit().json()['id']
        one, two = DigiJob.objects.get(pk=first), DigiJob.objects.get(pk=second)
        a = bridge.stage(one, one.files[0], 0)
        b = bridge.stage(two, two.files[0], 0)
        self.assertNotEqual(a['name'], b['name'])
        self.assertEqual(a['originalName'], 'document cu spații.png')
        self.assertTrue((self.root / 'media' / a['name']).is_file())
        self.assertTrue(a['name'].startswith('pre/OpenCV/prepared/secolulXX/'))
        self.assertFalse((self.root / 'media/pre/OpenCV/secolulXX').exists())

    def test_handoff_is_scoped_and_expires(self):
        response = self.authorized_submit(mode='advanced')
        job = DigiJob.objects.get(pk=response.json()['id'])
        url = f'/digi/jobs/{job.id}/import/'
        self.assertEqual(self.client.post(url).status_code, 403)
        self.assertEqual(self.client.post(url, HTTP_AUTHORIZATION='Bearer wrong').status_code, 403)
        self.assertEqual(self.client.post(url, HTTP_AUTHORIZATION='Bearer ' + self.token).status_code, 200)
        job.expires_at = timezone.now() - timedelta(seconds=1)
        job.save()
        self.assertEqual(self.client.post(url, HTTP_AUTHORIZATION='Bearer ' + self.token).status_code, 403)

    def test_advanced_job_is_not_queued_for_automatic_ocr(self):
        data = self.authorized_submit(mode='advanced').json()
        self.assertEqual(data['status'], 'advanced')
        self.assertFalse(DigiJob.objects.filter(status='queued').exists())

    def test_invalid_image_is_rejected(self):
        response = self.client.post('/digi/jobs/', {
            'id': str(uuid.uuid4()), 'mode': 'simple', 'handoff_token': self.token,
            'files': json.dumps([{'id': '1', 'name': 'bad.png', 'url': 'https://digi.emoldova.org/a'}]),
            'document_0': SimpleUploadedFile('bad.png', b'not an image'),
        }, HTTP_X_DIGI_KEY='s' * 64)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(DigiJob.objects.exists())
        self.assertEqual(list((self.root / 'private').glob('**/*')), [])

    @patch('apps.access.digi_bridge.requests.post')
    def test_empty_ocr_never_saves_a_draft(self, post):
        response = self.publish(self.job(), ocrResults=[' ^\ufeff '])
        self.assertEqual(response.status_code, 400)
        post.assert_not_called()

    @patch('apps.access.digi_bridge.requests.post')
    def test_success_requires_confirmed_draft_id_and_url(self, post):
        post.return_value = Mock(status_code=200, json=lambda: {'msg': 'ok'})
        job = self.job()
        self.assertEqual(self.publish(job).status_code, 502)
        job.refresh_from_db()
        self.assertEqual(job.publication, {})
        post.return_value = Mock(status_code=200, json=lambda: {
            'draftId': '12', 'url': 'https://digi.emoldova.org/digitizare/rezultat/12'})
        response = self.publish(job)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['draftId'], '12')
        job.refresh_from_db()
        self.assertEqual(job.publication['draftId'], '12')

    @patch('apps.access.digi_bridge.requests.post', side_effect=requests.Timeout)
    def test_publication_failure_preserves_job(self, post):
        job = self.job()
        self.assertEqual(self.publish(job).status_code, 503)
        self.assertTrue(DigiJob.objects.filter(pk=job.id).exists())

    @patch('apps.access.views.transliterate_texts', return_value=['Test'])
    @patch('apps.access.ocr_cache.engine_signature', return_value='fixture-model')
    @patch('apps.access.digi_bridge.local_ocr')
    def test_identical_digi_uploads_reuse_ocr_including_the_pdf(self, engine, signature, transliterate):
        pdf = self.root / 'media/ocr/generated.pdf'
        pdf.parent.mkdir(parents=True)
        pdf.write_bytes(b'%PDF-1.4\nfixture')
        def recognized(data, *args, **kwargs):
            return {'ocrResults': ['text'], 'searchablePdfs': [data['api'] + 'media/ocr/generated.pdf']}
        engine.side_effect = recognized
        first = DigiJob.objects.get(pk=self.authorized_submit().json()['id'])
        second = DigiJob.objects.get(pk=self.authorized_submit(name='renamed.png').json()['id'])
        bridge.process_job(first)
        bridge.process_job(second)
        self.assertEqual(first.status, 'done')
        self.assertEqual(second.status, 'done')
        self.assertTrue(second.results[0]['cached'])
        self.assertEqual(engine.call_count, 1)

    @patch('apps.access.views.transliterate_texts', return_value=['Test'])
    @patch('apps.access.digi_bridge.local_ocr', return_value={'ocrResults': ['Тест']})
    def test_worker_persists_completed_file_and_does_not_reprocess_on_resume(self, engine, transliterate):
        job = DigiJob.objects.get(pk=self.authorized_submit().json()['id'])
        bridge.process_job(job)
        job.refresh_from_db()
        self.assertEqual(job.status, 'done')
        self.assertEqual(job.results[0]['id'], '42')
        bridge.process_job(job)
        self.assertEqual(engine.call_count, 1)

    @patch('apps.access.views.transliterate_texts')
    @patch('apps.access.digi_bridge.local_ocr', return_value={'ocrResults': ['^^^']})
    def test_worker_reports_no_recognized_text_with_original_filename(self, engine, transliterate):
        job = DigiJob.objects.get(pk=self.authorized_submit().json()['id'])
        bridge.process_job(job)
        job.refresh_from_db()
        self.assertEqual(job.status, 'error')
        self.assertIn('document cu spații.png', job.error)
        self.assertEqual(job.results, [])
        transliterate.assert_not_called()
