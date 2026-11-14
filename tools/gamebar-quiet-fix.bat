@echo off
rem Fixes the "Select an app to open this 'ms-gamingoverlay' link" box that keeps coming back even after clicking Always.
rem Windows keeps an old saved choice for these links (left over from Game Bar, or from clicking Always) and asks again because that choice is no longer valid.
rem This removes ONLY that saved choice for the three Game Bar links of this Windows user and registers the quiet handler again. gamebar-quiet-off.bat undoes the handler.
for %%P in (ms-gamebar ms-gamingoverlay ms-gamebarservices) do (
  echo --- %%P
  reg delete "HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\%%P" /f
  reg add "HKCU\Software\Classes\%%P" /ve /d "URL:%%P" /f >nul
  reg add "HKCU\Software\Classes\%%P" /v "URL Protocol" /d "" /f >nul
  reg add "HKCU\Software\Classes\%%P\shell\open\command" /ve /d "wscript.exe //B //Nologo \"%~dp0..\quiet-gamebar.vbs\" \"%%1\"" /f >nul
)
echo.
echo Done. Close the console, start it again, and launch a game. If a box still appears, choose Always once more and tell me.
echo If a line above says "Access is denied", tell me which one.
pause
