import json
import os
import subprocess
import tempfile
from pathlib import Path
from unittest.mock import patch
from unittest import skipUnless
from xml.etree import ElementTree as ET

from django.test import SimpleTestCase, TestCase, override_settings
from PIL import Image

from . import scantailor as st
from .health import check_scantailor
from .ocr import local_ocr
from .test_ocr_jobs import run_queued_ocr


class ScanTailorTests(TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="test-scantailor-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.settings_override = override_settings(MEDIA_ROOT=str(self.root), SCANTAILOR_ENABLED=True)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.image("page.png")
        self.data = {"preprocessWith": "ScanTailor", "preprocessMode": "web",
                     "sourceFiles": [{"name": "page.png"}], "preprocessScanTailor": {}}

    def image(self, name, color="white"):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (64, 80), color).save(path)
        return path

    def fake_cli(self, args, **kwargs):
        self.assertFalse(kwargs["shell"])
        self.assertGreater(kwargs["timeout"], 0)
        self.assertIn("--start-filter=1", args)
        self.assertIn("--end-filter=6", args)
        self.assertNotIn("--orientation=none", args)
        self.assertNotIn("--deskew=auto", args)
        project = ET.parse(args[-2]).getroot()
        source = Path(project.find("directories/directory").get("path")) / project.find("files/file").get("name")
        with Image.open(source) as image:
            image.save(Path(args[-1]) / (source.stem + ".tif"))
        return subprocess.CompletedProcess(args, 0, "", "")

    def run_job(self):
        with patch.object(st, "resolve_cli", return_value="scantailor-cli"), patch.object(st.subprocess, "run", side_effect=self.fake_cli):
            return st.preprocess_images(self.data)

    def test_canonical_upload_names_order_unique_jobs_and_lossless_outputs(self):
        self.image("pagina cu spatii_renamed.png", "black")
        self.data["sourceFiles"] = [{"name": "page.png"}, {"name": "original.tif"}]
        self.data["s3SourceFiles"] = [{"name": "page.png"}, {"name": "pagina cu spatii_renamed.png"}]
        first = self.run_job()
        second = self.run_job()
        self.assertEqual(len(first), 2)
        self.assertNotEqual(first, second)
        for index, name in enumerate(first):
            self.assertRegex(name, st._OUTPUT_PATH)
            with Image.open(self.root / name) as image:
                self.assertEqual(image.format, "PNG")
                self.assertEqual(image.getpixel((0, 0)), (255, 255, 255) if index == 0 else (0, 0, 0))
                self.assertAlmostEqual(image.info["dpi"][0], 600, places=1)

    def test_options_control_cli_and_false_switches_are_omitted(self):
        options = st.validate_options({"inputDpi": "300", "resolution": "450", "threshold": "-4",
            "deskew": "manual", "rotation": "-2.5", "marginTop": "8.2", "orientation": "right",
            "whiteMargins": False, "normalizeIllumination": False, "dewarping": "auto", "depthPerception": "1.5"})
        command = st.build_command("cli.exe", "input with space.ScanTailor", "out folder", options)
        for arg in ("--rotate=-2.5", "--margins-top=8.2", "--orientation=right", "--alignment-vertical=center"):
            self.assertIn(arg, command)
        self.assertNotIn("--white-margins", command)
        self.assertNotIn("--normalize-illumination", command)
        self.assertFalse(any(arg.startswith(("--despeckle=", "--dewarping=", "--depth-perception=", "--deskew=")) for arg in command))
        self.assertEqual(command[-2:], ["input with space.ScanTailor", "out folder"])
        project = self.root / "settings.ScanTailor"
        st.write_project(self.root / "page.png", self.root, options, project)
        params = ET.parse(project).getroot().find("filters/output/page/params")
        self.assertEqual(params.get("depthPerception"), "1.5")
        self.assertEqual(params.get("dewarpingMode"), "auto")
        self.assertEqual(params.find("dpi").get("horizontal"), "450")
        self.assertEqual(params.find("color-params/bw").get("thresholdAdj"), "-4")
        self.assertEqual(params.find("color-params/color-or-grayscale").get("whiteMargins"), "0")

    def test_rejects_invalid_parameters(self):
        for options in ({"resolution": "600; calc"}, {"inputDpi": 0}, {"threshold": 51},
                        {"colorMode": "invalid"}, {"whiteMargins": "false"}, {"rotation": "nan"},
                        {"marginLeft": -1}, {"layout": "2"}, {"resolution": True}, []):
            with self.subTest(options=options), self.assertRaises(st.ScanTailorInputError):
                st.validate_options(options)

    def test_rejects_paths_outside_media(self):
        for name in ("../secret.png", r"..\secret.png", r"C:\secret.png", "/secret.png", "page.png:secret", "missing.png"):
            with self.subTest(name=name), self.assertRaises(st.ScanTailorInputError):
                st.media_file(name)

    def test_endpoint_returns_local_previews_without_s3(self):
        with patch.object(st, "resolve_cli", return_value="cli"), patch.object(st.subprocess, "run", side_effect=self.fake_cli), patch("apps.access.views.s3_uploader.upload_file") as upload:
            response = self.client.post("/preprocess/", json.dumps(self.data), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["s3PreprocessedFiles"], ["/media/" + response.json()["preprocessedFiles"][0]])
        upload.assert_not_called()

    def test_bad_request_and_unavailable_cli_have_actionable_status(self):
        response = self.client.post("/preprocess/", "invalid", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        with patch.object(st, "resolve_cli", side_effect=st.ScanTailorUnavailable("CLI missing")):
            response = self.client.post("/preprocess/", json.dumps(self.data), content_type="application/json")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["msg"], "CLI missing")

    def test_timeout_and_success_without_output_publish_nothing(self):
        for result in (subprocess.TimeoutExpired("cli", 1), subprocess.CompletedProcess([], 0, "", "")):
            with self.subTest(result=result), patch.object(st, "resolve_cli", return_value="cli"), patch.object(st.subprocess, "run") as run:
                if isinstance(result, Exception):
                    run.side_effect = result
                else:
                    run.return_value = result
                with self.assertRaises(st.ScanTailorError):
                    st.preprocess_images(self.data)
            self.assertFalse((self.root / "pre").exists())
        self.assertEqual(len(self.run_job()), 1)  # lock released after errors

    def test_busy_job_and_pixel_limit(self):
        st._run_slot.acquire()
        try:
            with patch.object(st, "resolve_cli", return_value="cli"), self.assertRaises(st.ScanTailorBusy):
                st.preprocess_images(self.data)
        finally:
            st._run_slot.release()
        with override_settings(SCANTAILOR_MAX_OUTPUT_PIXELS=100), self.assertRaises(st.ScanTailorInputError):
            self.run_job()

    def test_tesseract_consumes_processed_page_and_missing_result_rejected(self):
        self.data.update(period="secolulXX", alphabet="cyrillic", ocrOptions={"useTesseract": True})
        with self.assertRaises(st.ScanTailorInputError):
            local_ocr(self.data, str(self.root))
        self.data["preprocessedFiles"] = self.run_job()
        with patch("apps.access.ocr.tesseract_ocr", return_value=("text", None)) as ocr:
            self.assertEqual(local_ocr(self.data, str(self.root))["ocrResults"], ["text"])
        self.assertEqual(ocr.call_args.args[0], str(self.root / self.data["preprocessedFiles"][0]))

    def test_finereader_stages_in_configured_folder_with_unique_name(self):
        paths = [self.root / name for name in self.run_job()]
        inbox = self.root / "watched"
        inbox.mkdir()
        with override_settings(FINEREADER_SCANTAILOR_INPUT_DIRS={"secolulXVIII": str(inbox)}):
            st.stage_for_finereader(paths, "secolulXVIII")
            st.stage_for_finereader(paths, "secolulXVIII")
            self.assertEqual([p.name for p in inbox.iterdir()], [paths[0].name])
            self.assertEqual((inbox / paths[0].name).read_bytes(), paths[0].read_bytes())
            with self.assertRaises(st.ScanTailorUnavailable):
                st.stage_for_finereader(paths, "secolulXVII")

    def test_missing_hotfolder_returns_503_to_ocr_client(self):
        self.data.update(period="secolulXVII", alphabet="cyrillicRomanian", preprocessedFiles=self.run_job())
        with override_settings(FINEREADER_SCANTAILOR_INPUT_DIRS={}):
            response = run_queued_ocr(self.client, data=json.dumps(self.data), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 503)

    def test_finereader_reads_processed_name_and_returns_matching_pdf(self):
        processed = self.run_job()
        basename = Path(processed[0]).stem
        inbox = self.root / "watched"
        inbox.mkdir()
        output = self.root / "ocr" / "secolulXVIII"
        output.mkdir(parents=True)
        (output / "page.txt").write_text("old original OCR", encoding="utf-8")
        (output / (basename + ".txt")).write_text("processed OCR", encoding="utf-8")
        pdf = output / (basename + ".pdf")
        pdf.write_bytes(b"%PDF test fixture")
        os.utime(pdf, (1, 1))
        self.data.update(period="secolulXVIII", alphabet="cyrillicRomanian",
                         preprocessedFiles=processed, api="https://example.test/")
        with override_settings(FINEREADER_SCANTAILOR_INPUT_DIRS={"secolulXVIII": str(inbox)}):
            result = local_ocr(self.data, str(self.root))
        self.assertEqual(result["ocrResults"], ["processed OCR"])
        self.assertEqual(result["searchablePdfs"], [f"https://example.test/media/ocr/secolulXVIII/{basename}.pdf"])
        self.assertEqual((inbox / (basename + ".png")).read_bytes(), (self.root / processed[0]).read_bytes())

    def test_health_reports_cli_version_and_is_optional(self):
        with patch("apps.access.health.cli_version", return_value="0.9.11.1"):
            result = check_scantailor()
        self.assertEqual(result["status"], "online")
        self.assertFalse(result["critical"])
        self.assertIn("0.9.11.1", result["message"])


@skipUnless(os.environ.get("SCANTAILOR_INTEGRATION") == "1", "Set SCANTAILOR_INTEGRATION=1 to test the installed CLI")
class InstalledScanTailorTests(SimpleTestCase):
    def test_actual_cli_honors_auto_deskew_manual_angle_and_output_settings(self):
        sample = Path(__file__).resolve().parents[3] / "samples" / "5.jpg"
        with tempfile.TemporaryDirectory(prefix="test-st-installed-") as directory:
            work = Path(directory)
            for mode, color_mode, expected_mode in (("auto", "color_grayscale", "colorOrGray"), ("manual", "mixed", "mixed")):
                output = work / mode
                output.mkdir()
                project = work / (mode + ".ScanTailor")
                captured = work / (mode + "-actual.ScanTailor")
                source = work / (mode + ".png")
                options = st.validate_options({"resolution": 300, "deskew": mode, "rotation": -2.5,
                    "threshold": 4, "marginTop": 7.5, "alignmentVertical": "bottom",
                    "dewarping": "auto", "depthPerception": 1.5, "colorMode": color_mode})
                st._prepare_image(sample, source, options)
                st.write_project(source, output, options, project)
                args = st.build_command(st.resolve_cli(), project, output, options)
                args.insert(1, "--output-project=" + str(captured))
                process = subprocess.run(args, timeout=30, **st._process_options())
                self.assertEqual(process.returncode, 0, process.stdout + process.stderr)
                self.assertEqual(len(list(output.glob("*.tif"))), 1)
                root = ET.parse(captured).getroot()
                deskew = root.find("filters/deskew/page/params")
                self.assertEqual(deskew.get("mode"), mode)
                if mode == "manual":
                    self.assertAlmostEqual(float(deskew.get("angle")), -2.5)
                margins = root.find("filters/page-layout/page/params/hardMarginsMM")
                self.assertAlmostEqual(float(margins.get("top")), 7.5)
                alignment = root.find("filters/page-layout/page/params/alignment")
                self.assertEqual(alignment.get("vert"), "bottom")
                params = root.find("filters/output/page/params")
                self.assertEqual(params.find("dpi").get("horizontal"), "300")
                self.assertEqual(params.find("color-params/bw").get("thresholdAdj"), "4")
                self.assertEqual(params.get("despeckleLevel"), "cautious")
                self.assertEqual(params.get("dewarpingMode"), "auto")
                self.assertAlmostEqual(float(params.get("depthPerception")), 1.5)
                self.assertEqual(params.find("color-params").get("colorMode"), expected_mode)
                self.assertEqual(params.find("color-params/color-or-grayscale").get("normalizeIllumination"), "1")
