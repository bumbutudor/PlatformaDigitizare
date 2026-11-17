from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.access.codex_access import get_codex_access_key, rotate_codex_access_key


class Command(BaseCommand):
    help = "Show or rotate the local access key used by the Codex endpoint."

    def add_arguments(self, parser):
        action = parser.add_mutually_exclusive_group(required=True)
        action.add_argument(
            "--show", action="store_true", help="Display the current access key.")
        action.add_argument(
            "--rotate", action="store_true", help="Generate and store a new key.")

    def handle(self, *args, **options):
        if options["show"]:
            key = get_codex_access_key()
            if not key:
                raise CommandError(
                    "Cheia Codex nu este configurată. Folosiți --rotate.")
            self.stdout.write(key)
            return

        if getattr(settings, "CODEX_ACCESS_KEY", "").strip():
            raise CommandError(
                "CODEX_ACCESS_KEY este setată în environment/.env. "
                "Rotați valoarea acolo și reporniți backend-ul."
            )
        rotate_codex_access_key()
        self.stdout.write(self.style.SUCCESS("Cheia de acces Codex a fost rotită."))
