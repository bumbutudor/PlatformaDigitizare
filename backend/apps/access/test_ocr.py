import json
import os
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase

from . import ocr
from .ocr import OcrError, OcrNoTextError, local_ocr


class FineReaderOcrTests(SimpleTestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.media_root = temporary.name

        # Never wait for real: a missing result must fail on the first poll.
        for name, value in (
            ("FINEREADER_TIMEOUT_SECONDS", 0),
            ("SEARCHABLE_PDF_TIMEOUT_SECONDS", 0),
            ("POLL_SECONDS", 0),
        ):
            patcher = patch.object(ocr, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def write_output(self, relative_path, content="text", age_seconds=None):
        path = Path(self.media_root, relative_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        if age_seconds is None:
            age_seconds = 10 if path.suffix == '.txt' else 0
        if age_seconds:
            old = time.time() - age_seconds
            os.utime(path, (old, old))
        return path

    def request(self, period, alphabet, names, **extra):
        data = {
            "period": period,
            "alphabet": alphabet,
            "sourceFiles": [{"name": name} for name in names],
            "api": "https://example.test/",
        }
        data.update(extra)
        return data

    def test_nineteenth_century_accepts_the_alphabet_sent_by_the_interface(self):
        # Step 3 sends "cyrillicTransitional" for every 19th century model.
        self.write_output("ocr/secolulXIX/cyrillicRomanian/page.txt", "текст")

        result = local_ocr(
            self.request("secolulXIX", "cyrillicTransitional", ["page.jpg"]),
            self.media_root,
        )

        self.assertEqual(result["ocrResults"], ["текст"])
        self.assertEqual(result["searchablePdfs"], [])

    def test_twentieth_century_ignores_an_alphabet_left_from_another_period(self):
        self.write_output("ocr/secolulXX/cyrillic/page.txt", "текст")

        result = local_ocr(
            self.request("secolulXX", "cyrillicRomanian", ["page.jpg"]),
            self.media_root,
        )

        self.assertEqual(result["ocrResults"], ["текст"])

    def test_results_follow_the_order_of_the_requested_files(self):
        self.write_output("ocr/secolulXVIII/b.txt", "second")
        self.write_output("ocr/secolulXVIII/a.txt", "first")

        result = local_ocr(
            self.request("secolulXVIII", "cyrillicRomanian", ["a.png", "b.png"]),
            self.media_root,
        )

        self.assertEqual(result["ocrResults"], ["first", "second"])

    def test_timeout_names_the_files_fine_reader_did_not_produce(self):
        self.write_output("ocr/secolulXVIII/done.txt")

        with self.assertRaises(OcrError) as raised:
            local_ocr(
                self.request(
                    "secolulXVIII",
                    "cyrillicRomanian",
                    ["done.jpg", "Pisania_bisericii.jpg"],
                ),
                self.media_root,
            )

        message = str(raised.exception)
        self.assertIn("1 din 2", message)
        self.assertIn("Pisania_bisericii.jpg", message)
        self.assertNotIn("done.jpg", message)
        self.assertIn("Hot Folder", message)

    def test_empty_text_is_not_success_even_if_a_pdf_exists(self):
        for content in ('', '\ufeff', ' \r\n\t\f', '^ ^^', '\ufeff\u200b\u200c\u200d\u2060 ^\n'):
            with self.subTest(content=content):
                self.write_output('ocr/secolulXVIII/Pisania.txt', content)
                self.write_output('ocr/secolulXVIII/Pisania.pdf', '%PDF', age_seconds=10)
                with patch.object(ocr, 'collect_searchable_pdf_urls') as collect_pdf:
                    with self.assertRaises(OcrNoTextError) as raised:
                        local_ocr(self.request('secolulXVIII', 'cyrillicRomanian', ['Pisania.jpg']), self.media_root)
                self.assertEqual(raised.exception.files, ['Pisania.jpg'])
                self.assertIn('nu a recunoscut niciun text', str(raised.exception))
                collect_pdf.assert_not_called()

    def test_mixed_batch_names_only_images_without_recognized_text(self):
        self.write_output('ocr/secolulXIX/cyrillicRomanian/good.txt', '\ufefftext')
        self.write_output('ocr/secolulXIX/cyrillicRomanian/blank.txt', '\ufeff')
        with self.assertRaises(OcrNoTextError) as raised:
            local_ocr(self.request('secolulXIX', 'cyrillicRomanian', ['good.jpg', 'blank.jpg']), self.media_root)
        self.assertEqual(raised.exception.files, ['blank.jpg'])
        self.assertNotIn('good.jpg', str(raised.exception))

    def test_bom_is_removed_but_recognized_text_and_line_breaks_are_preserved(self):
        self.write_output('ocr/secolulXIX/cyrillicRomanian/page.txt', '\ufeffЇС\n123 ꙋ ^')
        result = local_ocr(self.request('secolulXIX', 'cyrillicRomanian', ['page.jpg']), self.media_root)
        self.assertEqual(result['ocrResults'], ['ЇС\n123 ꙋ '])

    def test_waits_for_bom_only_file_that_is_still_being_written(self):
        self.write_output('ocr/secolulXIX/cyrillicRomanian/page.txt', '\ufeff', age_seconds=0)
        def finish_write(_):
            self.write_output('ocr/secolulXIX/cyrillicRomanian/page.txt', '\ufefftext', age_seconds=10)
        with patch.object(ocr, 'FINEREADER_TIMEOUT_SECONDS', 5), \
                patch.object(ocr, 'FINEREADER_TEXT_SETTLE_SECONDS', 2), \
                patch.object(ocr.time, 'sleep', side_effect=finish_write) as sleep:
            result = local_ocr(self.request('secolulXIX', 'cyrillicRomanian', ['page.jpg']), self.media_root)
        self.assertEqual(result['ocrResults'], ['text'])
        sleep.assert_called_once()

    @patch('apps.access.ocr.tesseract_ocr', return_value=('\n\f', None))
    def test_tesseract_empty_result_has_the_same_error(self, _tesseract):
        with self.assertRaises(OcrNoTextError) as raised:
            local_ocr(self.request('secolulXIX', 'cyrillicRomanian', ['page.jpg'],
                                  ocrOptions={'useTesseract': True}), self.media_root)
        self.assertEqual(raised.exception.files, ['page.jpg'])

    def test_empty_scantailor_result_names_the_uploaded_image(self):
        processed = Path(self.media_root, 'st_unique.png')
        self.write_output('ocr/secolulXIX/cyrillicRomanian/st_unique.txt', '\ufeff')
        with patch.object(ocr, 'processed_ocr_paths', return_value=[processed]), \
                patch.object(ocr, 'stage_for_finereader'), \
                self.assertRaises(OcrNoTextError) as raised:
            local_ocr(self.request('secolulXIX', 'cyrillicRomanian', ['Pisania.jpg']), self.media_root)
        self.assertEqual(raised.exception.files, ['Pisania.jpg'])

    def test_endpoint_rejects_a_real_bom_only_txt(self):
        self.write_output('ocr/secolulXVIII/Pisania.txt', '\ufeff', age_seconds=10)
        with self.settings(MEDIA_ROOT=self.media_root):
            response = self.client.post('/ocr/', data=json.dumps(
                self.request('secolulXVIII', 'cyrillicRomanian', ['Pisania.jpg'])
            ), content_type='application/json')
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()['files'], ['Pisania.jpg'])

    def test_missing_output_folder_is_a_timeout_not_a_crash(self):
        with self.assertRaises(OcrError):
            local_ocr(
                self.request("secolulXVII", "cyrillicRomanian", ["page.jpg"]),
                self.media_root,
            )

    def test_unsupported_requests_fail_with_a_reason_instead_of_empty_success(self):
        cases = (
            self.request("secolulXX", "latin", ["page.jpg"]),
            self.request("secolulXXI", "cyrillic", ["page.jpg"]),
            self.request("", "cyrillic", ["page.jpg"]),
            self.request("secolulXX", "cyrillic", []),
        )
        for data in cases:
            with self.subTest(period=data["period"], files=data["sourceFiles"]):
                with self.assertRaises(OcrError):
                    local_ocr(data, self.media_root)

    def test_file_name_cannot_escape_the_output_folder(self):
        self.write_output("secret.txt", "secret")
        self.write_output("ocr/secolulXVIII/secret.txt", "page text")

        result = local_ocr(
            self.request(
                "secolulXVIII", "cyrillicRomanian", ["../../secret.jpg"]),
            self.media_root,
        )

        self.assertEqual(result["ocrResults"], ["page text"])

    def test_searchable_pdfs_are_matched_per_file(self):
        self.write_output("ocr/secolulXX/cyrillic/a.txt")
        self.write_output("ocr/secolulXX/cyrillic/b.txt")
        self.write_output("ocr/secolulXX/cyrillic/a.pdf", "%PDF", age_seconds=10)

        result = local_ocr(
            self.request("secolulXX", "cyrillic", ["a.jpg", "b.jpg"]),
            self.media_root,
        )

        self.assertEqual(
            result["searchablePdfs"],
            ["https://example.test/media/ocr/secolulXX/cyrillic/a.pdf", None],
        )

    def test_searchable_pdfs_follow_the_hot_folder_task_formats(self):
        # The 18th and 17th century tasks write a searchable PDF; the 19th
        # century one writes text only, so its PDF is never waited for.
        for folder in ("secolulXVIII", "secolulXVII", "secolulXIX/cyrillicRomanian"):
            self.write_output(f"ocr/{folder}/page.txt")
            self.write_output(f"ocr/{folder}/page.pdf", "%PDF", age_seconds=10)

        def pdfs(period):
            return local_ocr(
                self.request(period, "cyrillicRomanian", ["page.jpg"]),
                self.media_root,
            )["searchablePdfs"]

        self.assertEqual(
            pdfs("secolulXVIII"),
            ["https://example.test/media/ocr/secolulXVIII/page.pdf"],
        )
        self.assertEqual(
            pdfs("secolulXVII"),
            ["https://example.test/media/ocr/secolulXVII/page.pdf"],
        )
        self.assertEqual(pdfs("secolulXIX"), [])

    def test_pdf_still_being_written_is_not_returned(self):
        self.write_output("ocr/secolulXX/cyrillic/a.txt")
        self.write_output("ocr/secolulXX/cyrillic/a.pdf", "%PDF")
        self.write_output("ocr/secolulXX/cyrillic/b.txt")
        self.write_output("ocr/secolulXX/cyrillic/b.pdf", "", age_seconds=10)

        result = local_ocr(
            self.request("secolulXX", "cyrillic", ["a.jpg", "b.jpg"]),
            self.media_root,
        )

        self.assertEqual(result["searchablePdfs"], [None, None])

    def test_missing_pdfs_cost_one_shared_deadline(self):
        for name in ("a", "b", "c"):
            self.write_output(f"ocr/secolulXX/cyrillic/{name}.txt")

        with patch.object(ocr, "SEARCHABLE_PDF_TIMEOUT_SECONDS", 0.2), \
                patch.object(ocr, "POLL_SECONDS", 0.05):
            started = time.monotonic()
            result = local_ocr(
                self.request("secolulXX", "cyrillic", ["a.jpg", "b.jpg", "c.jpg"]),
                self.media_root,
            )
            elapsed = time.monotonic() - started

        self.assertEqual(result["searchablePdfs"], [None, None, None])
        self.assertLess(elapsed, 0.5)

    @patch("apps.access.ocr.tesseract_ocr")
    def test_tesseract_runs_only_when_requested(self, tesseract_ocr):
        tesseract_ocr.return_value = ("tesseract text", None)
        self.write_output("ocr/secolulXIX/cyrillicRomanian/page.txt", "fr text")

        fine_reader = local_ocr(
            self.request(
                "secolulXIX", "cyrillicTransitional", ["page.jpg"],
                ocrOptions={"useTesseract": False}),
            self.media_root,
        )
        tesseract = local_ocr(
            self.request(
                "secolulXIX", "cyrillicTransitional", ["page.jpg"],
                ocrOptions={"useTesseract": True}),
            self.media_root,
        )

        self.assertEqual(fine_reader["ocrResults"], ["fr text"])
        self.assertEqual(tesseract["ocrResults"], ["tesseract text"])
        self.assertEqual(tesseract_ocr.call_count, 1)


class OcrEndpointErrorTests(SimpleTestCase):
    @patch('apps.access.views.create_ocr_review_refs')
    @patch('apps.access.views.local_ocr')
    def test_empty_results_have_a_user_message_and_no_success_artifacts(self, local, review):
        for result in ({'ocrResults': ['\ufeff^\n'], 'searchablePdfs': ['old.pdf']}, ['\ufeff'], []):
            with self.subTest(result=result):
                local.return_value = result
                response = self.client.post('/ocr/', data=json.dumps({
                    'sourceFiles': [{'name': 'Pisania.jpg'}], 'period': 'secolulXVIII',
                }), content_type='application/json')
                body = response.json()
                self.assertEqual(response.status_code, 422)
                self.assertEqual(body['code'], 422)
                self.assertEqual(body['error'], 'ocr_no_text')
                self.assertIn('Modelul OCR nu a recunoscut niciun text', body['msg'])
                self.assertIn('Pisania.jpg', body['msg'])
                self.assertEqual(body['files'], ['Pisania.jpg'])
                self.assertNotIn('ocrResults', body)
                self.assertNotIn('searchablePdfs', body)
                review.assert_not_called()

    def test_timeout_reaches_the_client_as_a_readable_message(self):
        with tempfile.TemporaryDirectory() as media_root, \
                self.settings(MEDIA_ROOT=media_root), \
                patch.object(ocr, "FINEREADER_TIMEOUT_SECONDS", 0), \
                patch.object(ocr, "POLL_SECONDS", 0):
            response = self.client.post(
                "/ocr/",
                data=json.dumps({
                    "period": "secolulXVIII",
                    "alphabet": "cyrillicRomanian",
                    "sourceFiles": [{"name": "inscriptie.jpg"}],
                }),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 500)
        body = response.json()
        self.assertEqual(body["code"], 500)
        self.assertIn("inscriptie.jpg", body["msg"])
        self.assertIn("FineReader nu a produs textul", body["msg"])
