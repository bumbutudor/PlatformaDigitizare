from xml.sax.saxutils import prepare_input_source
from django.urls import path
from .views import get_file, preprocess, ocr

urlpatterns = [
    path('get_file/', get_file),
    path('preprocess/', preprocess),
    path('ocr/', ocr),
]
