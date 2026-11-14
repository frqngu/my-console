@echo off
for %%P in (ms-gamebar ms-gamingoverlay ms-gamebarservices) do reg delete "HKCU\Software\Classes\%%P" /f >nul 2>nul
echo Done. These links are back to how Windows had them.
pause
