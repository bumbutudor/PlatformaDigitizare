import tempfile
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase
from .hotfolder import PERIODS, preprocess_opencv, other_processed_paths
from .scantailor import ScanTailorInputError
from .ocr import local_ocr, wait_for_finereader_text, OcrTimeoutError


class HotFolderRoutingTests(SimpleTestCase):
    def test_timeout_names_the_original_document(self):
        with tempfile.TemporaryDirectory() as folder, self.assertRaises(OcrTimeoutError) as failure:
            wait_for_finereader_text([{'name': 'cv_random.png', 'originalName': 'document cu spatii.png'}],
                                     folder, timeout=0)
        self.assertIn('document cu spatii.png', str(failure.exception))
        self.assertNotIn('cv_random', str(failure.exception))

    def test_each_period_gets_only_complete_unique_images(self):
        with tempfile.TemporaryDirectory() as temporary, self.settings(MEDIA_ROOT=temporary):
            root = Path(temporary)
            (root / 'document cu spatii.png').write_bytes(b'original')
            names = []
            for period in PERIODS:
                def processor(source, output):
                    self.assertEqual(list((root / 'pre/OpenCV' / period).iterdir()), [])
                    Path(output).write_bytes(b'processed')
                data = {'period': period, 'sourceFiles': [{'name': 'document cu spatii.png'}]}
                relative = preprocess_opencv(data, processor)[0]
                self.assertEqual(Path(relative).parent.as_posix(), 'pre/OpenCV/' + period)
                self.assertEqual((root / relative).read_bytes(), b'processed')
                names.append(Path(relative).name)
            self.assertEqual(len(set(names)), 4)

    def test_processed_paths_reject_escape(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(ScanTailorInputError):
                other_processed_paths({'sourceFiles': [{'name': 'page.png'}],
                    'preprocessedFiles': ['pre/OpenCV/../../../outside.png']}, root)

    def test_tesseract_uses_processed_image_without_staging_hotfolder(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'pre/OpenCV/secolulXX/cv_unique.png'
            path.parent.mkdir(parents=True)
            path.write_bytes(b'image')
            data = {'sourceFiles': [{'name': 'original.png'}],
                    'preprocessedFiles': [path.relative_to(temporary).as_posix()],
                    'ocrOptions': {'useTesseract': True}}
            with patch('apps.access.ocr.tesseract_ocr', return_value=('text', None)) as engine, \
                    patch('apps.access.ocr.stage_for_finereader') as stage:
                self.assertEqual(local_ocr(data, temporary, timeout=300)['ocrResults'], ['text'])
                self.assertEqual(engine.call_args.args[0], str(path))
                stage.assert_not_called()
