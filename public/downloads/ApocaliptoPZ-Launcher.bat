@echo off
title APOCALIPTO PZ // LAUNCHER DE ESCRITORIO P2P
color 0A
chcp 65001 >nul
cls

echo ===============================================================================
echo     APOCALIPTO PZ // CLIENTE DE ESCRITORIO P2P (BUILD 42.20.4)
echo     Filosofia Criptografica BTC // DPoH 250ms // Costo $0 Cloud
echo ===============================================================================
echo.

set "LAN_GATEWAY=http://192.168.0.102:19842"
set "LAUNCHER_LAN=http://192.168.0.102:5176/?gateway=%LAN_GATEWAY%"
set "LAUNCHER_LOCAL=http://localhost:5176"

echo [*] Inicializando entorno de ejecucion del Launcher de Escritorio...
echo [*] Conectando con el Enjambre Apocalipto PZ (%LAN_GATEWAY%)...
echo.

:: Detectar si estamos en el host principal o en nodo remoto
ping -n 1 127.0.0.1 >nul 2>&1
start "" "%LAUNCHER_LAN%"

echo.
echo ===============================================================================
echo   [OK] Aplicativo Launcher iniciado.
echo   1. Seleccione su faccion (DOE, MOK, KTO o RIV).
echo   2. Verifique su Hardware con DPoH (Micro-benchmark ultra-seguro 250ms).
echo   3. Con Whitelist concedida, presione "EJECUTAR JUEGO" para entrar a Knox.
echo ===============================================================================
echo.
pause
