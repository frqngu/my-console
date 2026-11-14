@echo off
rem Makes the console the Windows shell for YOUR account: at sign-in the console opens first, and then it starts the taskbar and desktop (your second monitor keeps them).
rem To go back: run console-shell-off.bat
cd /d "%~dp0.."
if not exist "node_modules\electron\dist\electron.exe" ( echo Run start.bat once first so the console is set up. & pause & exit /b 1 )
echo This makes the console your Windows shell.
echo Before you continue, know how to get back if something goes wrong:
echo   Press Ctrl+Alt+Delete, choose Task Manager, File, Run new task, type  cmd  and press Enter,
echo   then run  console-shell-off.bat  from this folder, or type:  explorer.exe
echo.
choice /c YN /m "Turn it on now"
if errorlevel 2 exit /b 0
reg add "HKCU\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "\"%CD%\node_modules\electron\dist\electron.exe\" \"%CD%\"" /f >nul
if errorlevel 1 ( echo Could not write the setting. & pause & exit /b 1 )
echo Done. Sign out and back in (or restart) to try it.
echo To undo: run console-shell-off.bat
pause
