@echo off
setlocal

set "EXE_NAME=kolmics-win_x64.exe"
set "TARGET_PATH=%~dp0%EXE_NAME%"

:: Check if the executable exists
if not exist "%TARGET_PATH%" (
  echo [ERROR] %EXE_NAME% was not found.
  echo Please make sure this script is in the same folder as %EXE_NAME%.
  echo.
  pause
  exit /b
)

set "SENDTO_DIR=%APPDATA%\Microsoft\Windows\SendTo"
set "SHORTCUT_PATH=%SENDTO_DIR%\kolmics.lnk"

echo Adding "kolmics" to your "Send to" menu...

:: Create a shortcut using PowerShell
powershell -ExecutionPolicy Bypass -Command ^
    "$s=(New-Object -Com Object WScript.Shell).CreateShortcut('%SHORTCUT_PATH%'); ^
    $s.TargetPath='%TARGET_PATH%'; ^
    $s.WorkingDirectory='%~dp0'; ^
    $s.Description='Open with kolmics'; ^
    $s.Save()"

if %errorlevel% equ 0 (
    echo.
    echo Installation successful!
    echo You can now right-click any folder and select 'Send to' -^> 'kolmics'.
) else (
    echo.
    echo [ERROR] Something went wrong while creating the shortcut.
)

echo.
pause
