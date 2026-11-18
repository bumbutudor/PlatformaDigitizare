from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('access', '0025_digi_job')]
    operations = [
        migrations.AddField('digijob', 'request_data', models.JSONField(default=dict)),
        migrations.AddField('digijob', 'error_code', models.CharField(max_length=32, blank=True)),
        migrations.AddField('digijob', 'started_at', models.DateTimeField(blank=True, null=True)),
        migrations.AddField('digijob', 'finished_at', models.DateTimeField(blank=True, null=True)),
    ]
