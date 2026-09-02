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

echo [*] Using Node runtime: !NODE_EXE!
echo [*] Initializing LAN File Transfer Server...
echo.

:: Ensure uploads directory exists
if not exist "%~dp0uploads" (
    mkdir "%~dp0uploads" >nul 2>nul
)

:: Set environment variables
set "NODE_ENV=production"
if not defined PORT set "PORT=3000"

:: Auto-open default browser after 1.5 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:!PORT!"

:: Launch the standalone server
echo [*] Server is starting on port !PORT!...
echo [*] Press Ctrl+C in this console window to stop the server.
echo.
"!NODE_EXE!" "%~dp0dist\server.cjs"

if !errorlevel! neq 0 (
    echo.
    echo [!] Server stopped unexpectedly with exit code !errorlevel!.
    pause
)
