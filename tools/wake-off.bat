@echo off
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v MyConsoleWake /f >nul 2>nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*native\wake.ps1*' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
echo The controller will no longer start My Console.
pause
