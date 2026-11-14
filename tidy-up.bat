@echo off
rem Run this ONCE after unzipping this version over your old console folder. It deletes the old loose files that now live in the "tools" folder (or are no longer needed), then deletes itself.
cd /d "%~dp0"
for %%F in (autostart-on.bat autostart-off.bat console-shell-on.bat console-shell-off.bat console-boot-black.bat console-boot-black-off.bat gamebar-quiet-on.bat gamebar-quiet-off.bat gamebar-quiet-fix.bat gamebar-quiet-on.reg install-sound-engine.bat install-widevine.bat sign-widevine.bat restore-electron.bat padoff-setup.bat padoff-remove.bat padoff-test.bat wake-on.bat wake-off.bat ROADMAP.txt) do if exist "%%F" del "%%F"
echo Tidied. The setup and undo files are now in the "tools" folder.
pause
(goto) 2>nul & del "%~f0"
