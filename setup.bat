@echo off
cd /d "%~dp0"
echo === My Console setup ===
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org, restart the PC, then run this again.
  goto :end
)
echo %CD% | find /i "OneDrive" >nul
if not errorlevel 1 echo WARNING: this folder is inside OneDrive, which can break the install. Moving it to C:\console is safer.
echo Installing the app's parts. This takes 1 to 3 minutes. Yellow warnings are fine...
call npm install --foreground-scripts
rem newer npm versions refuse to run Electron's own download step, so it is run directly
if exist "node_modules\electron\install.js" if not exist "node_modules\electron\dist\electron.exe" (
  echo Downloading Electron...
  node node_modules\electron\install.js
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Retrying the Electron download...
  call npm rebuild electron --foreground-scripts
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Retrying with a clean install...
  if exist node_modules rmdir /s /q node_modules
  call npm install electron@latest --save-dev --foreground-scripts
  if exist "node_modules\electron\install.js" if not exist "node_modules\electron\dist\electron.exe" node node_modules\electron\install.js
)
if exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo Setup finished.
) else (
  echo.
  echo Setup FAILED. Take a photo of the messages above and send it.
)
:end
if /i not "%1"=="nopause" pause
