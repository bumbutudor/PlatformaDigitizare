"""
Health checks for the external services the digitization pipeline depends on.

Each check returns a normalized dict::

    {
        "status": "online" | "offline",
        "critical": bool,        # if True and offline, dependent steps must be blocked
        "latency_ms": int|None,  # probe round-trip time
        "message": str,          # human readable detail
    }

Results are aggregated by :func:`get_health` which runs every probe
concurrently (so one slow service does not block the others) and caches the
aggregate for ``settings.HEALTH_CACHE_TTL`` seconds to avoid hammering the
external services on every poll from the frontend.
"""

import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

import requests
from django.conf import settings


# Stable identifiers used by both backend and frontend to map steps -> services.
SERVICE_FINEREADER = "finereader"
SERVICE_TRANSLITERA = "translitera"
SERVICE_PUBLISH = "publish"
SERVICE_S3 = "s3"
SERVICE_OPENAI = "openai"


def _result(status, critical, latency_ms=None, message=""):
    return {
        "status": status,
        "critical": critical,
        "latency_ms": latency_ms,
        "message": message,
    }


def _online(critical, latency_ms, message=""):
    return _result("online", critical, latency_ms, message or "OK")


def _offline(critical, message, latency_ms=None):
    return _result("offline", critical, latency_ms, message)


def _elapsed_ms(start):
    return int((time.time() - start) * 1000)


def check_finereader():
    """
    FineReader runs as a hot-folder service: it watches an input directory and
    writes results to an output directory. We cannot reach it over HTTP, so we
    verify that both directories exist and are writable (a missing/unwritable
    folder means the integration is broken and OCR cannot run).
    """
    start = time.time()
    input_dir = settings.FINEREADER_INPUT_DIR
    output_dir = settings.FINEREADER_OUTPUT_DIR

    for label, path in (("input", input_dir), ("output", output_dir)):
        if not os.path.isdir(path):
            return _offline(
                True,
                f"FineReader {label} folder lipsește: {path}",
                _elapsed_ms(start),
            )
        if not os.access(path, os.W_OK):
            return _offline(
                True,
                f"FineReader {label} folder nu permite scrierea: {path}",
                _elapsed_ms(start),
            )

    return _online(True, _elapsed_ms(start), "Hot folder accesibil")


def _http_probe(url, critical, service_label):
    """Lightweight reachability probe for an HTTP service."""
    start = time.time()
    timeout = settings.HEALTH_PROBE_TIMEOUT
    try:
        # HEAD is cheapest; some servers reject it, so fall back to GET.
        resp = requests.head(url, timeout=timeout, allow_redirects=True)
        if resp.status_code >= 400 or resp.status_code == 405:
            resp = requests.get(url, timeout=timeout, allow_redirects=True)
        # Any HTTP response (even 4xx) means the service is reachable.
        return _online(
            critical, _elapsed_ms(start), f"HTTP {resp.status_code}"
        )
    except requests.RequestException as e:
        return _offline(
            critical, f"{service_label} inaccesibil: {e}", _elapsed_ms(start)
        )


def check_translitera():
    return _http_probe(settings.TRANSLITERA_URL, True, "Serviciu transliterare")


def check_publish():
    return _http_probe(settings.PUBLISH_URL, True, "Platformă publicare")


def check_s3():
    """Verify the S3 bucket is reachable using a cheap head_bucket call."""
    start = time.time()
    access_key = settings.AWS_ACCESS_KEY
    secret_key = settings.AWS_SECRET_KEY
    bucket = settings.AWS_S3_BUCKET

    if not access_key or not secret_key:
        return _offline(True, "Credențiale AWS neconfigurate")

    try:
        import boto3
        from botocore.config import Config
        from botocore.exceptions import ClientError, BotoCoreError

        client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(
                connect_timeout=settings.HEALTH_PROBE_TIMEOUT,
                read_timeout=settings.HEALTH_PROBE_TIMEOUT,
                retries={"max_attempts": 0},
            ),
        )
        client.head_bucket(Bucket=bucket)
        return _online(True, _elapsed_ms(start), f"Bucket '{bucket}' accesibil")
    except (ClientError, BotoCoreError) as e:
        return _offline(True, f"S3 inaccesibil: {e}", _elapsed_ms(start))
    except Exception as e:  # noqa: BLE001 - boto import or unexpected errors
        return _offline(True, f"S3 eroare: {e}", _elapsed_ms(start))


def check_openai():
    """OpenAI is optional (text correction). Reported but never blocks steps."""
    start = time.time()
    api_key = os.getenv("OPENAI_API_KEY", getattr(settings, "OPENAI_API_KEY", ""))
    if not api_key:
        return _offline(False, "Cheie OpenAI neconfigurată (opțional)")
    try:
        resp = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=settings.HEALTH_PROBE_TIMEOUT,
        )
        if resp.status_code < 400:
            return _online(False, _elapsed_ms(start), "API accesibil")
        return _offline(
            False, f"OpenAI HTTP {resp.status_code}", _elapsed_ms(start)
        )
    except requests.RequestException as e:
        return _offline(False, f"OpenAI inaccesibil: {e}", _elapsed_ms(start))


# Registry of all checks. Order is preserved in the response.
_CHECKS = {
    SERVICE_FINEREADER: check_finereader,
    SERVICE_TRANSLITERA: check_translitera,
    SERVICE_PUBLISH: check_publish,
    SERVICE_S3: check_s3,
    SERVICE_OPENAI: check_openai,
}

# Human-readable labels surfaced to the diagnostic panel.
SERVICE_LABELS = {
    SERVICE_FINEREADER: "FineReader (OCR)",
    SERVICE_TRANSLITERA: "Transliterare",
    SERVICE_PUBLISH: "Publicare",
    SERVICE_S3: "Stocare (S3)",
    SERVICE_OPENAI: "OpenAI (opțional)",
}

# Simple in-process cache so frequent frontend polls don't re-probe every time.
_cache_lock = threading.Lock()
_cache = {"timestamp": 0.0, "data": None}


def _run_all_checks():
    services = {}
    # Run probes concurrently; cap each one so a hung probe can't stall the rest.
    timeout = settings.HEALTH_PROBE_TIMEOUT + 2
    with ThreadPoolExecutor(max_workers=len(_CHECKS)) as executor:
        futures = {name: executor.submit(fn) for name, fn in _CHECKS.items()}
        for name, future in futures.items():
            try:
                result = future.result(timeout=timeout)
            except FutureTimeout:
                result = _offline(
                    name not in (SERVICE_OPENAI,),
                    "Verificare expirată (timeout)",
                )
            except Exception as e:  # noqa: BLE001
                result = _offline(
                    name not in (SERVICE_OPENAI,), f"Eroare verificare: {e}"
                )
            result["label"] = SERVICE_LABELS.get(name, name)
            services[name] = result

    critical_offline = [
        name
        for name, r in services.items()
        if r["critical"] and r["status"] != "online"
    ]
    overall = "ok" if not critical_offline else "degraded"

    return {
        "overall": overall,
        "criticalOffline": critical_offline,
        "services": services,
        "checkedAt": int(time.time()),
    }


def get_health(force=False):
    """Return aggregate health, served from cache within ``HEALTH_CACHE_TTL``."""
    ttl = settings.HEALTH_CACHE_TTL
    now = time.time()
    with _cache_lock:
        if (
            not force
            and _cache["data"] is not None
            and (now - _cache["timestamp"]) < ttl
        ):
            cached = dict(_cache["data"])
            cached["cached"] = True
            return cached

    data = _run_all_checks()
    with _cache_lock:
        _cache["data"] = data
        _cache["timestamp"] = time.time()
    result = dict(data)
    result["cached"] = False
    return result
