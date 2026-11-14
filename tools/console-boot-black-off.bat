@echo off
rem Puts the Windows background colour back to what it was before console-boot-black.bat.
cd /d "%~dp0"
set "C=0 0 0"
if exist "boot-color-orig.txt" set /p C=<"boot-color-orig.txt"
reg add "HKCU\Control Panel\Colors" /v Background /t REG_SZ /d "%C%" /f >nul
del "boot-color-orig.txt" 2>nul
echo Done. The old colour is back from the next sign-in.
pause
