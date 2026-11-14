@echo off
cd /d "%~dp0.."
echo === Sound engine for Spotify inside the console (go-librespot) ===
echo Downloads a small free program from github.com/devgianlu/go-librespot (about 15 MB).
echo The console starts it by itself and Spotify plays through your PC like a speaker called "Frankie Console".
echo Close the console first.
set DEST=%APPDATA%\go-librespot
if not exist "%DEST%" mkdir "%DEST%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $r=Invoke-RestMethod 'https://api.github.com/repos/devgianlu/go-librespot/releases/latest' -Headers @{'User-Agent'='my-console'}; $a=$r.assets | Where-Object { $_.name -match 'windows' -and $_.name -match 'x86_64|amd64' } | Select-Object -First 1; if(-not $a){ Write-Host 'No Windows download found in release' $r.tag_name; $r.assets | ForEach-Object { Write-Host ' ' $_.name }; exit 1 }; Write-Host 'Downloading' $a.name; $f=Join-Path $env:TEMP $a.name; Invoke-WebRequest $a.browser_download_url -OutFile $f -UseBasicParsing; if($f -match '\.zip$'){ Expand-Archive $f -DestinationPath '%DEST%' -Force } else { tar -xf $f -C '%DEST%' }; Remove-Item $f"
if errorlevel 1 ( echo. & echo The download did not work. Take a photo of the messages above and send it. & goto :end )
if not exist "%DEST%\go-librespot.exe" (
  for /r "%DEST%" %%F in (go-librespot.exe) do if exist "%%F" copy /y "%%F" "%DEST%\go-librespot.exe" >nul
)
if not exist "%DEST%\go-librespot.exe" ( echo go-librespot.exe was not found after unpacking. Take a photo of this and send it. & goto :end )
echo Fetching the support files the sound engine needs...
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\native\get-sound-libs.ps1" -Dest "%DEST%"
if errorlevel 1 ( echo. & echo The support files could not be fetched. Take a photo of the messages above and send it. & goto :end )
if not exist "%DEST%\config.yml" (
  > "%DEST%\config.yml" echo log_level: info
  >> "%DEST%\config.yml" echo device_name: Frankie Console
  >> "%DEST%\config.yml" echo device_type: computer
  >> "%DEST%\config.yml" echo audio_backend: wasapi
  >> "%DEST%\config.yml" echo zeroconf_enabled: false
  >> "%DEST%\config.yml" echo credentials:
  >> "%DEST%\config.yml" echo   type: device_auth
  >> "%DEST%\config.yml" echo server:
  >> "%DEST%\config.yml" echo   enabled: true
  >> "%DEST%\config.yml" echo   address: 127.0.0.1
  >> "%DEST%\config.yml" echo   port: 3678
)
echo.
echo Done. Start the console. The Spotify screen will show a short code to enter at spotify.com/pair (once).
:end
if /i not "%1"=="nopause" pause
