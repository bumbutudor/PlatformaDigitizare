"""Bounded, headless ScanTailor jobs with one output per uploaded image."""

import logging
import math
import ntpath
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
import warnings
from pathlib import Path
from xml.etree import ElementTree as ET

from django.conf import settings
from PIL import Image, ImageOps


logger = logging.getLogger(__name__)
_run_slot = threading.BoundedSemaphore(1)
_OUTPUT_PATH = re.compile(r"^pre/ScanTailor/([0-9a-f]{32})/st_\1_[0-9]{4}\.png$")
DEFAULT_OPTIONS = {
    "inputDpi": 300,
    "resolution": 600,
    "colorMode": "black_and_white",
    "despeckle": "cautious",
    "orientation": "none",
    "contentDetection": "cautious",
    "whiteMargins": True,
    "normalizeIllumination": True,
    "threshold": 0,
    "dewarping": "off",
    "depthPerception": 2,
    "deskew": "auto",
    "rotation": 0,
    "layout": "1",
    "marginTop": 5,
    "marginRight": 5,
    "marginBottom": 5,
    "marginLeft": 5,
    "alignmentVertical": "center",
    "alignmentHorizontal": "center",
}


class ScanTailorError(Exception):
    status_code = 502


class ScanTailorInputError(ScanTailorError):
    status_code = 400


class ScanTailorUnavailable(ScanTailorError):
    status_code = 503


class ScanTailorBusy(ScanTailorError):
    status_code = 429


class ScanTailorTimeout(ScanTailorError):
    status_code = 504


def resolve_cli():
    configured = str(getattr(settings, "SCANTAILOR_CLI_PATH", "scantailor-cli"))
    command = shutil.which(configured)
    if not command:
        raise ScanTailorUnavailable("ScanTailor CLI nu este disponibil pe server.")
    return command


def _process_options():
    options = {"capture_output": True, "text": True, "encoding": "utf-8",
               "errors": "replace", "shell": False}
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NO_WINDOW
    return options


def cli_version():
    if not getattr(settings, "SCANTAILOR_ENABLED", True):
        raise ScanTailorUnavailable("Preprocesarea ScanTailor este dezactivată.")
    try:
        result = subprocess.run(
            [resolve_cli(), "--help"],
            timeout=getattr(settings, "HEALTH_PROBE_TIMEOUT", 5),
            **_process_options(),
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ScanTailorUnavailable("ScanTailor CLI nu răspunde pe server.") from exc
    output = result.stdout + result.stderr
    if result.returncode or any(flag not in output for flag in (
        "--start-filter", "--end-filter", "--output-dpi", "--layout",
    )):
        raise ScanTailorUnavailable("Versiunea ScanTailor nu oferă CLI-ul necesar.")
    version = re.search(r"Version:\s*([^\r\n]+)", output, re.IGNORECASE)
    return version.group(1).strip() if version else "CLI compatibil"


def validate_options(raw):
    if not isinstance(raw, dict):
        raise ScanTailorInputError("Opțiunile ScanTailor sunt invalide.")
    options = {**DEFAULT_OPTIONS, **raw}
    for key, minimum, maximum in (
        ("inputDpi", 75, 1200), ("resolution", 75, 1200), ("threshold", -50, 50),
    ):
        value = options[key]
        if isinstance(value, bool) or not re.fullmatch(r"-?\d+", str(value)):
            raise ScanTailorInputError(f"{key} trebuie să fie un număr întreg.")
        value = int(value)
        if not minimum <= value <= maximum:
            raise ScanTailorInputError(f"{key} trebuie să fie între {minimum} și {maximum}.")
        options[key] = value
    for key, choices in (
        ("colorMode", ("black_and_white", "color_grayscale", "mixed")),
        ("despeckle", ("off", "cautious", "normal", "aggressive")),
        ("orientation", ("none", "left", "right", "upsidedown")),
        ("contentDetection", ("cautious", "normal", "aggressive")),
        ("dewarping", ("off", "auto")),
        ("deskew", ("auto", "manual")),
        ("layout", ("1", "1.5")),
        ("alignmentVertical", ("top", "center", "bottom")),
        ("alignmentHorizontal", ("left", "center", "right")),
    ):
        if options[key] not in choices:
            raise ScanTailorInputError(f"Opțiunea {key} nu este acceptată.")
    for key, minimum, maximum in (
        ("rotation", -45, 45), ("depthPerception", 1, 3),
        ("marginTop", 0, 50), ("marginRight", 0, 50),
        ("marginBottom", 0, 50), ("marginLeft", 0, 50),
    ):
        try:
            value = float(options[key])
            if isinstance(options[key], bool) or not math.isfinite(value) or not minimum <= value <= maximum:
                raise ValueError()
        except (TypeError, ValueError, OverflowError) as exc:
            raise ScanTailorInputError(f"{key} trebuie să fie între {minimum} și {maximum}.") from exc
        options[key] = value
    for key in ("whiteMargins", "normalizeIllumination"):
        if not isinstance(options[key], bool):
            raise ScanTailorInputError(f"Opțiunea {key} trebuie să fie booleană.")
    return options


def media_file(name, media_root=None):
    root = Path(media_root or settings.MEDIA_ROOT).resolve()
    if (not isinstance(name, str) or not name or len(name) > 1024
            or "\x00" in name or ":" in name or ntpath.isabs(name)
            or ".." in name.replace("\\", "/").split("/")):
        raise ScanTailorInputError("Numele imaginii încărcate este invalid.")
    try:
        path = (root / name.replace("\\", "/")).resolve(strict=True)
        path.relative_to(root)
        if not path.is_file():
            raise ValueError("not a file")
    except (OSError, ValueError, RuntimeError) as exc:
        raise ScanTailorInputError("Imaginea încărcată nu mai este disponibilă.") from exc
    return path


def _source_paths(data):
    sources = data.get("sourceFiles")
    max_files = getattr(settings, "SCANTAILOR_MAX_FILES", 10)
    if not isinstance(sources, list) or not 1 <= len(sources) <= max_files:
        raise ScanTailorInputError(f"Selectați între 1 și {max_files} imagini.")
    uploaded = data.get("s3SourceFiles", [])
    if not isinstance(uploaded, list):
        raise ScanTailorInputError("Lista imaginilor încărcate este invalidă.")
    paths = []
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            raise ScanTailorInputError("Lista imaginilor încărcate este invalidă.")
        canonical = uploaded[index] if index < len(uploaded) else {}
        # The upload endpoint may rename duplicates and convert TIFF to PNG.
        name = canonical.get("name") if isinstance(canonical, dict) else None
        paths.append(media_file(name or source.get("name")))
    return paths


def _prepare_image(source, destination, options):
    if source.stat().st_size > getattr(settings, "SCANTAILOR_MAX_IMAGE_BYTES", 30 * 1024 * 1024):
        raise ScanTailorInputError("Imaginea depășește limita de dimensiune ScanTailor.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(source) as original:
                if original.format not in {"JPEG", "PNG", "TIFF", "BMP", "WEBP"}:
                    raise ScanTailorInputError("ScanTailor acceptă imagini, nu documente PDF.")
                if getattr(original, "n_frames", 1) != 1:
                    raise ScanTailorInputError("Încărcați fiecare pagină ca imagine separată.")
                pixels = original.width * original.height
                output_pixels = pixels * max(1, options["resolution"] / options["inputDpi"]) ** 2
                if (pixels > getattr(settings, "SCANTAILOR_MAX_INPUT_PIXELS", 40_000_000)
                        or output_pixels > getattr(settings, "SCANTAILOR_MAX_OUTPUT_PIXELS", 60_000_000)):
                    raise ScanTailorInputError("Imaginea este prea mare pentru rezoluția aleasă. Reduceți DPI-ul rezultatului.")
                original.load()
                image = ImageOps.exif_transpose(original).convert("RGBA")
                background = Image.new("RGBA", image.size, "white")
                background.alpha_composite(image)
                background.convert("RGB").save(destination, dpi=(options["inputDpi"],) * 2)
    except ScanTailorError:
        raise
    except (OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ScanTailorInputError("Fișierul nu este o imagine validă pentru ScanTailor.") from exc


def write_project(source, output, options, destination):
    """Use the GUI's project format for output settings broken in classic CLI.

    0.9.11.1 leaves despeckle uninitialized and ignores dewarping/depth flags.
    Reading these from a fresh, server-generated project avoids those parsers.
    Never accept a user-provided project containing arbitrary filesystem paths.
    """
    root = ET.Element("project", outputDirectory=str(output), layoutDirection="LTR")
    directories = ET.SubElement(root, "directories")
    ET.SubElement(directories, "directory", id="1", path=str(source.parent))
    files = ET.SubElement(root, "files")
    ET.SubElement(files, "file", id="2", dirId="1", name=source.name)
    images = ET.SubElement(root, "images")
    item = ET.SubElement(images, "image", id="3", fileId="2", fileImage="0", subPages="1")
    with Image.open(source) as image:
        ET.SubElement(item, "size", width=str(image.width), height=str(image.height))
    ET.SubElement(item, "dpi", horizontal=str(options["inputDpi"]), vertical=str(options["inputDpi"]))
    pages = ET.SubElement(root, "pages")
    ET.SubElement(pages, "page", id="4", imageId="3", subPage="single", selected="selected")
    mapping = ET.SubElement(root, "file-name-disambiguation")
    ET.SubElement(mapping, "mapping", file="2", label="0")
    filters = ET.SubElement(root, "filters")
    for stage in ("fix-orientation", "page-split", "deskew", "select-content", "page-layout"):
        ET.SubElement(filters, stage)
    page = ET.SubElement(ET.SubElement(filters, "output"), "page", id="4")
    ET.SubElement(page, "zones")
    ET.SubElement(page, "fill-zones")
    params = ET.SubElement(page, "params", despeckleLevel=options["despeckle"],
                           dewarpingMode=options["dewarping"], depthPerception=str(options["depthPerception"]))
    ET.SubElement(params, "dpi", horizontal=str(options["resolution"]), vertical=str(options["resolution"]))
    color = ET.SubElement(params, "color-params", colorMode={
        "black_and_white": "bw", "color_grayscale": "colorOrGray", "mixed": "mixed",
    }[options["colorMode"]])
    ET.SubElement(color, "color-or-grayscale", whiteMargins=str(int(options["whiteMargins"])),
                  normalizeIllumination=str(int(options["normalizeIllumination"])))
    ET.SubElement(color, "bw", thresholdAdj=str(options["threshold"]))
    ET.ElementTree(root).write(destination, encoding="utf-8", xml_declaration=True)


def build_command(command, project, output, options):
    args = [command, "--start-filter=1", "--end-filter=6",
            f"--layout={options['layout']}", f"--color-mode={options['colorMode']}"]
    for key, flag in (
        ("contentDetection", "content-detection"),
        ("marginTop", "margins-top"), ("marginRight", "margins-right"),
        ("marginBottom", "margins-bottom"), ("marginLeft", "margins-left"),
        ("alignmentVertical", "alignment-vertical"),
        ("alignmentHorizontal", "alignment-horizontal"),
    ):
        args.append(f"--{flag}={options[key]}")
    # Classic 0.9.11.1 advertises 'none' but rejects it; omission means no rotation.
    if options["orientation"] != "none":
        args.append(f"--orientation={options['orientation']}")
    if options["deskew"] == "manual":
        # In classic, even --deskew=auto sets MODE_MANUAL at zero degrees.
        # Fresh jobs must omit that option to keep automatic deskew enabled.
        args.append(f"--rotate={options['rotation']}")
    return args + [str(project), str(output)]


def preprocess_images(data):
    if not getattr(settings, "SCANTAILOR_ENABLED", True):
        raise ScanTailorUnavailable("Preprocesarea ScanTailor este dezactivată.")
    options = validate_options(data.get("preprocessScanTailor", {}))
    sources = _source_paths(data)
    command = resolve_cli()
    if not _run_slot.acquire(blocking=False):
        raise ScanTailorBusy("ScanTailor procesează deja alte imagini. Încercați din nou după finalizare.")
    try:
        deadline = time.monotonic() + getattr(settings, "SCANTAILOR_TIMEOUT", 120)
        job_id = uuid.uuid4().hex
        with tempfile.TemporaryDirectory(prefix="digi-scantailor-") as temporary:
            work = Path(temporary)
            completed = []
            for index, source in enumerate(sources, 1):
                basename = f"st_{job_id}_{index:04d}"
                input_path = work / f"{basename}.png"
                output_dir = work / str(index)
                output_dir.mkdir()
                _prepare_image(source, input_path, options)
                project_path = work / f"{basename}.ScanTailor"
                write_project(input_path, output_dir, options, project_path)
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise ScanTailorTimeout("Preprocesarea ScanTailor a depășit timpul permis.")
                try:
                    process = subprocess.run(
                        build_command(command, project_path, output_dir, options),
                        timeout=remaining, **_process_options(),
                    )
                except subprocess.TimeoutExpired as exc:
                    raise ScanTailorTimeout("Preprocesarea ScanTailor a depășit timpul permis. Încercați mai puține imagini.") from exc
                except OSError as exc:
                    raise ScanTailorUnavailable("ScanTailor CLI nu poate fi pornit pe server.") from exc
                outputs = sorted(output_dir.glob("*.tif")) + sorted(output_dir.glob("*.tiff"))
                if process.returncode or len(outputs) != 1:
                    logger.warning("ScanTailor page %s exit %s: %s", index, process.returncode, (process.stdout + process.stderr)[-2000:])
                    raise ScanTailorError(f"ScanTailor nu a produs un rezultat valid pentru imaginea {index}.")
                result = work / f"result_{basename}.png"
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("error", Image.DecompressionBombWarning)
                        with Image.open(outputs[0]) as image:
                            if image.width * image.height > getattr(settings, "SCANTAILOR_MAX_OUTPUT_PIXELS", 60_000_000):
                                raise ScanTailorInputError("Rezultatul este prea mare. Reduceți DPI-ul rezultatului.")
                            image.save(result, format="PNG", dpi=(options["resolution"],) * 2)
                except (OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
                    raise ScanTailorError("ScanTailor a produs o imagine invalidă.") from exc
                completed.append((result, f"{basename}.png"))
            destination = Path(settings.MEDIA_ROOT) / "pre" / "ScanTailor" / job_id
            destination.mkdir(parents=True)
            for result, name in completed:
                shutil.copyfile(result, destination / name)
        return [f"pre/ScanTailor/{job_id}/{name}" for _, name in completed]
    finally:
        _run_slot.release()


def processed_ocr_paths(data, media_root):
    """Recognize this adapter's outputs without changing legacy OCR sessions."""
    values = data.get("preprocessedFiles", [])
    selected = data.get("preprocessWith") == "ScanTailor" and data.get("preprocessMode", "web") == "web"
    recognized = isinstance(values, list) and any(
        isinstance(value, str) and value.startswith("pre/ScanTailor/") for value in values
    )
    if not selected and not recognized:
        return None
    if not isinstance(values, list) or not values or len(values) != len(data.get("sourceFiles", [])) or any(
        not isinstance(value, str) or not _OUTPUT_PATH.fullmatch(value) for value in values
    ):
        raise ScanTailorInputError("Rezultatele ScanTailor nu corespund imaginilor încărcate. Reluați pasul 2.")
    return [media_file(value, media_root) for value in values]


def stage_for_finereader(paths, period):
    """Submit processed images under unique names so old OCR cannot be reused."""
    configured = settings.FINEREADER_SCANTAILOR_INPUT_DIRS.get(period)
    if not configured:
        raise ScanTailorUnavailable("Nu există un Hot Folder pentru imaginile ScanTailor din această perioadă. Configurați task-ul FineReader corespunzător.")
    inbox = Path(configured)
    if not inbox.is_dir():
        raise ScanTailorUnavailable("Directorul de intrare FineReader nu este disponibil.")
    for path in paths:
        destination = inbox / path.name
        if destination.exists():
            continue
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=inbox, prefix=".scantailor-", suffix=".tmp", delete=False) as stream:
                temporary = Path(stream.name)
                with path.open("rb") as source:
                    shutil.copyfileobj(source, stream)
            os.replace(temporary, destination)
        finally:
            if temporary and temporary.exists():
                temporary.unlink()
