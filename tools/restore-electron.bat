@echo off
cd /d "%~dp0.."
if not exist "node_modules\electron\dist-original" ( echo Nothing to restore. & goto :end )
echo Closing the console...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object { $_.Path -and $_.Path -like '%CD%\node_modules\electron\dist\*' } | Stop-Process -Force -ErrorAction SilentlyContinue"
timeout /t 3 /nobreak >nul
echo Putting the original Electron back...
rmdir /s /q "node_modules\electron\dist"
xcopy /e /i /q /y "node_modules\electron\dist-original" "node_modules\electron\dist" >nul
echo Done.
:end
pause
