# Generated by Django 4.1.4 on 2022-12-19 12:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('access', '0004_delete_register_alter_file_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExceptionDictionary',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('word', models.CharField(max_length=100)),
                ('exception', models.CharField(max_length=100)),
                ('period', models.CharField(choices=[('1', 'Secolul XX'), ('2', 'Secolul XIX'), ('3', 'Secolul XVIII'), ('4', 'Secolul XVII'), ('0', 'Necunoscut')], max_length=1)),
                ('added_by', models.CharField(max_length=100)),
                ('added_on', models.DateTimeField(auto_now_add=True)),
                ('modified_by', models.CharField(max_length=100)),
                ('modified_on', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
