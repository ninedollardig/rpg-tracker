@echo off
setlocal enabledelayedexpansion

set BACKEND_PORT=3001
set FRONTEND_PORT=5174

:: Check if backend is already running
set BACKEND_RUNNING=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING" 2^>nul') do set BACKEND_RUNNING=1

:: Check if frontend is already running
set FRONTEND_RUNNING=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING" 2^>nul') do set FRONTEND_RUNNING=1

if %BACKEND_RUNNING%==1 (
    echo [OK] Backend already running on port %BACKEND_PORT%
) else (
    echo [1/2] Starting backend...
    start "RPG-Backend" /MIN cmd /c "cd /d "%~dp0backend" && npm run dev"
)

if %FRONTEND_RUNNING%==1 (
    echo [OK] Frontend already running on port %FRONTEND_PORT%
) else (
    echo [2/2] Starting frontend...
    cd /d "%~dp0frontend"
    start "RPG-Frontend" /MIN cmd /c "npm run dev"
)

:: Wait a moment then open browser
timeout /t 2 /nobreak >nul
start http://localhost:%FRONTEND_PORT%

endlocal
