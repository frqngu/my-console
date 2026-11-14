@echo off
cd /d "%~dp0.."
del "%CD%\padoff.on" 2>nul
schtasks /delete /tn MyConsoleDongleOff /f >nul 2>nul
echo Closing the console will no longer touch the controller.
pause
