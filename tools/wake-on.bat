@echo off
rem Turns on "switch the controller on = My Console starts" (only if the console is not already running).
cd /d "%~dp0.."
if not exist "node_modules\electron\dist\electron.exe" ( echo Run start.bat once first so the app is set up. & pause & exit /b 1 )
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*native\wake.ps1*' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v MyConsoleWake /t REG_SZ /d "wscript.exe \"%CD%\wake-hidden.vbs\"" /f >nul
start "" wscript.exe "%CD%\wake-hidden.vbs"
echo Done. Switch your controller off and on again, or hold its Xbox button while the console is closed, to try it.
echo To undo this later, run wake-off.bat
pause
