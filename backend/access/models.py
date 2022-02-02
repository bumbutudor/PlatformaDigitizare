from django.db import models

class File(models.Model):
    image = models.FileField(null=True,blank=True,upload_to='media/documents/')
