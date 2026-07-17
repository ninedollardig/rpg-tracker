@echo off
echo ================================
echo   RPG Tracker - Install Auto-Start
echo ================================
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS=%~dp0start-silent.vbs"
set "SHORTCUT=%STARTUP%\RPG-Tracker.lnk"

if not exist "%VBS%" (
    echo [ERROR] start-silent.vbs not found in current directory
    pause
    exit /b 1
)

echo Creating shortcut in Startup folder...
echo Source: %VBS%
echo Target: %SHORTCUT%
echo.

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%VBS%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'RPG Tracker Auto-Start'; $s.Save()"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Auto-start installed. RPG Tracker will start on next login.
) else (
    echo [ERROR] Failed to create shortcut
)

echo.
pause
