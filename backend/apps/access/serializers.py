from rest_framework import serializers
from .models import ExceptionDictionaryEntry


class ExceptionDictionaryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExceptionDictionaryEntry
        fields = '__all__'
