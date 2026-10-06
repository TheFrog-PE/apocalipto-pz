@echo off
chcp 65001 >nul
title APOCALIPTO PZ // NODO ALFA (HOST DEDICADO BUILD 42)
cls

echo =========================================================================
echo    APOCALIPTO PZ // INICIANDO NODO ALFA DEDICADO (BUILD 42)
echo    Red P2P Descentralizada ($0 Cloud) - Protocolo UDP 16261
echo =========================================================================
echo.

:: 1. Verificar preset de servidor en Zomboid/Server
if not exist "%USERPROFILE%\Zomboid\Server\ApocaliptoPZ.ini" (
    echo [*] Desplegando configuraciones maestras en Zomboid\Server...
    node "%~dp0deployServerPreset.js"
)

:: 2. Detectar ruta de instalación de Project Zomboid
set "PZ_DIR=C:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid"
set "PZ_SHORT=C:\PROGRA~2\Steam\steamapps\common\ProjectZomboid"

if exist "%PZ_SHORT%\ProjectZomboidServer.bat" (
    set "TARGET_DIR=%PZ_SHORT%"
) else if exist "%PZ_DIR%\ProjectZomboidServer.bat" (
    set "TARGET_DIR=%PZ_DIR%"
) else (
    echo [ERROR] No se encontro ProjectZomboidServer.bat en Steam.
    echo Verifica que Project Zomboid este instalado en Steam.
    pause
    exit /b 1
)

echo [✓] Directorio de juego detectado: %TARGET_DIR%
echo [✓] Servidor: ApocaliptoPZ (4 Facciones, PauseEmpty=true, 50 Slots)
echo.
echo Presiona cualquier tecla para arrancar el Nodo Alfa o cierra esta ventana...
pause >nul

cd /d "%TARGET_DIR%"
call ProjectZomboidServer.bat -servername ApocaliptoPZ -adminpassword apocalipto2026
pause
