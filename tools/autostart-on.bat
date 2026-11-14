@echo off
rem Starts My Console the moment Windows signs in, with Windows' own startup delay turned off so it is as early as possible.
cd /d "%~dp0.."
if not exist "node_modules\electron\dist\electron.exe" ( echo Run start.bat once first so the app is set up. & pause & exit /b 1 )
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MyConsole.vbs" 2>nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v MyConsole /t REG_SZ /d "wscript.exe \"%CD%\start-hidden.vbs\"" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Serialize" /v StartupDelayInMSec /t REG_DWORD /d 0 /f >nul
echo Done. My Console will start as early as Windows allows when you sign in.
echo To undo this later, run autostart-off.bat
pause
