"""Start the digitization services in the logged-in Windows user's session."""
import ctypes
import datetime as dt
import os
from pathlib import Path
import socket
import subprocess
import sys


def main():
    workspace = Path(__file__).resolve().parents[1]
    backend = workspace / "backend"
    logs = workspace / ".ops/logs"
    logs.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    with (logs / ("server-" + stamp + ".log")).open("a", encoding="utf-8") as log:
        log.write("Starting digitization services\n")
        log.flush()
        startup = subprocess.STARTUPINFO()
        startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startup.wShowWindow = 0  # SW_HIDE: background helpers must not open consoles.
        env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
        subprocess.Popen(
            [str(backend / "venv/Scripts/python.exe"), "manage.py", "run_digi_worker"],
            cwd=backend, env=env, startupinfo=startup,
            creationflags=subprocess.CREATE_NO_WINDOW,
            stdin=subprocess.DEVNULL, stdout=log, stderr=log,
        )
        if not ctypes.windll.user32.FindWindowW("HotFolder15MainWindow", None):
            subprocess.Popen(
                [r"C:\Program Files (x86)\ABBYY FineReader 15\HotFolder.exe"],
                startupinfo=startup, creationflags=subprocess.CREATE_NO_WINDOW,
                stdin=subprocess.DEVNULL, stdout=log, stderr=log,
            )
        try:
            with socket.create_connection(("127.0.0.1", 8000), timeout=2):
                log.write("Port 8000 is already in use; keeping the existing server.\n")
                return 0
        except OSError:
            pass
        env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
        return subprocess.call(
            [str(backend / "venv/Scripts/python.exe"), "manage.py", "runserver",
             "127.0.0.1:8000", "--noreload"],
            cwd=backend, env=env, startupinfo=startup,
            creationflags=subprocess.CREATE_NO_WINDOW,
            stdin=subprocess.DEVNULL, stdout=log, stderr=log,
        )


if __name__ == "__main__":
    sys.exit(main())
