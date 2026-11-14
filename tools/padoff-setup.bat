@echo off
rem Turns on "closing the console switches the controller off". Right-click this file and choose "Run as administrator" (needed once).
cd /d "%~dp0.."
net session >nul 2>&1
if errorlevel 1 ( echo Please right-click padoff-setup.bat and choose "Run as administrator". & pause & exit /b 1 )
powershell -NoProfile -ExecutionPolicy Bypass -Command "$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"' + '%CD%\native\padoff-admin.ps1' + '\"'); $p = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive; Register-ScheduledTask -TaskName MyConsoleDongleOff -Action $a -Principal $p -Force | Out-Null"
>"%CD%\padoff.on" echo yes
echo Done. Close the console to try it.
echo To undo this later, run padoff-remove.bat
pause
