@echo off
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MyConsole.vbs" 2>nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v MyConsole /f >nul 2>nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Serialize" /v StartupDelayInMSec /f >nul 2>nul
echo My Console will no longer start by itself.
pause
