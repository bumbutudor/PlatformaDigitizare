import datetime as dt
import json
import os
import sqlite3
import tempfile
import time
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

import cleanup_media as cleanup


class DigiCleanupTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / 'backend/media').mkdir(parents=True)
        self.db = sqlite3.connect(self.root / 'backend/db.sqlite3')
        self.addCleanup(self.db.close)
        self.db.execute('CREATE TABLE access_digijob (id TEXT,status TEXT,expires_at TEXT,files TEXT,request_data TEXT)')
        self.original_protection = cleanup.protected_paths
        protection = patch.object(cleanup, 'protected_paths', return_value=(set(), []))
        protection.start()
        self.addCleanup(protection.stop)

    def make_job(self, status='done', expired=True):
        identity = uuid.uuid4()
        expires = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=-1 if expired else 1)
        self.db.execute('INSERT INTO access_digijob VALUES (?,?,?,?,?)',
                        (identity.hex, status, expires.isoformat(), '[]', '{}'))
        self.db.commit()
        paths = [self.root / '.ops/digi-jobs' / str(identity) / '0.png',
                 self.root / 'backend/media' / f'digi_{identity.hex}_0.png',
                 self.root / 'backend/media/ocr/secolulXX/cyrillic' / f'digi_{identity.hex}_0.txt']
        for path in paths:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b'preserve this content')
            os.utime(path, (time.time() - 10 * 86400,) * 2)
        return paths

    def test_expired_job_and_outputs_are_archived_and_restorable(self):
        paths = self.make_job()
        selected = list(cleanup.candidates(self.root, 7))
        self.assertEqual(len(selected), 3)
        result = cleanup.archive_candidates(self.root, selected)
        archive = Path(result['archive'])
        self.assertEqual(result['archived'], 3)
        for path in paths:
            self.assertFalse(path.exists())
            stored = archive / path.relative_to(self.root)
            self.assertEqual(stored.read_bytes(), b'preserve this content')
            path.parent.mkdir(parents=True, exist_ok=True)
            stored.rename(path)
        self.assertEqual(len((archive / 'manifest.jsonl').read_text().splitlines()), 3)

    def test_live_and_processing_jobs_are_preserved_even_when_files_are_old(self):
        self.make_job(expired=False)
        self.make_job(status='processing')
        self.make_job(status='queued')
        self.assertEqual(list(cleanup.candidates(self.root, 7)), [])

    def test_job_reactivated_after_dry_run_is_not_archived(self):
        paths = self.make_job()
        selected = list(cleanup.candidates(self.root, 7))
        self.db.execute("UPDATE access_digijob SET status='processing'")
        self.db.commit()
        self.assertEqual(cleanup.archive_candidates(self.root, selected)['archived'], 0)
        self.assertTrue(all(path.exists() for path in paths))

    @patch.object(cleanup.subprocess, 'check_output', return_value=b'')
    def test_unexpired_cache_pdfs_are_protected(self, git):
        for statement in ('CREATE TABLE access_file (image TEXT)',
                          'CREATE TABLE access_ocrmodel (model_file TEXT)',
                          'CREATE TABLE access_digidocument (digi_object TEXT)',
                          'CREATE TABLE access_ocrcacheentry (pdf_path TEXT, expires_at TEXT)'):
            self.db.execute(statement)
        relative = 'ocr/cache/key/result.pdf'
        expires = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
        self.db.execute('INSERT INTO access_ocrcacheentry VALUES (?,?)', (relative, expires))
        self.db.commit()
        protected, _ = self.original_protection(self.root)
        self.assertIn((self.root / 'backend/media' / relative).resolve(), protected)


if __name__ == '__main__':
    unittest.main()
