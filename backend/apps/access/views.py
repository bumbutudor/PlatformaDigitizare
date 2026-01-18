from multiprocessing.connection import wait
from click import command
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from .models import File
from django.core.files.storage import FileSystemStorage
from .utils import *
from .ocr import local_ocr
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
from .serializers import ExceptionDictionarySerializer
from .serializers import PeriodSerializer
from .serializers import AlphabetSerializer
from .models import ExceptionDictionaryEntry
from .models import ExceptionDictionary
from .models import Period
from .models import Alphabet
from PIL import Image


class ExceptionDictionaryEntryViewSet(viewsets.ModelViewSet):
    queryset = ExceptionDictionaryEntry.objects.all()
    serializer_class = ExceptionDictionaryEntrySerializer


class ExceptionDictionaryViewSet(viewsets.ModelViewSet):
    queryset = ExceptionDictionary.objects.all()
    serializer_class = ExceptionDictionarySerializer


class PeriodViewSet(viewsets.ModelViewSet):
    queryset = Period.objects.all()
    serializer_class = PeriodSerializer


class AlphabetViewSet(viewsets.ModelViewSet):
    queryset = Alphabet.objects.all()
    serializer_class = AlphabetSerializer


def exception_dictionary(request):
    # in reverse order
    entries = ExceptionDictionaryEntry.objects.all().order_by('-added_on')

    # entries = ExceptionDictionaryEntry.objects.all()

    entries = [entry.__dict__ for entry in entries]
    for entry in entries:
        entry.pop('_state')
        # print(entry)
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
    myfile = request.FILES['uploadedFiles']
    period = request.POST.get('period', 'secolulXX')  # Get period from request
    saveToCloud = False
    fs = FileSystemStorage()
    filename = fs.save(myfile.name, myfile)
    print(f"Uploaded file: {filename}, Period: {period}")
    uploaded_file_url = fs.url(filename)
    uploaded_file_path = settings.MEDIA_ROOT + '/' + filename

    # Check if file is PDF - upload to period-specific folder
    if filename.lower().endswith('.pdf'):
        # Create pdfs/period folder if not exists
        pdf_folder = os.path.join(settings.MEDIA_ROOT, 'pdfs', period)
        os.makedirs(pdf_folder, exist_ok=True)
        
        # Move PDF to period-specific pdfs folder (replace if exists)
        pdf_path = os.path.join(pdf_folder, filename)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        os.rename(uploaded_file_path, pdf_path)
        
        # Upload PDF to S3
        s3_path_pdf = f'pdfs/{period}/{filename}'
        s3_url = s3_uploader.upload_file(pdf_path, s3_path_pdf)
        
        # Create DB record
        File.objects.create(image=fs.url(f'pdfs/{period}/{filename}'))
        
        return JsonResponse({
            "code": 200, 
            "msg": "success", 
            "isPdf": True,
            "period": period,
            "s3File": {"name": filename, "url": s3_url, "isPdf": True, "period": period}
        })

    # Convert TIFF to PNG if required
    img = Image.open(uploaded_file_path)
    if img.format == 'TIFF':
        filename = filename.replace('.tiff', '.png')
        uploaded_file_path = uploaded_file_path.replace('.tiff', '.png')
        img.save(uploaded_file_path, 'PNG')
        uploaded_file_url = uploaded_file_url.replace('.tiff', '.png')

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
        number_of_files = len(files)

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
                return JsonResponse({"code": 200, "msg": "success", "preprocessedFiles": preprocessedFiles,
                                     "s3PreprocessedFiles": s3PreprocessedFiles})

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
                return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles,
                                     "preprocessedFiles": preprocessedFiles})

        elif preprocess_with == 'FR':
            preprocess_fr = data['preprocessFR']
            pre_path = '/pre/FR/'

            output_folder = settings.MEDIA_ROOT + pre_path
            wait_for_files(files, output_folder, file_ext='.jpg')

            for file in files:
                pre_file_path = pre_path + \
                                os.path.splitext(file["name"])[0] + '.jpg'
                processed_file_path = settings.MEDIA_ROOT + pre_file_path
                s3_url = s3_uploader.upload_file(
                    processed_file_path, 'pre/FR/' + os.path.splitext(file["name"])[0] + '.jpg')
                s3PreprocessedFiles.append(s3_url)
                preprocessedFiles.append(pre_file_path)
            return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles,
                                 "preprocessedFiles": preprocessedFiles})

        elif preprocess_with == 'ScanTailor':
            if data["preprocessMode"] == 'desktop':
                command = "scantailor.exe"
                os.system(command)
                pre_path = settings.MEDIA_ROOT + "/out/"
                last_filepath = pre_path + \
                                os.path.splitext(
                                    files[number_of_files - 1]["name"])[0] + '.tif'

                while not os.path.exists(last_filepath):
                    print("waiting for file", last_filepath)
                    time.sleep(1)

                if os.path.isfile(last_filepath):
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
                    return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles,
                                         "preprocessedFiles": preprocessedFiles})
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
                return JsonResponse({"code": 200, "msg": "success", "s3PreprocessedFiles": s3PreprocessedFiles,
                                     "preprocessedFiles": preprocessedFiles})
        elif preprocess_with == 'Gimp':
            # TODO : Implement using Gimp
            pass

    else:
        return JsonResponse({"code": 500, "msg": "server error"})


def ocr(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        ocr_results = local_ocr(data, settings.MEDIA_ROOT)
        return JsonResponse({"code": 200, "msg": "success", "ocrResults": ocr_results})
    else:
        return JsonResponse({"code": 500, "msg": "server error"})


transliteration_map = {
    'ї': 'i',
    'і': 'i',
    'ԁ': 'd',
    'ѕ': 's',
    'ꚏ': 'ț',
    'Ꚏ': 'Ț',
    '꙼': '',  # Remove this character
    'ꚗ': 'șt',
    'Ꚗ': 'Șt',
    'є': 'e',
    # Add more mappings as needed
}

def replace_k(text):
    result = []
    i = 0
    while i < len(text):
        char = text[i]
        if char.lower() == 'k':
            next_char = text[i + 1] if i + 1 < len(text) else ''
            if next_char.lower() in ('e', 'i'):
                replacement = 'ch' if char.islower() else 'Ch'
            else:
                replacement = 'c' if char.islower() else 'C'
            result.append(replacement)
            i += 1
        else:
            result.append(char)
            i += 1
    return ''.join(result)

def apply_additional_transliteration(text, translit_map):
    # Replace each character in the mapping
    for cyrillic_char, latin_char in translit_map.items():
        text = text.replace(cyrillic_char, latin_char)

    text = replace_k(text)
    return text

def transliterate(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        period = data['period']
        alphabet = data['alphabet']
        trans_options = data['transOptions']
        ocr_results = data['ocrResults']
        trans_results = []

        for ocr_result in ocr_results:
            payload = {
                'cyrillicText': ocr_result,
                'period': periodOptions[period],
                'actualize': trans_options['actualizeWordForm']
            }
            try:
                response = requests.post("https://translitera.cc/ProcessServlet", data=payload)
                response.raise_for_status()  # Raise an error for bad status codes
            except requests.RequestException as e:
                return JsonResponse({"code": 500, "msg": f"Transliteration service error: {e}"})

            trans_result = response.text

            # Apply additional transliteration rules
            trans_result = apply_additional_transliteration(trans_result, transliteration_map)
            trans_result = replace_all_exceptions(trans_result)
            # Continue with existing processing
            # if trans_options.get('removeHyphen', False):
            #     text_no_hyphenation = remove_cratima_with_spacy_and_vocabulary(trans_result, vocabulary)
            #     clean_text = replace_all_exceptions(text_no_hyphenation)
            #     trans_result = clean_text  # Update trans_result for further processing
            #
            if trans_options.get('correctTextWithOpenAIModels', False):
                corrected_text = correct_text_with_OpenAI(ocr_result, trans_result)
                trans_result = corrected_text

            trans_results.append(trans_result)

        return JsonResponse({"code": 200, "msg": "success", "transResults": trans_results})

    else:
        return JsonResponse({"code": 405, "msg": "Method not allowed"}, status=405)


def publish(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        s3_source_files = data['s3SourceFiles']
        s3_preprocessed_files = data['s3PreprocessedFiles']
        period = data['period']
        alphabet = data['alphabet']
        trans_options = data['transOptions']
        ocr_results = data['ocrResults']
        trans_results = data['transResults']

        # Check if s3_source_files is a list and concatenate into a single string
        if isinstance(s3_source_files, list):
            url_content = '\n'.join(f'[upl-image-preview url={url["url"]}]' for url in s3_source_files)
        else:
            url_content = f'[upl-image-preview url={s3_source_files}]'

        # Check if s3_preprocessed_files is a list and concatenate into a single string
        if isinstance(s3_preprocessed_files, list):
            preprocessed_files_content = '\n'.join(f'[upl-image-preview url={url}]' for url in s3_preprocessed_files)
        else:
            preprocessed_files_content = s3_preprocessed_files

        # Join ocr_results and trans_results with newline character
        ocr_results_content = '\n'.join(ocr_results)
        trans_results_content = '\n'.join(trans_results)

        content = f'''{url_content}\n\n[chirilic]
        {ocr_results_content}
        [/chirilic]\n\n[transliterat]
        {trans_results_content}[/transliterat]
        
        Informații adiționale:
        Perioadă: {period}
        Alfabet: {alphabet}
        Opțiuni de transliterare: Object
        Fișiere preprocesate: \n{preprocessed_files_content}
        
        '''

        draft_data = {
            "data": {
                "type": "drafts",
                "attributes": {
                    "title": "Un document din secolul " + period,
                    "content": content
                },
                "relationships": {
                    "tags": {
                        "data": []
                    }
                }
            }
        }

        draft_endpoint = "https://digi.emoldova.org/api/drafts"

        headers = {
            'Host': 'digi.emoldova.org',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/json; charset=utf-8',
            'X-CSRF-Token': 'Y9kVHTyzihubcV3DHVxfbQlZZJijTAY3Rc9DWQhY',
            'Connection': 'keep-alive',
            'Referer': 'https://digi.emoldova.org/',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'TE': 'Trailers',
            'Authorization': 'Token Eik9DFwbyxkZMptuFzfPdKHG2REm5syrzgDrcYGD',
        }

        response = requests.post(draft_endpoint, headers=headers, json=draft_data)

        # Check the response
        if response.status_code == 200 or response.status_code == 201:
            print("Successfully created the article.")
            print(response.json())
            return JsonResponse({"code": 200, "msg": "Successfully created the article."})
        else:
            print(f"Failed to create the article. Status code: {response.status_code}.")
            print(response.json())
            return JsonResponse({"code": 500, "msg": "server error"})
    else:
        return JsonResponse({"code": 500, "msg": "server error"})