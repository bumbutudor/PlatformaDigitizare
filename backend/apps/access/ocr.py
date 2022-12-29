import os
import time
from .utils import load_txt, wait_for_files, replace_extension


"""
    Recunoastrea optica a caracterelor (OCR) prin intermediul unui program local
    ABBYY Hot Folder si modele OCR antrenate cu seturi de date din documente chirilice romanesti
    din secolele 17, 18, 19 si 20 utilizand FineReader 12 si FineReader 15 OCR Editor.

    :param data: calea catre fisiere preprocesate, perioada, alfabetul
    :param media_root: calea catre directorul MEDIA_ROOT
    :type data: dict
    :return: ocr_results - calea catre fisierele OCR-uite

"""


def local_ocr_finereader_hotfolder(data, media_root):
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


def local_ocr_finereader_cmd(data, media_root):
    # ocr_model_path = '/ocr/secolulXVII/models/FR15_secXVII_NT/batch.options.xml'
    # TODO
    # command = 'finecmd.exe ' + uploaded_file_path + ' /OptionsFile ' + ocr_model_path + ' /out ' + ocr_file_path
    # os.system(command)
    # print(os.system(command))
    pass
