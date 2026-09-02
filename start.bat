@echo off
setlocal enabledelayedexpansion
title Portable LAN File Transfer

echo ========================================================
echo       PORTABLE LAN FILE TRANSFER - SERVER LAUNCHER
echo ========================================================
echo.

:: 1. Search for portable node.exe in multiple possible directories
set "NODE_EXE="

if exist "%~dp0node.exe" (
    set "NODE_EXE=%~dp0node.exe"
) else if exist "%~dp0bin\node.exe" (
    set "NODE_EXE=%~dp0bin\node.exe"
) else if exist "%~dp0node\node.exe" (
    set "NODE_EXE=%~dp0node\node.exe"
) else if exist "%~dp0nodejs\node.exe" (
    set "NODE_EXE=%~dp0nodejs\node.exe"
) else if exist "%~dp0..\node.exe" (
    set "NODE_EXE=%~dp0..\node.exe"
) else if exist "%~dp0..\bin\node.exe" (
    set "NODE_EXE=%~dp0..\bin\node.exe"
) else if exist "%~dp0..\nodejs\node.exe" (
    set "NODE_EXE=%~dp0..\nodejs\node.exe"
)

:: 2. If not found in local/parent folders, check system PATH
if not defined NODE_EXE (
    where node >nul 2>nul
    if !errorlevel! equ 0 (
        set "NODE_EXE=node"
        echo [*] Found system Node.js installation.
    )
)

:: 3. If still not found, show helpful instructions
if not defined NODE_EXE (
    echo.
    echo ========================================================
    echo  [!] ERROR: Portable Node.js ^(node.exe^) not found!
    echo ========================================================
    echo.
    echo  To run this portable application:
    echo.
    echo  1. Download or copy your portable 'node.exe'.
    echo  2. Place 'node.exe' directly into this folder:
    echo     %~dp0
    echo     ^(or inside a 'bin' or 'nodejs' subfolder^)
    echo  3. Double-click this start.bat again!
    echo.
    echo ========================================================
    echo.
    pause
    exit /b 1
)

:: 4. Verify compiled server exists
if not exist "%~dp0dist\server.cjs" (
    echo.
    echo ========================================================
    echo  [!] ERROR: Compiled server bundle not found at dist\server.cjs!
    echo ========================================================
    echo.
    echo  If you are running from source, please run:
    echo     npm run build
    echo.
    pause
    exit /b 1
)

:: 5. Port Configuration (Auto-loads saved port.conf or 3000, overrideable via argument/environment)
set "APP_PORT="
if exist "%~dp0port.conf" (
    set /p SAVED_PORT=<"%~dp0port.conf"
    if not "!SAVED_PORT!"=="" set "APP_PORT=!SAVED_PORT!"
)
if "!APP_PORT!"=="" (
    if exist "%~dp0uploads\_port.conf" (
        set /p SAVED_PORT2=<"%~dp0uploads\_port.conf"
        if not "!SAVED_PORT2!"=="" set "APP_PORT=!SAVED_PORT2!"
    )
)
if "!APP_PORT!"=="" set "APP_PORT=3000"
if defined PORT set "APP_PORT=!PORT!"

if not "%~1"=="" (
    if "%~1"=="--port" (
        if not "%~2"=="" set "APP_PORT=%~2"
    ) else if "%~1"=="-p" (
        if not "%~2"=="" set "APP_PORT=%~2"
    ) else (
        set "APP_PORT=%~1"
    )
)

set "PORT=!APP_PORT!"
set "NODE_ENV=production"

echo [*] Using Node runtime: !NODE_EXE!
echo [*] Auto-Run Localhost Port: !PORT!
echo [*] (Switch channels anytime in web dashboard or run: start.bat 1111, start.bat 2222, start.bat 5000, start.bat 8080)
echo [*] Initializing LAN File Transfer Server...
echo.

:: Ensure uploads directory exists
if not exist "%~dp0uploads" (
    mkdir "%~dp0uploads" >nul 2>nul
)

:: Auto-open default browser after 1.5 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:!PORT!"

:: Launch the standalone server
echo [*] Server running at http://localhost:!PORT!
echo [*] Press Ctrl+C in this console window to stop the server.
echo.
"!NODE_EXE!" "%~dp0dist\server.cjs" --port !PORT!

if !errorlevel! neq 0 (
    echo.
    echo [!] Server stopped unexpectedly with exit code !errorlevel!.
    pause
)
