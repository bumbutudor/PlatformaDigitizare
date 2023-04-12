from rest_framework import serializers
from .models import Period
from .models import Alphabet
from .models import ExceptionDictionary
from .models import ExceptionDictionaryEntry


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = '__all__'


class AlphabetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alphabet
        fields = '__all__'


class ExceptionDictionarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExceptionDictionary
        fields = '__all__'


class ExceptionDictionaryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExceptionDictionaryEntry
        fields = '__all__'
