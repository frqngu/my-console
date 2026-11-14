@echo off
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo First run: installing the app's parts. This takes 1 to 3 minutes...
  call setup.bat nopause
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo Setup did not finish. Take a photo of the messages above and send it.
  pause
  exit /b 1
)
echo Starting My Console... (press Alt+F4 in the console to quit)
call npm start
echo.
echo The console has closed. If something went wrong, the message is above.
pause
