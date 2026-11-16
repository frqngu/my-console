@echo off
rem Stops the PS5 controller bridge and removes it from startup (the drivers stay installed).
net session >nul 2>&1
if errorlevel 1 ( powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" & exit /b )
taskkill /f /im ScufDualSense.exe >nul 2>&1
schtasks /delete /tn ConsoleControllerBridge /f >nul 2>&1
if exist "%ProgramData%\ConsoleBridge\installed.txt" del "%ProgramData%\ConsoleBridge\installed.txt"
echo The bridge is off and no longer starts with Windows. Run install-controller-bridge.bat to bring it back.
pause
