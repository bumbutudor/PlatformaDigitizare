"""Access-key protection for the resource-intensive Codex endpoint."""

import hmac
import os
import secrets
import subprocess
import tempfile
from pathlib import Path

from django.conf import settings


class CodexAccessError(Exception):
    status_code = 401


class CodexAccessNotConfigured(CodexAccessError):
    status_code = 503


class CodexOriginDenied(CodexAccessError):
    status_code = 403


def _access_key_file():
    configured = getattr(
        settings,
        "CODEX_ACCESS_KEY_FILE",
        os.path.join(settings.BASE_DIR, ".codex-access-key"),
    )
    return Path(configured)


def get_codex_access_key():
    """Read the secret from the environment, falling back to an ignored file."""
    environment_key = getattr(settings, "CODEX_ACCESS_KEY", "").strip()
    if environment_key:
        return environment_key
    try:
        return _access_key_file().read_text(encoding="utf-8").strip()
    except (FileNotFoundError, OSError):
        return ""


def rotate_codex_access_key():
    """Generate and atomically persist a new 256-bit local access key."""
    key = secrets.token_urlsafe(32)
    destination = _access_key_file()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=str(destination.parent),
            prefix=".codex-access-key-",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            temporary_file.write(key)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(str(temporary_path), str(destination))
        try:
            os.chmod(str(destination), 0o600)
        except OSError:
            pass
        if os.name == "nt":
            username = os.environ.get("USERNAME", "")
            domain = os.environ.get("USERDOMAIN", "")
            principal = f"{domain}\\{username}" if domain and username else username
            if principal:
                completed = subprocess.run(
                    [
                        "icacls",
                        str(destination),
                        "/inheritance:r",
                        "/grant:r",
                        f"{principal}:(F)",
                        "*S-1-5-18:(F)",
                    ],
                    capture_output=True,
                    text=True,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                    check=False,
                )
                if completed.returncode != 0:
                    raise OSError("Nu s-a putut securiza ACL-ul fișierului Codex.")
    except Exception:
        try:
            if destination.exists():
                destination.unlink()
        finally:
            raise
    finally:
        if temporary_path and temporary_path.exists():
            temporary_path.unlink()
    return key


def require_codex_access(request):
    """Validate origin and access key, raising a normalized error on failure."""
    expected_key = get_codex_access_key()
    if not expected_key:
        raise CodexAccessNotConfigured(
            "Cheia de acces Codex nu este configurată pe server."
        )

    origin = request.META.get("HTTP_ORIGIN", "").rstrip("/")
    allowed_origins = {
        item.rstrip("/")
        for item in getattr(settings, "CODEX_ALLOWED_ORIGINS", [])
        if item
    }
    if origin and origin not in allowed_origins:
        raise CodexOriginDenied("Originea cererii Codex nu este permisă.")

    authorization = request.META.get("HTTP_AUTHORIZATION", "")
    scheme, separator, supplied_key = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer":
        supplied_key = ""
    if len(supplied_key) > 512 or not hmac.compare_digest(supplied_key, expected_key):
        raise CodexAccessError(
            "Cheia de acces Codex lipsește sau nu este validă."
        )
