# Generated by Django 4.1.4 on 2022-12-19 12:31

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('access', '0005_exceptiondictionary'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='ExceptionDictionary',
            new_name='ExceptionDictionaryEntry',
        ),
        migrations.AlterModelOptions(
            name='exceptiondictionaryentry',
            options={'verbose_name': 'Exception Dictionary Entry', 'verbose_name_plural': 'Exception Dictionary Entries'},
        ),
    ]