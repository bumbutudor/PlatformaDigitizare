from click import command
from django.shortcuts import render
from django.http import JsonResponse
from .models import File
from django.core.files.storage import FileSystemStorage
from .utils import process_image_for_ocr, load_txt, periodOptions, remove_hyphen
import os
from django.conf import settings
import json
import requests
import time

def get_file(request):
    # print(request.FILES['uploadedFile'])
    myfile = request.FILES['uploadedFiles']
    fs = FileSystemStorage()
    filename = fs.save(myfile.name, myfile)
    uploaded_file_url = fs.url(filename)
    obj = File.objects.create(image=uploaded_file_url)
    if obj:
        return JsonResponse({"code":200,"msg":"success"})
    else:
        return JsonResponse({"code":500,"msg":"server error"})

def preprocess(request):
    # print(request.FILES['uploadedFile'])
    if request.method == 'POST':
        data = json.loads(request.body)
        preprocess_with = data['preprocessWith']
        files = data['sourceFiles']

        preprocessedFilesURLS = []
        if preprocess_with == 'OpenCV':
            preprocess_opencv = data['preprocessOpenCV']
            pre_path = '/pre/OpenCV/'
            if preprocess_opencv['setResolution']:
                resolution = int(preprocess_opencv['resolution'])
                for file in files:
                    uploaded_file_path = settings.MEDIA_ROOT + '/' + file["name"]
                    processed_file_path =  settings.MEDIA_ROOT + pre_path + file["name"]
                    preprocessedFilesURLS.append('pre/OpenCV/' + file["name"])
                    process_image_for_ocr(uploaded_file_path, processed_file_path, resolution)
                return JsonResponse({"code":200,"msg":"success", "preprocessedFiles":preprocessedFilesURLS})
            
            else:
                for file in files:
                    uploaded_file_path = settings.MEDIA_ROOT + '/' + file["name"]
                    processed_file_path =  settings.MEDIA_ROOT + pre_path + file["name"]
                    preprocessedFilesURLS.append('pre/OpenCV/' + file["name"])
                    process_image_for_ocr(uploaded_file_path, processed_file_path)
                return JsonResponse({"code":200,"msg":"success", "preprocessedFiles":preprocessedFilesURLS})

        elif preprocess_with == 'FR':
            preprocess_fr = data['preprocessFR']
            pre_path = '/pre/FR/'
            if preprocess_fr['convertToBlackAndWhite']:
                for file in files:
                    pre_file_path = pre_path + '/' + os.path.splitext(file["name"])[0] + '.jpg'
                    preprocessedFilesURLS.append(pre_file_path)
                return JsonResponse({"code":200,"msg":"success", "preprocessedFiles":preprocessedFilesURLS})
            elif not preprocess_fr['convertToBlackAndWhite']:
                for file in files:
                    pre_file_path = pre_path + '/preNoBlackAndWhite' + os.path.splitext(file["name"])[0] + '.jpg'
                    preprocessedFilesURLS.append(pre_file_path)
                return JsonResponse({"code":200,"msg":"success", "preprocessedFiles":preprocessedFilesURLS})
            pass
        elif preprocess_with == 'ScanTaylor':
            if data["preprocessMode"] == 'desktop':
                command = "scantailor.exe"
                a = os.system(command)
                print(a)
                return JsonResponse({"code":200,"msg":"success", "uploadFolder":settings.MEDIA_ROOT})
        elif preprocess_with == 'Gimp':
            # TODO : Implement using Gimp
            pass
    
    else:
        return JsonResponse({"code":500,"msg":"server error"})


def ocr(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        period = data['period']
        alphabet = data['alphabet']
        files = data['sourceFiles']
        ocr_results = []

        if period == 'secolulXX' and alphabet == 'cyrillic':  
            ocr_path = '/ocr/secolulXX/cyrillic/'
            for file in files:

                ocr_file_path = settings.MEDIA_ROOT + ocr_path + '/' + os.path.splitext(file["name"])[0] + '.txt'                
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return JsonResponse({"code":200,"msg":"success", "ocrResults":ocr_results})
        elif period == 'secolulXX' and alphabet == 'latin':
            # TODO : Implement using F
            pass
        elif period == 'secolulXVII':
            ocr_path = '/ocr/secolulXVII/'
            ocr_model_path = '/ocr/secolulXVII/models/FR15_secXVII_NT/batch.options.xml'
            for file in files:
                uploaded_file_path = settings.MEDIA_ROOT + '/' + file["name"]
                ocr_file_path = settings.MEDIA_ROOT + ocr_path + '/' + os.path.splitext(file["name"])[0] + '.txt'
                command = 'finecmd.exe ' + uploaded_file_path + ' /OptionsFile ' + ocr_model_path + ' /out ' + ocr_file_path
                os.system(command)
                print(os.system(command))
                ocr_result = load_txt(ocr_file_path)
                ocr_results.append(ocr_result)
            return JsonResponse({"code":200,"msg":"success", "ocrResults":ocr_results})
        elif period == 'Gimp':
            # TODO : Implement using Gimp
            pass
    
    else:
        return JsonResponse({"code":500,"msg":"server error"})

def transliterate(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        period = data['period']
        alphabet = data['alphabet']
        trans_options = data['transOptions']
        ocr_results = data['ocrResults']
        trans_results = []
        for ocr_result in ocr_results:
            data = {'cyrillicText': ocr_result, 'period': periodOptions[period], 'actualize':trans_options['actualizeWordForm']}
            response = requests.post("http://translitera.cc/ProcessServlet", data=data)
            trans_result = response.text
            if trans_options['replaceApostrophe'] and trans_options["removeHyphen"]:
                text_no_apostrophe = trans_result.replace("’", "-").replace('\'', "-")
                clean_text = remove_hyphen(text_no_apostrophe)
                trans_results.append(clean_text)
            elif trans_options['replaceApostrophe'] and not trans_options["removeHyphen"]:
                clean_text = trans_result.replace("’", "-").replace('\'', "-")
                trans_results.append(clean_text)
            elif not trans_options['replaceApostrophe'] and trans_options["removeHyphen"]:
                clean_text = remove_hyphen(trans_result)
                trans_results.append(clean_text)
            elif not trans_options['replaceApostrophe'] and not trans_options["removeHyphen"]:
                trans_results.append(trans_result)
        return JsonResponse({"code":200,"msg":"success", "transResults":trans_results})
    
    else:
        return JsonResponse({"code":500,"msg":"server error"})