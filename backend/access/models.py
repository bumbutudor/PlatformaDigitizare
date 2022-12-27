from django.db import models
# from multiselectfield import MultiSelectField

# PERIOD_CHOICES = (('1', 'Secolul XX'), ('2', 'Secolul XIX'),
#                   ('3', 'Secolul XVIII'), ('4', 'Secolul XVII'), ('0', 'Necunoscut'))

# ALPHABET_CHOICES = (('1', 'Alfabetul chirilic sovietic'), ('2', 'Alfabetul chirilic de tranziție'), ('3', 'Alfabetul chirilic românest'), ('0', 'Necunoscut'))

INSTRUMENTS_AND_RESOURCES_TYPES = (('1', 'Instrument'), ('2', 'Resursă'), ('0', 'Necunoscut'))

class File(models.Model):
    image = models.FileField(null=True, blank=True,
                             upload_to='media/documents/')

    added_by = models.CharField(max_length=100, null=True, blank=True)
    added_on = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.image

    class Meta:
        verbose_name_plural = 'Fișiere'
        verbose_name = 'Fișier'

class Period(models.Model):
    name = models.CharField(max_length=100)
    # manny to many
    alphabet = models.ManyToManyField('Alphabet', related_name='periods', blank=True)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Perioade'
        verbose_name = 'Perioadă'

class Alphabet(models.Model):
    name = models.CharField(max_length=100)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)
    sources = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Alfabete'
        verbose_name = 'Alfabet'

class ExceptionDictionary(models.Model):
    name = models.CharField(max_length=100)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Dicționare de excepții'
        verbose_name = 'Dicționar de excepții'

class ExceptionDictionaryEntry(models.Model):
    exception = models.CharField(max_length=100)
    correct_word = models.CharField(max_length=100)
    # maybe add a field for the frequency of the exception
    exception_dictionary = models.ForeignKey(ExceptionDictionary, null=True, blank=True, on_delete=models.CASCADE)
    period = models.ManyToManyField(Period)
    alphabet = models.ManyToManyField(Alphabet)
    added_by = models.CharField(max_length=100, null=True, blank=True)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.exception

    class Meta:
        verbose_name_plural = 'Excepții'
        verbose_name = 'Excepție'

class OCRModel(models.Model):
    name = models.CharField(max_length=100)
    model_file = models.FileField(null=True, blank=True,
                             upload_to='ocr_models/')
    dataset = models.CharField(max_length=200, null=True, blank=True)
    dataset_size = models.IntegerField(null=True, blank=True)
    period = models.ManyToManyField(Period)
    alphabet = models.ManyToManyField(Alphabet)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)
    sources = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Modele OCR'
        verbose_name = 'Model OCR'

class PreprocessingEngine(models.Model):
    name = models.CharField(max_length=100)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Motoare de preprocesare'
        verbose_name = 'Motor de preprocesare'

class PreprocessingEngineModule(models.Model):
    name = models.CharField(max_length=100)
    engine = models.ForeignKey(PreprocessingEngine, on_delete=models.CASCADE)
    module_file = models.FileField(null=True, blank=True, upload_to='preprocessing_modules/')
    options_object = models.TextField(null=True, blank=True)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Module de preprocesare'
        verbose_name = 'Modul de preprocesare'

class PostprocessingEngine(models.Model):
    name = models.CharField(max_length=100)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Motoare de postprocesare'
        verbose_name = 'Motor de postprocesare'

class PostprocessingEngineModule(models.Model):
    name = models.CharField(max_length=100)
    engine = models.ForeignKey(PostprocessingEngine, on_delete=models.CASCADE)
    module_file = models.FileField(null=True, blank=True, upload_to='postprocessing_modules/')
    options_object = models.TextField(null=True, blank=True)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Module de postprocesare'
        verbose_name = 'Modul de postprocesare'

class DigitizationStep(models.Model):
    name = models.CharField(max_length=100)
    process_name = models.CharField(max_length=100)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Pași de digitizare'
        verbose_name = 'Pas de digitizare'

class DigiDocument(models.Model):
    name = models.CharField(max_length=100)
    # one to one fields
    # many to many fields

    # file = models.ManyToOneRel(File, on_delete=models.CASCADE, null=True, blank=True)
    # file = models.ForeignKey(File, on_delete=models.CASCADE, null=True, blank=True)
    # many to one fields
    ocr_model = models.ManyToManyField(OCRModel)
    preprocessing_engine = models.ManyToManyField(PreprocessingEngine)
    postprocessing_engine = models.ManyToManyField(PostprocessingEngine)
    period = models.ManyToManyField(Period)
    alphabet = models.ManyToManyField(Alphabet)
    digi_object = models.TextField()
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Documente digitizate'
        verbose_name = 'Document digitizat'

class InstrumentsAndResources(models.Model):
    name = models.CharField(max_length=100)
    # choices field
    type = models.CharField(max_length=100, choices=INSTRUMENTS_AND_RESOURCES_TYPES, default='0')
    website = models.CharField(max_length=100)
    api = models.CharField(max_length=100)
    app_file = models.FileField(null=True, blank=True, upload_to='apps/')
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Instrumente și resurse'
        verbose_name = 'Instrument și resurse'