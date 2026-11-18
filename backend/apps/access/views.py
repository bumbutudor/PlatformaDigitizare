from multiprocessing.connection import wait
from click import command
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.cache import never_cache
from .models import File
from django.core.files.storage import FileSystemStorage
from .utils import *
from .ocr import remove_ocr_unknown_markers, validate_ocr_results, OcrNoTextError
from .health import get_health
from .hotfolder import preprocess_opencv
from .codex_correction import CodexCorrectionError, generate_correction_suggestions
from .codex_ocr_review import generate_ocr_review
from .codex_access import CodexAccessError, require_codex_access
from .scantailor import ScanTailorError, preprocess_images
from urllib.parse import quote
import os
from django.conf import settings
import json
import logging
import requests
import time
import mimetypes
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


@xframe_options_exempt
def serve_media(request, path):
    """
    Serve media files with X-Frame-Options exempt to allow embedding in iframes.
    This bypasses ngrok's X-Frame-Options restrictions.
    """
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    if not os.path.exists(file_path):
        return HttpResponse("File not found", status=404)
    
    # Security check - make sure path doesn't escape MEDIA_ROOT
    file_path = os.path.abspath(file_path)
    media_root = os.path.abspath(settings.MEDIA_ROOT)
    if not file_path.startswith(media_root):
        return HttpResponse("Access denied", status=403)
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    # For PDFs, we want inline display
    response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    
    if content_type == 'application/pdf':
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
    
    return response


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
# AWS credentials - read defensively so a missing env var does not crash the
# whole app at import time (the platform should still start and report S3 as
# offline via the /health/ endpoint instead).
AWS_ACCESS_KEY = getattr(settings, 'AWS_ACCESS_KEY', '') or os.getenv('AWS_ACCESS_KEY', '')
AWS_SECRET_KEY = getattr(settings, 'AWS_SECRET_KEY', '') or os.getenv('AWS_SECRET_KEY', '')

# S3 bucket name
bucket_name = getattr(settings, 'AWS_S3_BUCKET', 'emoldova.bucket')

# S3 path
today = datetime.now().strftime('%Y-%m-%d/')
s3_path = "platforma-digi/" + today

# S3 client
s3_uploader = S3Uploader(bucket_name, s3_path, AWS_ACCESS_KEY, AWS_SECRET_KEY)


def home(request):
    return HttpResponse('<h4 style="color: #52C41A">API pentru Platforma de Digitizare</h4>')


def health(request):
    """
    Diagnostic endpoint reporting the status of every external service the
    pipeline depends on. Returns HTTP 200 when all critical services are online
    and HTTP 503 when at least one critical service is offline, so monitoring
    tools can alert on it while the frontend still receives the detailed body.
    """
    force = request.GET.get('force') in ('1', 'true', 'yes')
    data = get_health(force=force)
    status_code = 200 if data.get('overall') == 'ok' else 503
    return JsonResponse(data, status=status_code)


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
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({"code": 400, "msg": "Cererea JSON este invalidă."}, status=400)
        if not isinstance(data, dict):
            return JsonResponse({"code": 400, "msg": "Cererea trebuie să fie un obiect JSON."}, status=400)
        if data.get('preprocessWith') == 'ScanTailor' and data.get('preprocessMode', 'web') == 'web':
            try:
                processed = preprocess_images(data)
            except ScanTailorError as exc:
                return JsonResponse({"code": exc.status_code, "msg": str(exc)}, status=exc.status_code)
            return JsonResponse({
                "code": 200, "msg": "success", "preprocessedFiles": processed,
                # Local URLs keep this engine independent of S3 availability.
                "s3PreprocessedFiles": [settings.MEDIA_URL + quote(path, safe='/') for path in processed],
            })
        preprocess_with = data['preprocessWith']
        files = data['sourceFiles']
        number_of_files = len(files)

        preprocessedFiles = []
        s3PreprocessedFiles = []
        if preprocess_with == 'OpenCV':
            try:
                preprocessedFiles = preprocess_opencv(data, process_image_for_ocr)
            except (ScanTailorError, ValueError, KeyError, TypeError) as exc:
                return JsonResponse({"code": 400, "msg": str(exc)}, status=400)
            s3PreprocessedFiles = [s3_uploader.upload_file(
                os.path.join(settings.MEDIA_ROOT, path), path) for path in preprocessedFiles]
            return JsonResponse({"code": 200, "msg": "success", "preprocessedFiles": preprocessedFiles,
                                 "s3PreprocessedFiles": s3PreprocessedFiles})

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
        elif preprocess_with == 'Gimp':
            # TODO : Implement using Gimp
            pass

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

def transliterate_texts(ocr_results, period, trans_options):
    results = []
    if period not in periodOptions:
        raise ValueError("Perioada documentului nu este validă.")
    for text in ocr_results:
        response = requests.post(
            "https://translitera.cc/ProcessServlet",
            data={'cyrillicText': remove_ocr_unknown_markers(text),
                  'period': periodOptions[period],
                  'actualize': trans_options.get('actualizeWordForm', True)},
            timeout=(10, 60))
        response.raise_for_status()
        value = response.text
        if not value.strip() or value.lstrip().lower().startswith(('<!doctype html', '<html')):
            raise ValueError("Serviciul de transliterare nu a returnat text valid. Reîncearcă.")
        value = apply_additional_transliteration(value, transliteration_map)
        if trans_options.get('useExceptionDictionary', True):
            value = replace_all_exceptions(value)
        results.append(value)
    return results


def transliterate(request):
    if request.method != 'POST':
        return JsonResponse({'code': 405, 'msg': 'Metodă neacceptată.'}, status=405)
    try:
        data = json.loads(request.body)
        texts = validate_ocr_results(data.get('ocrResults'), data.get('sourceFiles'))
        results = transliterate_texts(texts, data['period'], data.get('transOptions', {}))
        return JsonResponse({'code': 200, 'msg': 'success', 'transResults': results})
    except (ValueError, KeyError, OcrNoTextError) as exc:
        return JsonResponse({'code': 422, 'msg': str(exc)}, status=422)
    except requests.RequestException:
        return JsonResponse({'code': 503, 'msg': 'Serviciul de transliterare este temporar indisponibil. Reîncearcă.'}, status=503)



@never_cache
def codex_correct(request):
    """Return reviewable Codex suggestions without modifying or saving text."""
    if request.method != 'POST':
        return JsonResponse(
            {"code": 405, "msg": "Method not allowed"}, status=405)

    try:
        require_codex_access(request)
    except CodexAccessError as exc:
        return JsonResponse(
            {"code": exc.status_code, "msg": str(exc)},
            status=exc.status_code,
        )

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"code": 400, "msg": "Cererea JSON este invalidă."}, status=400)

    if not isinstance(data, dict):
        return JsonResponse(
            {"code": 400, "msg": "Cererea trebuie să fie un obiect JSON."},
            status=400,
        )
    task = data.get('task', 'transliteration')
    if task not in ('transliteration', 'ocr'):
        return JsonResponse(
            {"code": 400, "msg": "Tipul de corectare nu este acceptat."},
            status=400,
        )

    try:
        if task == 'ocr':
            review = generate_ocr_review(
                target_text=data.get('targetText'),
                image_ref=data.get('imageRef'),
                page_id=data.get('pageId'),
                error_threshold=data.get('errorThreshold'),
                minimum_fidelity=data.get('minimumFidelity'),
                period=data.get('period', ''),
                alphabet=data.get('alphabet', ''),
            )
        else:
            suggestions = generate_correction_suggestions(
                data.get('sourceText'),
                data.get('targetText'),
                data.get('period', ''),
                data.get('alphabet', ''),
            )
    except CodexCorrectionError as exc:
        response = JsonResponse(
            {"code": exc.status_code, "msg": str(exc)},
            status=exc.status_code,
        )
        if exc.status_code == 429:
            response["Retry-After"] = str(
                getattr(settings, "CODEX_CORRECTION_RATE_WINDOW", 600))
        return response

    if task == 'ocr':
        return JsonResponse({"code": 200, "msg": "success", **review})
    return JsonResponse({
        "code": 200,
        "msg": "success",
        "suggestions": suggestions,
    })
