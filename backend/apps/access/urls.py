from xml.sax.saxutils import prepare_input_source
from django.urls import path, include
from .views import upload, preprocess, ocr, transliterate, codex_correct, home, exception_dictionary, serve_media, health
from .views import ExceptionDictionaryEntryViewSet, PeriodViewSet, AlphabetViewSet, ExceptionDictionaryViewSet
from rest_framework import routers
from . import digi_bridge

router = routers.DefaultRouter()
router.register(r'period', PeriodViewSet)
router.register(r'alphabet', AlphabetViewSet)
router.register(r'exception-dictionary', ExceptionDictionaryEntryViewSet)


urlpatterns = [
    path('', home),
    path('health/', health),
    path('upload/', upload),
    path('preprocess/', preprocess),
    path('ocr/', ocr),
    path('transliterate/', transliterate),
    path('codex-correct/', codex_correct),
    path('publish/', digi_bridge.publish),
    path('digi/jobs/', digi_bridge.submit),
    path('digi/jobs/<uuid:job_id>/', digi_bridge.status),
    path('digi/jobs/<uuid:job_id>/import/', digi_bridge.import_job),
    path('exception-dictionary/', exception_dictionary),
    path('api/', include(router.urls)),
    # Serve media files with X-Frame-Options exempt for iframe embedding
    path('media-proxy/<path:path>', serve_media, name='serve_media'),
]
