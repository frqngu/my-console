@echo off
rem Puts the normal Windows shell back for your account.
reg delete "HKCU\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /f >nul 2>&1
echo Done. The normal Windows desktop is back from the next sign-in.
echo (If you are on a black screen right now, press Ctrl+Alt+Delete, Task Manager, File, Run new task, type explorer.exe)
pause
