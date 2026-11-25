import json
import tempfile
from datetime import timedelta
from pathlib import Path
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from . import ocr_cache, ocr_jobs
from .hotfolder import stage_ocr_input
from .models import OcrCacheEntry, DigiJob
from .ocr import OcrNoTextError, OcrTimeoutError
from .scantailor import ScanTailorInputError


@override_settings(OCR_CACHE_ENABLED=True, OCR_CACHE_DAYS=7, OCR_CACHE_REVISION='test-v1')
class OcrCacheTests(TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        override = override_settings(MEDIA_ROOT=str(self.root), FINEREADER_SCANTAILOR_INPUT_DIRS={
            'secolulXX': str(self.root / 'pre/OpenCV/secolulXX')})
        override.enable()
        self.addCleanup(override.disable)
        model = patch('apps.access.ocr_cache.engine_signature', return_value='model-v1')
        self.model = model.start()
        self.addCleanup(model.stop)
        self.path = self.root / 'page.png'
        self.path.write_bytes(b'first document bytes')
        self.data = {'sourceFiles': [{'name': 'page.png'}], 'period': 'secolulXX',
                     'alphabet': 'cyrillic', 'ocrOptions': {}, 'api': 'https://current.example/'}
        self.runner = Mock(return_value={'ocrResults': ['recognized text'], 'searchablePdfs': [None]})

    def test_same_bytes_under_another_name_reuse_the_success(self):
        first = ocr_cache.recognize(self.data, self.runner)
        (self.root / 'renamed.png').write_bytes(self.path.read_bytes())
        second = ocr_cache.recognize({**self.data, 'sourceFiles': [{'name': 'renamed.png'}]}, self.runner)
        self.assertFalse(first['cached'])
        self.assertTrue(second['cached'])
        self.assertEqual(second['ocrResults'], ['recognized text'])
        self.assertEqual(self.runner.call_count, 1)

    def test_same_filename_with_different_content_does_not_reuse_old_text(self):
        ocr_cache.recognize(self.data, self.runner)
        self.path.write_bytes(b'a different document')
        self.assertFalse(ocr_cache.recognize(self.data, self.runner)['cached'])
        self.assertEqual(self.runner.call_count, 2)

    def test_missing_input_never_uses_an_old_same_name_output(self):
        self.path.rename(self.root / 'removed-source.png')
        with self.assertRaises(ScanTailorInputError):
            ocr_cache.recognize(self.data, self.runner)
        self.runner.assert_not_called()

    def test_period_preprocessing_and_model_changes_invalidate_the_key(self):
        original = ocr_cache.identity(self.data)[1]
        for changes in ({'period': 'secolulXIX'}, {'ocrOptions': {'useTesseract': True}},
                        {'preprocessOpenCV': {'resolution': 600}}, {'ocrModel': 'another'}):
            self.assertNotEqual(ocr_cache.identity({**self.data, **changes})[1], original)
        self.model.return_value = 'updated-model'
        self.assertNotEqual(ocr_cache.identity(self.data)[1], original)

    def test_empty_failed_and_changed_during_processing_results_are_not_cached(self):
        for result in ({'ocrResults': [' ^ ']}, OcrTimeoutError('timeout')):
            runner = Mock(side_effect=result) if isinstance(result, Exception) else Mock(return_value=result)
            with self.assertRaises((OcrNoTextError, OcrTimeoutError)):
                ocr_cache.recognize(self.data, runner)
        self.assertFalse(OcrCacheEntry.objects.exists())
        def changed(data):
            self.path.write_bytes(b'changed while running')
            return {'ocrResults': ['text']}
        ocr_cache.recognize(self.data, changed)
        self.assertFalse(OcrCacheEntry.objects.exists())

    def test_force_and_expiration_run_again(self):
        ocr_cache.recognize(self.data, self.runner)
        self.assertFalse(ocr_cache.recognize({**self.data, 'forceOcr': True}, self.runner)['cached'])
        OcrCacheEntry.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertFalse(ocr_cache.recognize(self.data, self.runner)['cached'])
        self.assertEqual(self.runner.call_count, 3)

    def test_pdf_is_kept_independently_and_returned_with_the_current_api_origin(self):
        pdf = self.root / 'ocr/first.pdf'
        pdf.parent.mkdir()
        pdf.write_bytes(b'%PDF-1.4\noriginal PDF')
        self.runner.return_value = {'ocrResults': ['text'], 'searchablePdfs': ['https://old.example/media/ocr/first.pdf']}
        ocr_cache.recognize(self.data, self.runner)
        pdf.rename(self.root / 'archived-original.pdf')
        cached = ocr_cache.recognize(self.data, self.runner)
        self.assertTrue(cached['cached'])
        self.assertTrue(cached['searchablePdfs'][0].startswith('https://current.example/media/ocr/cache/'))
        entry = OcrCacheEntry.objects.get()
        (self.root / entry.pdf_path).write_bytes(b'corrupt PDF')
        self.runner.return_value = {'ocrResults': ['fresh text'], 'searchablePdfs': [None]}
        self.assertFalse(ocr_cache.recognize(self.data, self.runner)['cached'])

    def test_submit_returns_all_cached_results_without_queueing_ocr(self):
        ocr_cache.recognize(self.data, self.runner)
        response = self.client.post('/ocr/', json.dumps(self.data), content_type='application/json')
        self.assertEqual(response.status_code, 202)
        result = response.json()
        self.assertEqual(result['status'], 'done')
        self.assertEqual(result['cachedFiles'], 1)
        self.assertEqual(result['ocrResults'], ['recognized text'])
        self.assertFalse(DigiJob.objects.filter(status='queued').exists())

    def test_duplicate_queued_jobs_use_one_execution(self):
        one = self.client.post('/ocr/', json.dumps(self.data), content_type='application/json').json()
        two = self.client.post('/ocr/', json.dumps(self.data), content_type='application/json').json()
        with patch('apps.access.ocr_jobs.local_ocr', self.runner):
            ocr_jobs.process_job(DigiJob.objects.get(pk=one['id']))
            ocr_jobs.process_job(DigiJob.objects.get(pk=two['id']))
        self.assertEqual(self.runner.call_count, 1)
        self.assertTrue(DigiJob.objects.get(pk=two['id']).results[0]['cached'])

    def test_fresh_execution_never_waits_for_an_older_same_name_output(self):
        first = stage_ocr_input(self.path, 'secolulXX')
        self.path.write_bytes(b'changed')
        second = stage_ocr_input(self.path, 'secolulXX')
        self.assertNotEqual(first.name, second.name)
        self.assertEqual(second.read_bytes(), b'changed')

    @patch('apps.access.views.s3_uploader.upload_file', return_value='https://example/document.pdf')
    def test_pdf_upload_does_not_trigger_hotfolder_before_cache_lookup(self, upload):
        response = self.client.post('/upload/', {'period': 'secolulXX',
            'uploadedFiles': SimpleUploadedFile('document.pdf', b'%PDF-1.4\nfixture')})
        self.assertEqual(response.status_code, 200)
        name = response.json()['s3File']['name']
        self.assertTrue(name.startswith('pdfs/prepared/secolulXX/'))
        self.assertTrue((self.root / name).is_file())
        self.assertFalse((self.root / 'pdfs/secolulXX').exists())

    def test_runtime_hotfolder_status_does_not_change_the_model_fingerprint(self):
        task = self.root / 'task.hft'
        task.write_text('<task status="scheduled"><engine><analyzeRecognize model="a"/></engine></task>')
        one = ocr_cache._hotfolder_digest(str(task), task.stat().st_size, task.stat().st_mtime_ns)
        task.write_text('<task status="processing"><engine><analyzeRecognize model="a"/></engine></task>')
        two = ocr_cache._hotfolder_digest(str(task), task.stat().st_size, task.stat().st_mtime_ns)
        self.assertEqual(one, two)
        task.write_text('<task status="processing"><engine><analyzeRecognize model="b"/></engine></task>')
        three = ocr_cache._hotfolder_digest(str(task), task.stat().st_size, task.stat().st_mtime_ns)
        self.assertNotEqual(one, three)
