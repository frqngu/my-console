@echo off
cd /d "%~dp0.."
echo === Sign the console's browser so Spotify will play music (castlabs, free) ===
echo.
if not exist "node_modules\electron\dist\electron.exe" (
  echo The console is not set up yet. Run start.bat once first, then close it and run this again.
  goto :end
)
if not exist "node_modules\electron\dist\WidevineCdm" if not exist "node_modules\electron\dist-original" (
  echo Run install-widevine.bat first, then come back to this one.
  goto :end
)
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY ( where python >nul 2>nul && set "PY=python" )
if not defined PY goto :nopy
%PY% -c "import sys; print(sys.version)" >nul 2>nul
if errorlevel 1 goto :nopy
goto :haspy
:nopy
echo Python is not installed on this PC. It is free and needed for the signing tool.
echo 1. Go to python.org/downloads and install the newest Python.
echo 2. On the first screen tick "Add python.exe to PATH".
echo 3. Run this file again.
goto :end
:haspy
echo Python found.
echo Closing the console...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object { $_.Path -and $_.Path -like '%CD%\node_modules\electron\dist\*' } | Stop-Process -Force -ErrorAction SilentlyContinue"
timeout /t 3 /nobreak >nul
if not exist "node_modules\electron\dist-unsigned" (
  echo Keeping a copy of the browser as it is now, so it can be put back...
  xcopy /e /i /q /y "node_modules\electron\dist" "node_modules\electron\dist-unsigned" >nul
)
echo Installing the signing tool...
%PY% -m pip install --upgrade castlabs-evs
if errorlevel 1 ( echo The signing tool did not install. Check the internet and try again. & goto :end )
echo.
set "HAVE="
set /p HAVE=Do you already have a castlabs EVS account? (y = yes, n = make one now): 
if /i "%HAVE%"=="y" goto :login
echo.
echo Making your free account. It asks for a name, email and password. Type them here,
echo then check your email for a message from castlabs and confirm it if it asks.
echo.
%PY% -m castlabs_evs.account signup
echo.
echo When the account is confirmed, press any key to continue.
pause >nul
:login
echo.
echo Signing in...
%PY% -m castlabs_evs.account reauth
echo.
echo Signing the console's browser (about a minute)...
%PY% -m castlabs_evs.vmp sign-pkg --streaming "%CD%\node_modules\electron\dist"
if errorlevel 1 (
  echo.
  echo Signing did not work. Take a photo of this window or copy the text above and send it to me.
  goto :end
)
echo.
echo Checking the signature...
%PY% -m castlabs_evs.vmp verify-pkg "%CD%\node_modules\electron\dist"
echo.
echo Done. Start the console, open Spotify and play a song.
echo If it does not work, run restore-electron.bat to put the old browser back.
:end
pause
