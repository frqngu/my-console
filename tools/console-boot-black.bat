@echo off
rem Makes the plain background Windows shows before the console opens (the grey screen at power-on) the same pure black as the console.
rem To undo: run console-boot-black-off.bat
cd /d "%~dp0"
if not exist "boot-color-orig.txt" (
  for /f "tokens=2,*" %%a in ('reg query "HKCU\Control Panel\Colors" /v Background 2^>nul ^| find "Background"') do >"boot-color-orig.txt" echo %%b
)
reg add "HKCU\Control Panel\Colors" /v Background /t REG_SZ /d "0 0 0" /f >nul
rem the sign-in / pre-desktop screen uses the .DEFAULT user's colour (needs Run as administrator; skipped quietly if not)
reg add "HKU\.DEFAULT\Control Panel\Colors" /v Background /t REG_SZ /d "0 0 0" /f >nul 2>nul
rem no wallpaper picture, so the colour above is what shows (a picture or the default grey would otherwise cover it)
reg add "HKCU\Control Panel\Desktop" /v Wallpaper /t REG_SZ /d "" /f >nul
reg add "HKCU\Control Panel\Desktop" /v WallpaperStyle /t REG_SZ /d "0" /f >nul
rundll32.exe user32.dll,UpdatePerUserSystemParameters 1, True
echo Done. It takes effect the next time you sign in (restart the PC to see it).
echo For the sign-in screen too, right-click this file and choose Run as administrator.
pause
