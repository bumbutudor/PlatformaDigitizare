import os
import time
from .utils import load_txt, wait_for_files, replace_extension
import pytesseract
from PIL import Image


"""
    Recunoastrea optica a caracterelor (OCR) prin intermediul unui program local
    ABBYY Hot Folder si modele OCR antrenate cu seturi de date din documente chirilice romanesti
    din secolele 17, 18, 19 si 20 utilizand FineReader 12 si FineReader 15 OCR Editor.

    :param data: calea catre fisiere preprocesate, perioada, alfabetul
    :param media_root: calea catre directorul MEDIA_ROOT
    :type data: dict
    :return: ocr_results - calea catre fisierele OCR-uite

"""


def get_searchable_pdf_url(file_name, media_root, ocr_path, api_base_url, wait_timeout=30):
    """
    Check if searchable PDF exists and return its URL.
    Waits up to wait_timeout seconds for PDF to appear (FineReader generates PDF after TXT/DOCX).
    """
    base_name = os.path.splitext(file_name)[0]
    pdf_path = os.path.join(media_root, ocr_path.strip('/'), base_name + '.pdf')
    
    # Wait for PDF to appear (FineReader generates it after TXT and DOCX)
    waited = 0
    while waited < wait_timeout:
        if os.path.exists(pdf_path):
            # Check if file is not empty and not being written
            try:
                file_size = os.path.getsize(pdf_path)
                if file_size > 0:
                    # Wait a bit more to ensure file is fully written
                    mtime = os.path.getmtime(pdf_path)
                    if time.time() - mtime >= 2:  # File not modified in last 2 seconds
                        print(f"[get_searchable_pdf_url] PDF found: {pdf_path} (size: {file_size})")
                        return f"{api_base_url}media{ocr_path}{base_name}.pdf"
            except:
                pass
        
        time.sleep(1)
        waited += 1
        if waited % 5 == 0:
            print(f"[get_searchable_pdf_url] Waiting for PDF: {pdf_path} ({waited}s)")
    
    print(f"[get_searchable_pdf_url] PDF not found after {wait_timeout}s: {pdf_path}")
    return None


def local_ocr(data, media_root):
    try:
        period = data['period']
        alphabet = data['alphabet']
        files = data['sourceFiles']
        number_of_files = len(files)
        ocr_results = []
        searchable_pdfs = []
        api_base_url = data.get('api', '')

        # Verifică mai întâi dacă este selectat modelul Tesseract
        ocrOptions = data.get('ocrOptions', {})
        use_tesseract = ocrOptions.get("useTesseract", False) if ocrOptions else False
        
        if use_tesseract:
            print(f"[Tesseract OCR] Processing {len(files)} files with RTS_from_Cyrillic model")
            # Creează directorul pentru output Tesseract
            ocr_path = '/ocr/tesseract/'
            tesseract_output_dir = os.path.join(media_root, 'ocr', 'tesseract')
            os.makedirs(tesseract_output_dir, exist_ok=True)
            
            for file in files:
                file_path = os.path.join(media_root, file["name"])
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
            return {"ocrResults": ocr_results, "searchablePdfs": searchable_pdfs}

        if period == 'secolulXX' and alphabet == 'cyrillic':
            # model secolulXX.fbt
            ocr_path = '/ocr/secolulXX/cyrillic/'

            # wait for all files to be ocr-ed
            wait_for_files(files, media_root + ocr_path, '.txt')

            for file in files:
                ocr_file_path = media_root + ocr_path + \
                                '/' + os.path.splitext(file["name"])[0] + '.txt'
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
                
                # Check for searchable PDF
                pdf_url = get_searchable_pdf_url(file["name"], media_root, ocr_path, api_base_url)
                searchable_pdfs.append(pdf_url)
            
            return {"ocrResults": ocr_results, "searchablePdfs": searchable_pdfs}

        if period == 'secolulXX' and alphabet == 'latin':
            # TODO : Implement when model is ready
            pass

        if period == 'secolulXIX' and alphabet == 'cyrillicRomanian':
            # model secolulXIX_Epistolariu.fbt

            ocr_path = '/ocr/secolulXIX/cyrillicRomanian/'
            # wait for all files to be ocr-ed
            wait_for_files(files, media_root + ocr_path, '.txt')

            for file in files:
                ocr_file_path = media_root + ocr_path + \
                                '/' + os.path.splitext(file["name"])[0] + '.txt'
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return ocr_results

        if period == 'secolulXVIII':
            # model secolulXVIII_Geografie.fbt
            ocr_path = '/ocr/secolulXVIII/'

            # wait for all files to be ocr-ed
            wait_for_files(files, media_root + ocr_path, '.txt')

            for file in files:
                ocr_file_path = media_root + ocr_path + \
                                '/' + os.path.splitext(file["name"])[0] + '.txt'
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return ocr_results

        if period == 'secolulXVII':
            # model secolulXVII_NT.fbt
            ocr_path = '/ocr/secolulXVII/'

            # wait for all files to be ocr-ed
            wait_for_files(files, media_root + ocr_path, '.txt')

            for file in files:
                uploaded_file_path = media_root + '/' + file["name"]
                ocr_file_path = media_root + ocr_path + \
                                '/' + os.path.splitext(file["name"])[0] + '.txt'

                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return ocr_results
        elif period == 'secolulXVII':
            # TODO : Implement using Gimp
            pass

        # Dacă niciuna din condițiile anterioare nu este îndeplinită, se va returna o listă goală
        return ocr_results

    except Exception as e:
        print(f"A apărut o eroare: {e}")
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

    return modified_text

def local_ocr_finereader_cmd(data, media_root):
    # ocr_model_path = '/ocr/secolulXVII/models/FR15_secXVII_NT/batch.options.xml'
    # TODO
    # command = 'finecmd.exe ' + uploaded_file_path + ' /OptionsFile ' + ocr_model_path + ' /out ' + ocr_file_path
    # os.system(command)
    # print(os.system(command))
    pass
