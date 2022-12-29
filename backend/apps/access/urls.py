from xml.sax.saxutils import prepare_input_source
from django.urls import path, include
from .views import upload, preprocess, ocr, transliterate, home, exception_dictionary, ExceptionDictionaryEntryViewSet
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'exception-dictionary', ExceptionDictionaryEntryViewSet)


urlpatterns = [
    path('', home),
    path('upload/', upload),
    path('preprocess/', preprocess),
    path('ocr/', ocr),
    path('transliterate/', transliterate),
    path('exception-dictionary/', exception_dictionary),
    path('api/', include(router.urls)),
]
