"""A single restartable worker for persistent Digi and step-3 OCR jobs."""
import os
import time
from django.core.management.base import BaseCommand
from django.db import close_old_connections
from apps.access.models import DigiJob
from apps.access.digi_bridge import private_root, process_job
from apps.access.ocr_jobs import process_job as process_ocr_job


class Command(BaseCommand):
    help = 'Process Digi and step-3 OCR jobs; safe to restart and safe to launch twice.'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true')

    def handle(self, *args, **options):
        root = private_root()
        root.mkdir(parents=True, exist_ok=True)
        with (root / 'worker.lock').open('a+b') as lock:
            lock.seek(0)
            lock.write(b'0')
            lock.flush()
            lock.seek(0)
            try:
                if os.name == 'nt':
                    import msvcrt
                    msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
                else:
                    import fcntl
                    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError:
                self.stdout.write('Digi worker already running.')
                return
            # The exclusive OS lock proves any previous processing worker exited.
            DigiJob.objects.filter(status='processing').update(status='queued')
            while True:
                close_old_connections()
                job = DigiJob.objects.filter(status='queued').order_by('created_at').first()
                if job:
                    job.status = 'processing'
                    job.save(update_fields=['status', 'updated_at'])
                    if job.mode == 'ocr':
                        process_ocr_job(job)
                    else:
                        process_job(job)
                elif options['once']:
                    return
                else:
                    time.sleep(2)
