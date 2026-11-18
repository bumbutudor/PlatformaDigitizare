import os
import logging
import time
from .utils import load_txt
import pytesseract
from PIL import Image
from .scantailor import processed_ocr_paths, stage_for_finereader

logger = logging.getLogger(__name__)


def remove_ocr_unknown_markers(text):
    """Remove FineReader's ASCII caret marker for an unrecognized artifact."""
    if not isinstance(text, str):
        return text
    return text.replace('^', '')


"""
    Recunoastrea optica a caracterelor (OCR) prin intermediul unui program local
    ABBYY Hot Folder si modele OCR antrenate cu seturi de date din documente chirilice romanesti
    din secolele 17, 18, 19 si 20 utilizand FineReader 12 si FineReader 15 OCR Editor.

    :param data: calea catre fisiere preprocesate, perioada, alfabetul
    :param media_root: calea catre directorul MEDIA_ROOT
    :type data: dict
    :return: ocr_results - calea catre fisierele OCR-uite

"""


class OcrError(Exception):
    """OCR failure whose message is meant to be shown to the user."""


class OcrNoTextError(OcrError):
    """The engine finished but did not recognize text in one or more files."""

    def __init__(self, files):
        self.files = files
        if len(files) == 1:
            target = f'în fișierul „{files[0]}”'
        elif files:
            target = 'în următoarele fișiere: ' + ', '.join(f'„{name}”' for name in files)
        else:
            target = 'în imaginile trimise'
        super().__init__(
            f'Modelul OCR nu a recunoscut niciun text {target}. '
            'Încearcă alt model OCR sau ajustează preprocesarea imaginii.'
        )


def has_ocr_text(text):
    if not isinstance(text, str):
        return False
    # BOM, whitespace, zero-width formatting and ABBYY's unknown-glyph marker
    # alone are not recognized content. Keep punctuation and historic letters.
    invisible = dict.fromkeys(map(ord, '\ufeff\u200b\u200c\u200d\u2060'))
    return bool(remove_ocr_unknown_markers(text).translate(invisible).strip())


def validate_ocr_results(results, source_files=None):
    source_files = source_files or []
    cleaned = [remove_ocr_unknown_markers(text).replace('\ufeff', '')
               if isinstance(text, str) else '' for text in (results or [])]
    empty = [i for i, text in enumerate(cleaned) if not has_ocr_text(text)]
    if not cleaned:
        empty = list(range(len(source_files)))
    if not cleaned or empty:
        names = []
        for index in empty:
            source = source_files[index] if index < len(source_files) else {}
            name = source.get('originalName') or source.get('name') or f'Imaginea {index + 1}'
            names.append(str(name).replace('\\', '/').rsplit('/', 1)[-1])
        raise OcrNoTextError(names)
    return cleaned


# Folderul (relativ la MEDIA_ROOT) in care task-ul Hot Folder al fiecarei
# perioade scrie rezultatele. Perioada decide folderul; alfabetul trimis de
# interfata nu mai poate face ca cererea sa nu se potriveasca cu niciun model.
FINEREADER_OUTPUT_PATHS = {
    'secolulXX': '/ocr/secolulXX/cyrillic/',
    'secolulXIX': '/ocr/secolulXIX/cyrillicRomanian/',
    'secolulXVIII': '/ocr/secolulXVIII/',
    'secolulXVII': '/ocr/secolulXVII/',
}

# Perioadele ale caror task-uri Hot Folder genereaza si un PDF cautabil
# (task-ul de secol XIX, Epistolariu, scrie doar TXT).
FINEREADER_PDF_PERIODS = {'secolulXX', 'secolulXVIII', 'secolulXVII'}

# Cat asteptam rezultatul text al Hot Folder-ului, respectiv PDF-urile
# cautabile (un singur termen pentru toate fisierele cererii, nu per fisier).
FINEREADER_TIMEOUT_SECONDS = 120
FINEREADER_TEXT_SETTLE_SECONDS = 2
SEARCHABLE_PDF_TIMEOUT_SECONDS = 30
POLL_SECONDS = 1


def _base_name(file):
    """Numele fisierului fara cale si fara extensie."""
    name = str(file["name"]).replace('\\', '/')
    return os.path.splitext(os.path.basename(name))[0]


def _output_dir(media_root, ocr_path):
    return os.path.join(media_root, *ocr_path.strip('/').split('/'))


def wait_for_finereader_text(files, output_dir, timeout=None):
    """
    Asteapta fisierele .txt scrise de Hot Folder si intoarce caile lor.
    Daca nu apar toate pana la expirarea termenului, ridica OcrError cu un
    mesaj care spune ce fisiere lipsesc (in loc de o eroare generica).
    """
    if timeout is None:
        timeout = FINEREADER_TIMEOUT_SECONDS
    expected = [
        (file["name"], os.path.join(output_dir, _base_name(file) + '.txt'))
        for file in files
    ]
    deadline = time.monotonic() + timeout
    while True:
        def ready(path):
            try:
                return os.path.isfile(path) and time.time() - os.path.getmtime(path) >= FINEREADER_TEXT_SETTLE_SECONDS
            except OSError:
                return False

        # ABBYY may create an empty/BOM-only file before it finishes writing.
        missing = [name for name, path in expected if not ready(path)]
        if not missing:
            return [path for _, path in expected]
        if time.monotonic() >= deadline:
            print(f"[FineReader OCR] Timeout, lipsesc: {missing} in {output_dir}")
            raise OcrError(
                f"FineReader nu a produs textul pentru {len(missing)} din "
                f"{len(expected)} fișiere în {int(timeout)} de secunde "
                f"({', '.join(missing)}). Verificați că Hot Folder rulează pe "
                "server pentru perioada selectată și încercați din nou."
            )
        time.sleep(POLL_SECONDS)


def _pdf_is_complete(pdf_path):
    """PDF-ul exista, nu e gol si nu a mai fost modificat in ultimele 2 secunde."""
    try:
        return (
            os.path.getsize(pdf_path) > 0
            and time.time() - os.path.getmtime(pdf_path) >= 2
        )
    except OSError:
        return False


def collect_searchable_pdf_urls(files, media_root, ocr_path, api_base_url, timeout=None):
    """
    Intoarce, pentru fiecare fisier, URL-ul PDF-ului cautabil sau None.
    FineReader scrie PDF-ul dupa TXT, deci asteptam putin - dar cu un singur
    termen comun pentru toate fisierele, ca lipsa PDF-urilor sa coste cel mult
    `timeout` secunde pe cerere (inainte: `timeout` secunde pentru fiecare fisier).
    """
    if timeout is None:
        timeout = SEARCHABLE_PDF_TIMEOUT_SECONDS
    output_dir = _output_dir(media_root, ocr_path)
    base_names = [_base_name(file) for file in files]
    deadline = time.monotonic() + timeout

    def ready(base_name):
        return _pdf_is_complete(os.path.join(output_dir, base_name + '.pdf'))

    while not all(ready(base_name) for base_name in base_names):
        if time.monotonic() >= deadline:
            break
        time.sleep(POLL_SECONDS)

    urls = []
    for base_name in base_names:
        if ready(base_name):
            urls.append(f"{api_base_url}media{ocr_path}{base_name}.pdf")
        else:
            print(f"[FineReader OCR] PDF cautabil indisponibil: {base_name}.pdf")
            urls.append(None)
    return urls


def local_ocr(data, media_root):
    try:
        period = data.get('period')
        alphabet = data.get('alphabet')
        files = data['sourceFiles']
        ocr_results = []
        searchable_pdfs = []
        api_base_url = data.get('api', '')

        if not files:
            raise OcrError("Nu a fost trimis niciun fișier pentru OCR.")

        # Verifică mai întâi dacă este selectat modelul Tesseract
        ocrOptions = data.get('ocrOptions', {})
        use_tesseract = ocrOptions.get("useTesseract", False) if ocrOptions else False
        processed_paths = processed_ocr_paths(data, media_root)
        if processed_paths:
            files = [{"name": path.name} for path in processed_paths]
            if not use_tesseract:
                stage_for_finereader(processed_paths, period)
        
        if use_tesseract:
            print(f"[Tesseract OCR] Processing {len(files)} files with RTS_from_Cyrillic model")
            # Creează directorul pentru output Tesseract
            ocr_path = '/ocr/tesseract/'
            tesseract_output_dir = os.path.join(media_root, 'ocr', 'tesseract')
            os.makedirs(tesseract_output_dir, exist_ok=True)
            
            for index, file in enumerate(files):
                file_path = str(processed_paths[index]) if processed_paths else os.path.join(media_root, file["name"])
                print(f"[Tesseract OCR] Processing file: {file_path}")
                ocr_result, pdf_path = tesseract_ocr(file_path, tesseract_output_dir)
                ocr_results.append(ocr_result)
                
                # Generează URL pentru PDF searchable
                if pdf_path and os.path.exists(pdf_path):
                    base_name = os.path.splitext(file["name"])[0]
                    pdf_url = f"{api_base_url}media{ocr_path}{base_name}.pdf"
                    searchable_pdfs.append(pdf_url)
                    print(f"[Tesseract OCR] PDF generated: {pdf_url}")
                else:
                    searchable_pdfs.append(None)
            ocr_results = validate_ocr_results(ocr_results, data['sourceFiles'])
            return {"ocrResults": ocr_results, "searchablePdfs": searchable_pdfs}

        if period not in FINEREADER_OUTPUT_PATHS:
            raise OcrError(
                "Perioada documentului lipsește sau nu are un model OCR.")
        if period == 'secolulXX' and alphabet == 'latin':
            # TODO : Implement when model is ready
            raise OcrError(
                "Nu există încă un model OCR pentru secolul XX cu alfabet latin.")

        ocr_path = FINEREADER_OUTPUT_PATHS[period]
        text_paths = wait_for_finereader_text(
            files, _output_dir(media_root, ocr_path))
        ocr_results = validate_ocr_results(
            [load_txt(text_path) for text_path in text_paths], data['sourceFiles'])

        if period in FINEREADER_PDF_PERIODS:
            searchable_pdfs = collect_searchable_pdf_urls(
                files, media_root, ocr_path, api_base_url)

        return {"ocrResults": ocr_results, "searchablePdfs": searchable_pdfs}

    except Exception as e:
        logger.warning("OCR processing failed: %s", e)
        # Nu mai înghițim eroarea: o propagăm ca să fie raportată corect către
        # frontend (altfel utilizatorul primea "success" cu rezultate goale).
        raise

def tesseract_ocr(file_path, output_dir=None):
    """
    Procesează o imagine folosind Tesseract OCR și returnează textul recunoscut + PDF searchable.

    :param file_path: Calea către fișierul imagine care va fi procesat
    :param output_dir: Directorul unde se salvează PDF-ul searchable
    :type file_path: str
    :type output_dir: str
    :return: Tuple (text recunoscut, calea către PDF searchable)
    :rtype: tuple
    """
    image = Image.open(file_path)
    
    # Extrage textul
    text = pytesseract.image_to_string(image, lang='RTS_from_Cyrillic')
    modified_text = tesseract_ocr_postprocess(text)
    
    # Generează PDF searchable
    pdf_path = None
    if output_dir:
        try:
            # Generează PDF cu text searchable
            pdf_bytes = pytesseract.image_to_pdf_or_hocr(image, lang='RTS_from_Cyrillic', extension='pdf')
            
            # Salvează PDF-ul
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            pdf_path = os.path.join(output_dir, f"{base_name}.pdf")
            
            with open(pdf_path, 'wb') as f:
                f.write(pdf_bytes)
            
            print(f"[Tesseract OCR] Searchable PDF saved: {pdf_path}")
        except Exception as e:
            print(f"[Tesseract OCR] Error generating PDF: {e}")
            pdf_path = None
    
    return modified_text, pdf_path


def tesseract_ocr_postprocess(text):
    """
    Aplică modificări specifice asupra textului recunoscut.

    :param text: Textul recunoscut care necesită modificări
    :type text: str
    :return: Textul după aplicarea modificărilor
    :rtype: str
    """
    # Înlocuiește secvențele de caractere specificate
    modified_text = text.replace('ꙇ꙼', 'ĭ')\
        .replace('ꙋ꙼', 'ꙋ꙼')\
        .replace('ꙇ', 'i')\
        .replace('ꚏ', 'ꚏ')\
        .replace('є', 'є')\
        # .replace('k', 'к')\

    return remove_ocr_unknown_markers(modified_text)

def local_ocr_finereader_cmd(data, media_root):
    # ocr_model_path = '/ocr/secolulXVII/models/FR15_secXVII_NT/batch.options.xml'
    # TODO
    # command = 'finecmd.exe ' + uploaded_file_path + ' /OptionsFile ' + ocr_model_path + ' /out ' + ocr_file_path
    # os.system(command)
    # print(os.system(command))
    pass
