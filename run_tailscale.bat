@echo off
setlocal EnableExtensions

set "TAILSCALE=C:\Program Files\Tailscale\tailscale.exe"
set "LOG_DIR=%ProgramData%\DigiApp"
set "LOG_FILE=%LOG_DIR%\tailscale-funnel.log"

rem The Tailscale Windows service and Funnel configuration require elevation.
rem When launched manually, restart this batch through the normal UAC prompt.
fltmc >nul 2>&1
if errorlevel 1 (
  powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
echo [%date% %time%] Ensuring Tailscale Funnel is online.>>"%LOG_FILE%"

if not exist "%TAILSCALE%" (
  echo [%date% %time%] ERROR: tailscale.exe was not found.>>"%LOG_FILE%"
  exit /b 1
)

sc.exe start Tailscale >nul 2>&1

rem At boot the task can run before tailscaled or the network is ready.
rem Retry for up to two minutes, then let Task Scheduler retry the task.
for /L %%I in (1,1,24) do (
  "%TAILSCALE%" status --json >nul 2>&1
  if not errorlevel 1 goto tailscale_ready
  timeout.exe /t 5 /nobreak >nul
)

echo [%date% %time%] ERROR: Tailscale daemon was not ready after 120 seconds.>>"%LOG_FILE%"
exit /b 1

:tailscale_ready
"%TAILSCALE%" funnel --bg 8000 >>"%LOG_FILE%" 2>&1
if errorlevel 1 (
  echo [%date% %time%] ERROR: Funnel could not be enabled.>>"%LOG_FILE%"
  exit /b 1
)

echo [%date% %time%] Funnel online: https://win-htgf0pfg08o.tail688ab8.ts.net/>>"%LOG_FILE%"
exit /b 0
