from xml.sax.saxutils import prepare_input_source
from django.urls import path
from .views import upload, preprocess, ocr, transliterate, home

urlpatterns = [
    path('home/', home),
    path('upload/', upload),
    path('preprocess/', preprocess),
    path('ocr/', ocr),
    path('transliterate/', transliterate),
]
