@echo off
rem Sets up the PS5 controller bridge for the SCUF Omega: drivers, build, start at sign-in. Double-click it; it asks for admin by itself.
cd /d "%~dp0.."
net session >nul 2>&1
if errorlevel 1 (
  echo Asking Windows for administrator rights...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
echo === PS5 controller bridge setup ===
echo Needs internet. Downloads ViGEmBus + HidHide (drivers), the .NET SDK and the bridge, about 300 MB, then builds it.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\native\bridge-setup.ps1"
if errorlevel 1 ( echo. & echo Something went wrong. Take a photo of the red text above and send it. )
echo.
if /i not "%1"=="nopause" pause
