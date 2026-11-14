@echo off
rem Tries the "switch the controller off" step right now, so you can see whether it works. Your controller should switch off a moment after this runs.
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\native\padoff.ps1"
echo.
echo ---- what it did ----
type "%TEMP%\my-console-padoff.log"
echo.
pause
