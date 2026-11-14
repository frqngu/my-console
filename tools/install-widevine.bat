@echo off
cd /d "%~dp0.."
echo === Sound for Spotify inside the console (Widevine) ===
echo This swaps the console's Electron for the same version with Google's Widevine added.
echo It downloads about 120 MB. The console is closed for you.
if not exist "node_modules\electron\dist\electron.exe" (
  echo The console is not set up yet. Run start.bat once first, then close it and run this again.
  goto :end
)
echo Closing the console...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object { $_.Path -and $_.Path -like '%CD%\node_modules\electron\dist\*' } | Stop-Process -Force -ErrorAction SilentlyContinue"
timeout /t 3 /nobreak >nul
set ZIP=%TEMP%\electron-widevine.zip
set OUT=%TEMP%\electron-widevine-files
set URL=https://github.com/castlabs/electron-releases/releases/download/v34.5.8%%2Bwvcus/electron-v34.5.8%%2Bwvcus-win32-x64.zip
echo Downloading...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -Uri '%URL%' -OutFile '%ZIP%' -UseBasicParsing } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 ( echo Download failed. Check the internet and try again. & goto :end )
if exist "node_modules\electron\dist-original" (
  echo Putting the original Electron back first, so everything starts clean...
  rmdir /s /q "node_modules\electron\dist"
  xcopy /e /i /q /y "node_modules\electron\dist-original" "node_modules\electron\dist" >nul
) else (
  echo Keeping a copy of the old Electron so it can be put back...
  xcopy /e /i /q /y "node_modules\electron\dist" "node_modules\electron\dist-original" >nul
)
echo Unpacking...
if exist "%OUT%" rmdir /s /q "%OUT%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Expand-Archive -Path '%ZIP%' -DestinationPath '%OUT%' -Force"
if errorlevel 1 ( echo Unpacking failed. & goto :end )
echo Installing...
robocopy "%OUT%" "node_modules\electron\dist" /E /IS /IT /R:5 /W:2 /NFL /NDL /NJH /NJS /NC /NS /NP >nul
if errorlevel 8 ( echo Install failed because a file is still in use. Restart the PC and run this again. Run restore-electron.bat to put the old one back. & goto :end )
del "%ZIP%" >nul 2>nul
rmdir /s /q "%OUT%" >nul 2>nul
echo.
echo Done. Start the console as usual. The first start may take a little longer while Widevine downloads.
:end
if /i not "%1"=="nopause" pause
