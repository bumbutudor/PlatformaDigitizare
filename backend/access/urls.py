from django.urls import path
from .views import get_file

urlpatterns = [
    path('get_file/', get_file),
]
