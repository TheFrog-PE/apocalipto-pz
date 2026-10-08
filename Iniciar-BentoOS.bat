@echo off
setlocal enableextensions
title Apocalipto PZ - Bento OS Launcher
cd /d "%~dp0"

echo ================================================================
echo   APOCALIPTO PZ // INICIANDO BENTO OS & NODO ENJAMBRE
echo ================================================================
echo.

:: 1. Iniciar Playit si no esta corriendo
net start playitd >nul 2>&1

:: 2. Verificar y arrancar Bridge si no esta escuchando en 19842
netstat -ano | findstr ":19842" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
  echo [*] Levantando Bridge del Enjambre P2P...
  start /min "Apocalipto PZ Bridge" node "E:\PZ-PROYECT\PZ-CORE\scripts\startBridge.js"
  timeout /t 2 /nobreak >nul
) else (
  echo [OK] Bridge del Enjambre P2P ya activo.
)

:: 3. Verificar y arrancar Tunel Watchdog (Sincronizador Autonomo de Gateway con GitHub)
tasklist | findstr /I "cloudflared" >nul 2>&1
if errorlevel 1 (
  echo [*] Levantando Guardian Autonomo de Tunel Cloudflare...
  start /min "Apocalipto PZ Tunnel Watchdog" node "E:\PZ-PROYECT\PZ-CORE\tunnel\tunnelWatchdog.js"
  timeout /t 2 /nobreak >nul
) else (
  echo [OK] Tunel de Enlace y Guardian ya activos.
)

:: 4. Lanzar Bento OS en modo Ventana de Aplicacion Standalone (Sin marco de navegador ni pestañas)
echo [OK] Abriendo interfaz Bento OS de Administracion...
if exist "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" (
  start "" "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --app="http://localhost:19842" --window-size=1280,820 --user-data-dir="%LOCALAPPDATA%\ApocaliptoBentoOS"
  exit
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
  start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:19842" --window-size=1280,820 --user-data-dir="%LOCALAPPDATA%\ApocaliptoBentoOS"
  exit
)

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:19842" --window-size=1280,820 --user-data-dir="%LOCALAPPDATA%\ApocaliptoBentoOS"
  exit
)

start "" "http://localhost:19842"
exit
