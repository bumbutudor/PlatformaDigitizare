from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('access', '0026_digi_job_ocr_queue')]
    operations = [migrations.CreateModel(name='OcrCacheEntry', fields=[
        ('key', models.CharField(max_length=64, primary_key=True, serialize=False)),
        ('text', models.TextField()),
        ('pdf_path', models.CharField(max_length=1024, blank=True)),
        ('pdf_digest', models.CharField(max_length=64, blank=True)),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('last_used_at', models.DateTimeField()),
        ('expires_at', models.DateTimeField(db_index=True)),
    ])]
