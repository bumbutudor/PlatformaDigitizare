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


def local_ocr(data, media_root):
    try:
        period = data['period']
        alphabet = data['alphabet']
        files = data['sourceFiles']
        number_of_files = len(files)
        ocr_results = []

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
            return ocr_results

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

        # Condiție nouă pentru Tesseract
        ocrOptions = data.get('ocrOptions')  # Presupunem că această valoare este trimisă prin data
        use_tesseract = ocrOptions.get("useTesseract", False)
        print(use_tesseract)
        if use_tesseract:
            for file in files:
                file_path = os.path.join(media_root, file["name"])
                ocr_result = tesseract_ocr(file_path)
                ocr_results.append(ocr_result)
            return ocr_results

        # Dacă niciuna din condițiile anterioare nu este îndeplinită, se va returna  o listă goală
        return ocr_results

    except Exception as e:
        print(f"A apărut o eroare: {e}")
        # logging.error(f"A apărut o eroare: {e}") - în cazul în care folosiți modulul de logging
        return []

def tesseract_ocr(file_path):
    """
    Procesează o imagine folosind Tesseract OCR și returnează textul recunoscut.

    :param file_path: Calea către fișierul imagine care va fi procesat
    :type file_path: str
    :return: Textul recunoscut din imagine
    :rtype: str
    """
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image, lang='RTS_from_Cyrillic')

    # Aplică modificările necesare asupra textului recunoscut
    modified_text = tesseract_ocr_postprocess(text)
    return modified_text


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
