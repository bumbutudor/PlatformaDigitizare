import os
from datetime import datetime
from pdf2image import convert_from_path
from django.core.files.storage import FileSystemStorage
from django.conf import settings

from apps.access.models import File  # Update with your actual path
from .upload_cloud import S3Uploader

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


def upload_file_service(myfile):
    fs = FileSystemStorage()
    filename = fs.save(myfile.name, myfile)
    uploaded_file_url = fs.url(filename)
    uploaded_file_path = settings.MEDIA_ROOT + '/' + filename

    file_db_record = File.objects.create(image=uploaded_file_url)
    s3_file_url = s3_uploader.upload_file(uploaded_file_path, filename)

    return file_db_record, s3_file_url


def convert_pdf_to_images_and_upload(myfile):
    # Salvați fișierul PDF într-o locație temporară
    fs = FileSystemStorage()
    filename = fs.save(myfile.name, myfile)
    pdf_path = os.path.join(settings.MEDIA_ROOT, filename)

    # Convertește fiecare pagină a PDF-ului în imagini
    images = convert_from_path(pdf_path)

    image_urls = []
    for i, image in enumerate(images):
        # Salvați fiecare imagine ca fișier temporar
        image_filename = f"{os.path.splitext(filename)[0]}_{i}.png"
        image_path = os.path.join(settings.MEDIA_ROOT, image_filename)
        image.save(image_path, 'PNG')

        # Încărcați imaginea în bucketul S3 și obțineți URL-ul
        s3_image_url = s3_uploader.upload_file(image_path, image_filename)
        image_urls.append(s3_image_url)

        # Creați înregistrarea în baza de date
        File.objects.create(image=s3_image_url)

    # Ștergeți fișierul PDF temporar
    os.remove(pdf_path)

    return image_urls