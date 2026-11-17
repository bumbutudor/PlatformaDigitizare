import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core import signing
from django.test import SimpleTestCase, override_settings
from PIL import Image

from .codex_correction import (
    CodexCorrectionError,
    CodexUnavailableError,
    _build_prompt,
    _run_codex,
    _run_codex_ocr,
    build_suggestions,
)
from .codex_ocr_review import (
    _IMAGE_REF_SALT,
    _build_ocr_prompt,
    create_ocr_review_ref,
    generate_ocr_review,
    resolve_ocr_review_ref,
)
from .ocr import remove_ocr_unknown_markers


class OcrArtifactCleanupTests(SimpleTestCase):
    def test_removes_fine_reader_unknown_marker(self):
        self.assertEqual(remove_ocr_unknown_markers("^ЇС"), "ЇС")

    def test_removes_only_ascii_carets(self):
        self.assertEqual(
            remove_ocr_unknown_markers("alui ^ЇС\na^ b ^^c"),
            "alui ЇС\na b c",
        )

    @patch("apps.access.views.local_ocr")
    def test_ocr_endpoint_returns_clean_text_and_preserves_pdf_urls(self, local_ocr):
        local_ocr.return_value = {
            "ocrResults": ["^ЇС", "сꙋпт ^дестоиничїѧ"],
            "searchablePdfs": ["first.pdf", None],
        }

        response = self.client.post(
            "/ocr/",
            data=json.dumps({"period": "secolulXVII"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["ocrResults"],
            ["ЇС", "сꙋпт дестоиничїѧ"],
        )
        self.assertEqual(
            response.json()["searchablePdfs"],
            ["first.pdf", None],
        )

    @patch("apps.access.views.local_ocr")
    def test_ocr_endpoint_cleans_legacy_list_response(self, local_ocr):
        local_ocr.return_value = ["^ЇС"]

        response = self.client.post(
            "/ocr/",
            data=json.dumps({"period": "secolulXVII"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ocrResults"], ["ЇС"])

    @patch("apps.access.views.requests.post")
    def test_transliteration_fallback_never_sends_caret(self, requests_post):
        requests_post.return_value.text = "Iisus"
        requests_post.return_value.raise_for_status.return_value = None

        response = self.client.post(
            "/transliterate/",
            data=json.dumps({
                "period": "secolulXVII",
                "alphabet": "cyrillicRomanian",
                "transOptions": {
                    "actualizeWordForm": False,
                    "useExceptionDictionary": False,
                },
                "ocrResults": ["^ЇС"],
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            requests_post.call_args.kwargs["data"]["cyrillicText"],
            "ЇС",
        )


class OcrReviewReferenceTests(SimpleTestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.settings_override.enable()

    def tearDown(self):
        self.settings_override.disable()
        self.media_dir.cleanup()

    def make_image(self, relative_path, image_format=None):
        path = Path(self.media_dir.name) / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (32, 24), "white").save(path, format=image_format)
        return path

    @patch("apps.access.views.local_ocr")
    def test_ocr_response_cleans_caret_and_signs_processed_image(self, local_ocr):
        processed = self.make_image("pre/OpenCV/page.jpg")
        self.make_image("page.jpg")
        local_ocr.return_value = {"ocrResults": ["^ЇС"], "searchablePdfs": []}

        response = self.client.post(
            "/ocr/",
            data=json.dumps({
                "period": "secolulXVII",
                "preprocessedFiles": ["/pre/OpenCV/page.jpg"],
                "sourceFiles": [{"name": "page.jpg"}],
                "s3SourceFiles": [{"name": "page.jpg"}],
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ocrResults"], ["ЇС"])
        image_refs = response.json()["ocrReviewRefs"]
        self.assertEqual(len(image_refs), 1)
        self.assertTrue(image_refs[0])
        self.assertEqual(resolve_ocr_review_ref(image_refs[0]), processed.resolve())

    @patch("apps.access.views.local_ocr")
    def test_ocr_response_returns_null_review_ref_for_pdf(self, local_ocr):
        pdf_path = Path(self.media_dir.name) / "page.pdf"
        pdf_path.write_bytes(b"%PDF-1.4\n")
        local_ocr.return_value = ["text"]

        response = self.client.post(
            "/ocr/",
            data=json.dumps({
                "period": "secolulXVII",
                "preprocessedFiles": ["page.pdf"],
                "sourceFiles": [{"name": "page.pdf", "type": "application/pdf"}],
                "s3SourceFiles": [{"name": "page.pdf", "isPdf": True}],
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ocrReviewRefs"], [None])

    @patch("apps.access.views.local_ocr")
    def test_upload_canonical_name_wins_over_client_metadata_name(self, local_ocr):
        self.make_image("client-name.jpg")
        canonical = self.make_image("client-name_renamed.jpg")
        local_ocr.return_value = ["text"]

        response = self.client.post(
            "/ocr/",
            data=json.dumps({
                "period": "secolulXVII",
                # No preprocessing: the frontend mirrors stale client metadata.
                "preprocessedFiles": [{"name": "client-name.jpg"}],
                "s3SourceFiles": [{"name": "client-name_renamed.jpg"}],
                "sourceFiles": [{"name": "client-name.jpg"}],
            }),
            content_type="application/json",
        )

        image_ref = response.json()["ocrReviewRefs"][0]
        self.assertEqual(resolve_ocr_review_ref(image_ref), canonical.resolve())

    def test_refs_never_accept_url_traversal_or_non_image(self):
        self.make_image("valid.png")
        text_path = Path(self.media_dir.name) / "not-image.jpg"
        text_path.write_text("not an image", encoding="utf-8")

        self.assertIsNone(create_ocr_review_ref("https://example.test/valid.png"))
        self.assertIsNone(create_ocr_review_ref("../valid.png"))
        self.assertIsNone(create_ocr_review_ref("not-image.jpg"))
        self.assertTrue(create_ocr_review_ref("valid.png"))

    def test_invalid_or_pdf_signed_ref_is_rejected(self):
        with self.assertRaises(CodexCorrectionError):
            resolve_ocr_review_ref("not-a-valid-token")

        pdf_path = Path(self.media_dir.name) / "page.pdf"
        pdf_path.write_bytes(b"%PDF-1.4\n")
        pdf_ref = signing.dumps(
            {"v": 1, "path": "page.pdf", "page": 0},
            salt=_IMAGE_REF_SALT,
        )
        with self.assertRaisesRegex(CodexCorrectionError, "numai imagini"):
            resolve_ocr_review_ref(pdf_ref)


class CorsConfigurationTests(SimpleTestCase):
    def test_health_preflight_allows_ngrok_skip_header(self):
        response = self.client.options(
            "/health/",
            HTTP_ORIGIN="http://localhost:8080",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS=(
                "authorization,ngrok-skip-browser-warning"),
        )

        allowed_headers = {
            header.strip().lower()
            for header in response["Access-Control-Allow-Headers"].split(",")
        }
        self.assertIn("ngrok-skip-browser-warning", allowed_headers)
        self.assertIn("authorization", allowed_headers)

    def test_unknown_origin_is_not_allowed_by_cors(self):
        response = self.client.options(
            "/codex-correct/",
            HTTP_ORIGIN="https://evil.example",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,content-type",
        )

        self.assertFalse(response.has_header("Access-Control-Allow-Origin"))


class CodexSuggestionTests(SimpleTestCase):
    def apply_all(self, base_text, suggestions):
        cursor = 0
        result = []
        for suggestion in suggestions:
            self.assertEqual(
                base_text[suggestion["start"]:suggestion["end"]],
                suggestion["original"],
            )
            result.append(base_text[cursor:suggestion["start"]])
            result.append(suggestion["replacement"])
            cursor = suggestion["end"]
        result.append(base_text[cursor:])
        return "".join(result)

    def test_diff_reconstructs_unicode_text_with_insert_replace_and_delete(self):
        base_text = "amează în vechiu\nrând"
        corrected_text = "amiază în  vechi\nrând"

        suggestions = build_suggestions(base_text, corrected_text)

        self.assertTrue(suggestions)
        self.assertEqual(
            self.apply_all(base_text, suggestions), corrected_text)
        self.assertEqual(
            [item["start"] for item in suggestions],
            sorted(item["start"] for item in suggestions),
        )

    def test_unchanged_text_has_no_suggestions(self):
        self.assertEqual(build_suggestions("același", "același"), [])

    def test_historical_spacing_fixes_are_grouped_for_human_review(self):
        base_text = (
            "nu ave m, dinlimbă grecească, şncintrucă acest "
            "lu crubunşn sfnt, şi su fleteşti"
        )
        corrected_text = (
            "nu avem, din limbă grecească, şi întrucă acest "
            "lucru bun şi sfnt, şi sufleteşti"
        )

        suggestions = build_suggestions(base_text, corrected_text)

        self.assertEqual(
            [
                (item["original"], item["replacement"])
                for item in suggestions
            ],
            [
                ("ave m", "avem"),
                ("dinlimbă", "din limbă"),
                ("şncintrucă", "şi întrucă"),
                ("lu crubunşn", "lucru bun şi"),
                ("su fleteşti", "sufleteşti"),
            ],
        )
        self.assertEqual(
            self.apply_all(base_text, suggestions), corrected_text)

    def test_repeated_passage_change_is_anchored_to_the_correct_line(self):
        base_text = "neci vechiu\nnu ave m\nneci vechiu\nnu ave m"
        corrected_text = "neci vechiu\nnu ave m\nneci vechiu\nnu avem"

        suggestions = build_suggestions(base_text, corrected_text)

        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]["start"], base_text.rfind("ave m"))
        self.assertEqual(
            self.apply_all(base_text, suggestions), corrected_text)

    def test_prompt_requests_mechanical_fixes_without_modernizing(self):
        prompt = _build_prompt(
            "нꙋ аве мь динлимбѫ",
            "nu ave m dinlimbă neci vechiu",
            "secolulXVII",
            "cyrillicRomanian",
        )

        self.assertIn("nu ave m", prompt)
        self.assertIn("dinlimbă", prompt)
        self.assertIn("NU moderniza", prompt)
        self.assertIn("neci", prompt)
        self.assertIn("secolulXVII", prompt)


@override_settings(
    CODEX_ACCESS_KEY="test-secret",
    CODEX_ALLOWED_ORIGINS=["https://digitizare.math.md"],
)
class CodexCorrectionEndpointTests(SimpleTestCase):
    @patch("apps.access.views.generate_correction_suggestions")
    def test_endpoint_returns_reviewable_suggestions(self, generate):
        generate.return_value = [{
            "id": "c1",
            "type": "replace",
            "start": 0,
            "end": 1,
            "original": "e",
            "replacement": "i",
        }]

        response = self.client.post(
            "/codex-correct/",
            data=json.dumps({
                "task": "transliteration",
                "sourceText": "и",
                "targetText": "e",
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-secret",
            HTTP_ORIGIN="https://digitizare.math.md",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["suggestions"], generate.return_value)
        generate.assert_called_once_with("и", "e", "", "")

    @patch("apps.access.views.generate_ocr_review")
    def test_endpoint_returns_visual_ocr_review_contract(self, generate):
        generate.return_value = {
            "suggestions": [{
                "id": "c1",
                "type": "replace",
                "start": 0,
                "end": 1,
                "original": "е",
                "replacement": "є",
            }],
            "reviewStatus": "corrected",
            "fidelity": 0.99,
        }

        response = self.client.post(
            "/codex-correct/",
            data=json.dumps({
                "task": "ocr",
                "targetText": "е",
                "imageRef": "signed-image-ref",
                "pageId": "page-1",
                "errorThreshold": 0.98,
                "minimumFidelity": 0.90,
                "period": "secolulXVII",
                "alphabet": "cyrillicRomanian",
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-secret",
            HTTP_ORIGIN="https://digitizare.math.md",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "code": 200,
            "msg": "success",
            **generate.return_value,
        })
        generate.assert_called_once_with(
            target_text="е",
            image_ref="signed-image-ref",
            page_id="page-1",
            error_threshold=0.98,
            minimum_fidelity=0.90,
            period="secolulXVII",
            alphabet="cyrillicRomanian",
        )

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_ocr_task_rejects_invalid_image_ref_before_codex(self, run_codex):
        response = self.client.post(
            "/codex-correct/",
            data=json.dumps({
                "task": "ocr",
                "targetText": "ЇС",
                "imageRef": "invalid",
                "pageId": 0,
                "errorThreshold": 0.98,
                "minimumFidelity": 0.90,
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-secret",
            HTTP_ORIGIN="https://digitizare.math.md",
        )

        self.assertEqual(response.status_code, 400)
        run_codex.assert_not_called()

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_ocr_task_rejects_even_a_signed_pdf_ref(self, run_codex):
        with tempfile.TemporaryDirectory() as media_root, override_settings(
            MEDIA_ROOT=media_root
        ):
            Path(media_root, "page.pdf").write_bytes(b"%PDF-1.4\n")
            pdf_ref = signing.dumps(
                {"v": 1, "path": "page.pdf", "page": 0},
                salt=_IMAGE_REF_SALT,
            )
            response = self.client.post(
                "/codex-correct/",
                data=json.dumps({
                    "task": "ocr",
                    "targetText": "ЇС",
                    "imageRef": pdf_ref,
                    "pageId": 0,
                }),
                content_type="application/json",
                HTTP_AUTHORIZATION="Bearer test-secret",
                HTTP_ORIGIN="https://digitizare.math.md",
            )

        self.assertEqual(response.status_code, 400)
        run_codex.assert_not_called()

    @patch("apps.access.views.generate_correction_suggestions")
    def test_endpoint_maps_codex_errors_without_exposing_output(self, generate):
        generate.side_effect = CodexUnavailableError("Codex indisponibil")

        response = self.client.post(
            "/codex-correct/",
            data=json.dumps({"sourceText": "sursă", "targetText": "țintă"}),
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-secret",
            HTTP_ORIGIN="https://digitizare.math.md",
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["msg"], "Codex indisponibil")

    def test_endpoint_rejects_invalid_json(self):
        response = self.client.post(
            "/codex-correct/",
            data="{",
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-secret",
            HTTP_ORIGIN="https://digitizare.math.md",
        )
        self.assertEqual(response.status_code, 400)

    @patch("apps.access.views.generate_correction_suggestions")
    def test_missing_or_invalid_key_never_starts_codex(self, generate):
        missing = self.client.post(
            "/codex-correct/",
            data="{}",
            content_type="application/json",
            HTTP_ORIGIN="https://digitizare.math.md",
        )
        invalid = self.client.post(
            "/codex-correct/",
            data="{}",
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer wrong-secret",
            HTTP_ORIGIN="https://digitizare.math.md",
        )

        self.assertEqual(missing.status_code, 401)
        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(missing.json()["msg"], invalid.json()["msg"])
        generate.assert_not_called()

    @patch("apps.access.views.generate_correction_suggestions")
    def test_disallowed_origin_never_starts_codex(self, generate):
        response = self.client.post(
            "/codex-correct/",
            data="{}",
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-secret",
            HTTP_ORIGIN="https://evil.example",
        )

        self.assertEqual(response.status_code, 403)
        generate.assert_not_called()

    @override_settings(
        CODEX_ACCESS_KEY="",
        CODEX_ACCESS_KEY_FILE="missing-codex-key-for-test",
    )
    @patch("apps.access.views.generate_correction_suggestions")
    def test_server_without_key_fails_closed(self, generate):
        response = self.client.post(
            "/codex-correct/", data="{}", content_type="application/json")

        self.assertEqual(response.status_code, 503)
        generate.assert_not_called()


class CodexOcrReviewTests(SimpleTestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(
            MEDIA_ROOT=self.media_dir.name,
            CODEX_CORRECTION_RATE_LIMIT=100,
        )
        self.settings_override.enable()
        image_path = Path(self.media_dir.name) / "page.jpg"
        Image.new("RGB", (64, 48), "white").save(image_path, format="JPEG")
        self.image_ref = create_ocr_review_ref("page.jpg", page_id=0)

    def tearDown(self):
        self.settings_override.disable()
        self.media_dir.cleanup()

    def model_result(
        self,
        corrected_text,
        status="corrected",
        fidelity=0.99,
        confidence=0.99,
    ):
        return {
            "corrected_text": corrected_text,
            "review_status": status,
            "visual_fidelity": fidelity,
            "minimum_correction_confidence": confidence,
        }

    def test_prompt_makes_image_authoritative_and_forbids_caret_placeholder(self):
        prompt = _build_ocr_prompt(
            "ЇС",
            "page-1",
            0.98,
            0.90,
            "secolulXVII",
            "cyrillicRomanian",
        )

        self.assertIn("singura autoritate textuală", prompt)
        self.assertIn("caracter cu caracter", prompt)
        self.assertIn("Caracterul ASCII ^", prompt)
        self.assertIn("nu îl introduce și nu îl reintroduce", prompt)
        self.assertIn("review_status=partial", prompt)
        self.assertIn("secolulXVII", prompt)

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_review_reencodes_image_to_temporary_png_and_returns_diff(self, run_codex):
        target = "абвгдежзийклмнопрсту"
        corrected = "абвгдежзийклмнопрсѹ"
        captured = {}

        def inspect_png(prompt, image_path):
            captured["prompt"] = prompt
            captured["path"] = image_path
            captured["exists_during_run"] = Path(image_path).is_file()
            with Image.open(image_path) as image:
                captured["format"] = image.format
                captured["metadata"] = dict(image.info)
            return self.model_result(corrected)

        run_codex.side_effect = inspect_png
        review = generate_ocr_review(
            target,
            self.image_ref,
            page_id=0,
            error_threshold=0.98,
            minimum_fidelity=0.90,
            period="secolulXVII",
            alphabet="cyrillicRomanian",
        )

        self.assertEqual(review["reviewStatus"], "corrected")
        self.assertEqual(review["fidelity"], 0.99)
        self.assertTrue(review["suggestions"])
        self.assertTrue(captured["exists_during_run"])
        self.assertEqual(captured["format"], "PNG")
        self.assertEqual(captured["metadata"], {})
        self.assertFalse(Path(captured["path"]).exists())

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_review_rejects_line_structure_changes(self, run_codex):
        run_codex.return_value = self.model_result("rând unu\nrând doi")

        with self.assertRaisesRegex(CodexCorrectionError, "structura liniilor"):
            generate_ocr_review(
                "rând unu rând doi",
                self.image_ref,
                minimum_fidelity=0.50,
            )

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_review_rejects_reintroduced_ocr_caret(self, run_codex):
        run_codex.return_value = self.model_result("^ЇС")

        with self.assertRaisesRegex(CodexCorrectionError, "markerul OCR"):
            generate_ocr_review("ЇС", self.image_ref, minimum_fidelity=0.50)

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_review_rejects_correction_below_text_fidelity_guard(self, run_codex):
        target = "а" * 100
        run_codex.return_value = self.model_result("б" * 100)

        with self.assertRaisesRegex(CodexCorrectionError, "prea mult"):
            generate_ocr_review(
                target,
                self.image_ref,
                error_threshold=0.98,
                minimum_fidelity=0.90,
            )

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_low_visual_fidelity_never_returns_changes(self, run_codex):
        run_codex.return_value = self.model_result(
            "text neschimbat",
            status="unchanged",
            fidelity=0.40,
            confidence=1.0,
        )

        review = generate_ocr_review(
            "text neschimbat",
            self.image_ref,
            minimum_fidelity=0.90,
        )

        self.assertEqual(review, {
            "suggestions": [],
            "reviewStatus": "insufficient_evidence",
            "fidelity": 0.40,
        })

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_high_confidence_local_change_becomes_partial_review(self, run_codex):
        target = "абвгдежзийклмнопрсту"
        corrected = "абвгдежзийклмнопрстѹ"
        run_codex.return_value = self.model_result(
            corrected,
            status="insufficient_evidence",
            fidelity=0.40,
            confidence=0.99,
        )

        review = generate_ocr_review(
            target,
            self.image_ref,
            error_threshold=0.98,
            minimum_fidelity=0.90,
        )

        self.assertEqual(review["reviewStatus"], "partial")
        self.assertEqual(review["fidelity"], 0.40)
        self.assertEqual(len(review["suggestions"]), 1)

    @patch("apps.access.codex_ocr_review._run_codex_ocr")
    def test_unalignable_changes_are_discarded_without_application_error(self, run_codex):
        run_codex.return_value = self.model_result(
            "text corectat",
            status="unalignable",
            fidelity=0.20,
            confidence=0.99,
        )

        review = generate_ocr_review(
            "text coredtat",
            self.image_ref,
            error_threshold=0.98,
            minimum_fidelity=0.90,
        )

        self.assertEqual(review, {
            "suggestions": [],
            "reviewStatus": "unalignable",
            "fidelity": 0.20,
        })


class CodexSubprocessTests(SimpleTestCase):
    @patch("apps.access.codex_correction._resolve_codex_command")
    @patch("apps.access.codex_correction.subprocess.Popen")
    def test_prompt_is_sent_via_stdin_to_isolated_read_only_exec(
            self, popen, resolve_command):
        captured = {}
        resolve_command.return_value = "codex.cmd"

        class FakeProcess:
            returncode = 0
            pid = 123

            def communicate(self, prompt, timeout):
                captured["prompt"] = prompt
                captured["timeout"] = timeout
                result_path = captured["args"][
                    captured["args"].index("--output-last-message") + 1
                ]
                with open(result_path, "w", encoding="utf-8") as result_file:
                    json.dump({"corrected_text": "text"}, result_file)
                return "", "warning"

        def make_process(args, **kwargs):
            captured["args"] = args
            captured["kwargs"] = kwargs
            return FakeProcess()

        popen.side_effect = make_process

        result = _run_codex("DOCUMENT SECRET")

        self.assertEqual(result, "text")
        self.assertEqual(captured["prompt"], "DOCUMENT SECRET")
        self.assertNotIn("DOCUMENT SECRET", captured["args"])
        self.assertLess(captured["args"].index("-a"), captured["args"].index("exec"))
        self.assertIn("read-only", captured["args"])
        self.assertTrue(captured["args"][-1] == "-")
        self.assertFalse(captured["kwargs"]["shell"])

    @patch("apps.access.codex_correction._resolve_codex_command")
    @patch("apps.access.codex_correction.subprocess.Popen")
    def test_visual_ocr_exec_uses_image_and_ocr_output_schema(
            self, popen, resolve_command):
        captured = {}
        resolve_command.return_value = "codex.cmd"

        class FakeProcess:
            returncode = 0
            pid = 124

            def communicate(self, prompt, timeout):
                captured["prompt"] = prompt
                result_path = captured["args"][
                    captured["args"].index("--output-last-message") + 1
                ]
                with open(result_path, "w", encoding="utf-8") as result_file:
                    json.dump({
                        "corrected_text": "ЇС",
                        "review_status": "unchanged",
                        "visual_fidelity": 0.99,
                        "minimum_correction_confidence": 1.0,
                    }, result_file)
                return "", ""

        def make_process(args, **kwargs):
            captured["args"] = args
            captured["kwargs"] = kwargs
            schema_path = args[args.index("--output-schema") + 1]
            with open(schema_path, "r", encoding="utf-8") as schema_file:
                captured["schema"] = json.load(schema_file)
            return FakeProcess()

        popen.side_effect = make_process
        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = str(Path(temp_dir) / "page.png")
            Path(image_path).write_bytes(b"png-placeholder")
            result = _run_codex_ocr("AUDIT SECRET", image_path)

        self.assertEqual(result["review_status"], "unchanged")
        self.assertEqual(captured["prompt"], "AUDIT SECRET")
        self.assertNotIn("AUDIT SECRET", captured["args"])
        image_index = captured["args"].index("--image")
        self.assertEqual(captured["args"][image_index + 1], image_path)
        self.assertEqual(captured["args"][image_index + 2], "--output-schema")
        self.assertIn("review_status", captured["schema"]["properties"])
        self.assertIn("visual_fidelity", captured["schema"]["properties"])
        self.assertIn(
            "partial",
            captured["schema"]["properties"]["review_status"]["enum"],
        )
        self.assertIn("--ephemeral", captured["args"])
        self.assertIn("read-only", captured["args"])
        self.assertEqual(captured["args"][-1], "-")
        self.assertFalse(captured["kwargs"]["shell"])
