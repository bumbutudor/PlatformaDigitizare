from django.shortcuts import render
from django.http import JsonResponse
from .models import File
from django.core.files.storage import FileSystemStorage


def get_file(request):
    print(request.FILES['profile_pic'])
    myfile = request.FILES['profile_pic']
    fs = FileSystemStorage()
    filename = fs.save(myfile.name, myfile)
    uploaded_file_url = fs.url(filename)
    obj = File.objects.create(image=uploaded_file_url)
    if obj:
        return JsonResponse({"code":200,"msg":"success"})
    else:
        return JsonResponse({"code":500,"msg":"server error"})
