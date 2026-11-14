@echo off
rem Stops the "Get an app to open this 'ms-gamebar' / 'ms-gamingoverlay' link" boxes (Windows shows them when Game Bar is removed: when the controller's Xbox button is pressed, and when a game starts).
rem It only changes this Windows user's handling of those links, and gamebar-quiet-off.bat undoes it.
for %%P in (ms-gamebar ms-gamingoverlay ms-gamebarservices) do (
  reg add "HKCU\Software\Classes\%%P" /ve /d "URL:%%P" /f >nul
  reg add "HKCU\Software\Classes\%%P" /v "URL Protocol" /d "" /f >nul
  reg add "HKCU\Software\Classes\%%P\shell\open\command" /ve /d "wscript.exe //B //Nologo \"%~dp0..\quiet-gamebar.vbs\" \"%%1\"" /f >nul
)
echo Done. Switch the controller off and on again, and launch a game, to try it.
echo To undo this later, run gamebar-quiet-off.bat
pause
