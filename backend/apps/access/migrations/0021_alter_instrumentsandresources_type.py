# Generated by Django 4.0.2 on 2022-12-23 19:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('access', '0020_instrumentsandresources_app_file_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='instrumentsandresources',
            name='type',
            field=models.CharField(choices=[('1', 'Instrument'), ('2', 'Resursă'), ('0', 'Necunoscut')], default='0', max_length=100),
        ),
    ]