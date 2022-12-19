from django.db import models

PERIOD_CHOICES = (('1', 'Secolul XX'), ('2', 'Secolul XIX'),
                  ('3', 'Secolul XVIII'), ('4', 'Secolul XVII'), ('0', 'Necunoscut'))


class File(models.Model):
    image = models.FileField(null=True, blank=True,
                             upload_to='media/documents/')


class ExceptionDictionaryEntry(models.Model):
    exception = models.CharField(max_length=100)
    correct_word = models.CharField(max_length=100)
    period = models.CharField(max_length=1, choices=PERIOD_CHOICES)
    added_by = models.CharField(max_length=100)
    added_on = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=100, null=True, blank=True)
    modified_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.exception

    class Meta:
        verbose_name_plural = 'Exception Dictionary Entries'
        verbose_name = 'Exception Dictionary Entry'
