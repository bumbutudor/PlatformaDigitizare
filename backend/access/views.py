from multiprocessing.connection import wait
from click import command
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from .models import File
from django.core.files.storage import FileSystemStorage
from .utils import *
import os
from django.conf import settings
import json
import requests
import time
from .upload_cloud import S3Uploader
from datetime import datetime
from django.shortcuts import render
from rest_framework import viewsets
from .serializers import ExceptionDictionaryEntrySerializer
from .models import ExceptionDictionaryEntry


class ExceptionDictionaryEntryViewSet(viewsets.ModelViewSet):
    queryset = ExceptionDictionaryEntry.objects.all()
    serializer_class = ExceptionDictionaryEntrySerializer


def exception_dictionary(request):
    # in reverse order
    entries = ExceptionDictionaryEntry.objects.all().order_by('-added_on')

    # entries = ExceptionDictionaryEntry.objects.all()

    entries = [entry.__dict__ for entry in entries]
    for entry in entries:
        entry.pop('_state')
    return JsonResponse({"code": 200, "msg": "success", "entries": entries})


# Apelam functia pentru a obtine vocabularul din fisierul "vocabular.txt"
filepath = settings.BASE_DIR + '/vocabular.txt'
vocabulary = obtine_vocabular(filepath)
# AWS credentials
AWS_ACCESS_KEY = os.environ['AWS_ACCESS_KEY']
AWS_SECRET_KEY = os.environ['AWS_SECRET_KEY']

# S3 bucket name
bucket_name = 'emoldova.bucket'

# S3 path
today = datetime.now().strftime('%Y-%m-%d/')
s3_path = "platforma-digi/" + today

# S3 client
s3_uploader = S3Uploader(bucket_name, s3_path, AWS_ACCESS_KEY, AWS_SECRET_KEY)


def home(request):
    return HttpResponse('<h4 style="color: #52C41A">API pentru Platforma de Digitizare</h4>')


def upload(request):
    # print(request.FILES['uploadedFile'])
    myfile = request.FILES['uploadedFiles']
    saveToCloud = False
    fs = FileSystemStorage()
    filename = fs.save(myfile.name, myfile)
    print(filename)
    uploaded_file_url = fs.url(filename)
    uploaded_file_path = settings.MEDIA_ROOT + '/' + filename
    obj = File.objects.create(image=uploaded_file_url)
    if obj:
        s3_file_url = s3_uploader.upload_file(uploaded_file_path, filename)
        return JsonResponse({"code": 200, "msg": "success", "s3File": {"name": filename, "url": s3_file_url}})
    else:
        return JsonResponse({"code": 500, "msg": "server error"})


def preprocess(request):
    # print(request.FILES['uploadedFile'])
    if request.method == 'POST':
        data = json.loads(request.body)
        preprocess_with = data['preprocessWith']
        files = data['sourceFiles']

        preprocessedFiles = []
        s3PreprocessedFiles = []
        if preprocess_with == 'OpenCV':
            preprocess_opencv = data['preprocessOpenCV']
            pre_path = '/pre/OpenCV/'
            if preprocess_opencv['setResolution']:
                resolution = int(preprocess_opencv['resolution'])
                for file in files:
                    uploaded_file_path = settings.MEDIA_ROOT + \
                        '/' + file["name"]
                    processed_file_path = settings.MEDIA_ROOT + \
                        pre_path + file["name"]
                    process_image_for_ocr(
                        uploaded_file_path, processed_file_path, resolution)
                    s3_url = s3_uploader.upload_file(
                        processed_file_path, 'pre/OpenCV/' + file["name"])
                    preprocessedFiles.append('pre/OpenCV/' + file["name"])
                    s3PreprocessedFiles.append(s3_url)
                return JsonResponse({"code": 200, "msg": "success", "preprocessedFiles": preprocessedFiles, "s3PreprocessedFiles": s3PreprocessedFiles})

            else:
                for file in files:
                    uploaded_file_path = settings.MEDIA_ROOT + \
                        '/' + file["name"]
                    processed_file_path = settings.MEDIA_ROOT + \
                        pre_path + file["name"]
                    process_image_for_ocr(
                        uploaded_file_path, processed_file_path)

                    s3_url = s3_uploader.upload_file(
                        processed_file_path, 'pre/OpenCV/' + file["name"])
                    s3PreprocessedFiles.append(s3_url)
                    preprocessedFiles.append('pre/OpenCV/' + file["name"])
                return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles, "preprocessedFiles": preprocessedFiles})

        elif preprocess_with == 'FR':
            preprocess_fr = data['preprocessFR']
            pre_path = '/pre/FR/'

            first_file_path = settings.MEDIA_ROOT + pre_path + \
                os.path.splitext(files[0]["name"])[0] + '.jpg'

            while not os.path.exists(first_file_path):
                print("waiting for file", first_file_path)
                time.sleep(1)

            for file in files:
                pre_file_path = pre_path + \
                    os.path.splitext(file["name"])[0] + '.jpg'
                processed_file_path = settings.MEDIA_ROOT + pre_file_path
                s3_url = s3_uploader.upload_file(
                    processed_file_path, 'pre/FR/' + os.path.splitext(file["name"])[0] + '.jpg')
                s3PreprocessedFiles.append(s3_url)
                preprocessedFiles.append(pre_file_path)
            return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles, "preprocessedFiles": preprocessedFiles})

        elif preprocess_with == 'ScanTailor':
            if data["preprocessMode"] == 'desktop':
                command = "scantailor.exe"
                os.system(command)
                pre_path = settings.MEDIA_ROOT + "/out/"
                first_file_path = pre_path + \
                    os.path.splitext(files[0]["name"])[0] + '.tif'

                while not os.path.exists(first_file_path):
                    print("waiting for file", first_file_path)
                    time.sleep(1)

                if os.path.isfile(first_file_path):
                    for file in files:
                        # uploaded_file_path = settings.MEDIA_ROOT + '/' + file["name"]
                        # output_folder =  settings.MEDIA_ROOT + pre_path
                        tiff_file = os.path.splitext(file["name"])[0] + '.tif'
                        jpg_file = os.path.splitext(file["name"])[0] + '.jpg'

                        tiff_to_jpg(
                            pre_path + tiff_file)

                        s3_url = s3_uploader.upload_file(
                            pre_path + jpg_file, 'pre/ScanTailorDesktop/' + jpg_file)
                        s3PreprocessedFiles.append(s3_url)
                        preprocessedFiles.append('out/' + jpg_file)
                    return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles, "preprocessedFiles": preprocessedFiles})
            elif data["preprocessMode"] == 'web':
                pre_path = '/pre/ScanTailor/'
                preprocess_scantailor = data['preprocessScanTailor']
                for file in files:
                    uploaded_file_path = settings.MEDIA_ROOT + \
                        '/' + file["name"]
                    output_folder = settings.MEDIA_ROOT + pre_path
                    command = preprocess_scantailor_cli(
                        uploaded_file_path, preprocess_scantailor, output_folder)
                    tiff_file = os.path.splitext(file["name"])[0] + '.tif'
                    jpg_file = os.path.splitext(file["name"])[0] + '.jpg'

                    os.system(command)
                    tiff_to_jpg(output_folder + tiff_file)

                    s3_url = s3_uploader.upload_file(
                        output_folder + jpg_file, 'pre/ScanTailor/' + jpg_file)
                    preprocessedFiles.append('pre/ScanTailor/' + jpg_file)
                return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles, "preprocessedFiles": preprocessedFiles})
        elif preprocess_with == 'Gimp':
            # TODO : Implement using Gimp
            pass

    else:
        return JsonResponse({"code": 500, "msg": "server error"})


def ocr(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        period = data['period']
        alphabet = data['alphabet']
        files = data['sourceFiles']
        ocr_results = []

        if period == 'secolulXX' and alphabet == 'cyrillic':
            ocr_path = '/ocr/secolulXX/cyrillic/'
            first_file_path = settings.MEDIA_ROOT + ocr_path + \
                os.path.splitext(files[0]["name"])[0] + '.txt'

            while not os.path.exists(first_file_path):
                print("waiting for file", first_file_path)
                time.sleep(1)

            for file in files:

                ocr_file_path = settings.MEDIA_ROOT + ocr_path + \
                    '/' + os.path.splitext(file["name"])[0] + '.txt'
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return JsonResponse({"code": 200, "msg": "success", "ocrResults": ocr_results})
        elif period == 'secolulXX' and alphabet == 'latin':
            # TODO : Implement using F
            pass
        elif period == 'secolulXVII':
            ocr_path = '/ocr/secolulXVII/'
            first_file_path = settings.MEDIA_ROOT + ocr_path + \
                os.path.splitext(files[0]["name"])[0] + '.txt'

            while not os.path.exists(first_file_path):
                print("waiting for file", first_file_path)
                time.sleep(1)
            # ocr_model_path = '/ocr/secolulXVII/models/FR15_secXVII_NT/batch.options.xml'
            for file in files:
                uploaded_file_path = settings.MEDIA_ROOT + '/' + file["name"]
                ocr_file_path = settings.MEDIA_ROOT + ocr_path + \
                    '/' + os.path.splitext(file["name"])[0] + '.txt'
                # command = 'finecmd.exe ' + uploaded_file_path + ' /OptionsFile ' + ocr_model_path + ' /out ' + ocr_file_path
                # os.system(command)
                # print(os.system(command))
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return JsonResponse({"code": 200, "msg": "success", "ocrResults": ocr_results})
        elif period == 'secolulXVII':
            # TODO : Implement using Gimp
            pass

    else:
        return JsonResponse({"code": 500, "msg": "server error"})


def transliterate(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        period = data['period']
        alphabet = data['alphabet']
        trans_options = data['transOptions']
        ocr_results = data['ocrResults']
        trans_results = []
        for ocr_result in ocr_results:
            data = {'cyrillicText': ocr_result,
                    'period': periodOptions[period], 'actualize': trans_options['actualizeWordForm']}
            response = requests.post(
                "https://translitera.cc/ProcessServlet", data=data)
            trans_result = response.text
            if trans_options['removeHyphen']:
                text_no_hyphenation = remove_cratima_with_spacy_and_vocabulary(
                    trans_result, vocabulary)
                clean_text = replace_all_exceptions(text_no_hyphenation)
                # text_without_appostrophe = text_no_hyphenation.replace(
                #     "’", "-").replace('\'', "-").replace('^ ', "").replace('^', "")
                trans_results.append(clean_text)
            if trans_options['correctTextWithGPT3']:
                corrected_text = correct_text(trans_result)
                trans_results.append(corrected_text)
            # if trans_options['replaceApostrophe'] and trans_options["removeHyphen"]:
            #     text_no_hyphenation = remove_hyphen(trans_result)
            #     text_no_apostrophe = text_no_hyphenation.replace(
            #         "’", "-").replace('\'', "-")
            #     clean_text = replace_all_exceptions(text_no_apostrophe)
            #     trans_results.append(clean_text)
            # elif trans_options['replaceApostrophe'] and not trans_options["removeHyphen"]:
            #     clean_text = trans_result.replace("’", "-").replace('\'', "-")
            #     trans_results.append(clean_text)
            # elif not trans_options['replaceApostrophe'] and trans_options["removeHyphen"]:
            #     text_no_hyphenation = remove_hyphen(trans_result)
            #     clean_text = replace_all_exceptions(text_no_hyphenation)
            #     trans_results.append(clean_text)
            # elif not trans_options['replaceApostrophe'] and not trans_options["removeHyphen"]:
            #     trans_results.append(trans_result)
        return JsonResponse({"code": 200, "msg": "success", "transResults": trans_results})

    else:
        return JsonResponse({"code": 500, "msg": "server error"})
