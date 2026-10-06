@echo off
title APOCALIPTO PZ // CENTRO DE CONTROL DEL SISTEMA
color 0A
chcp 65001 >nul
cls

echo ===============================================================================
echo     APOCALIPTO PZ // ECOSISTEMA DISTRIBUIDO P2P (BUILD 42.20.4)
echo     Filosofia Criptografica BTC // DPoH // Tolerancia a Fallos // $0 Cloud
echo ===============================================================================
echo.
echo  [1] Abrir Landing Page de Supervivencia (http://localhost:5173)
echo  [2] Abrir Launcher de Jugador P2P       (http://localhost:5176)
echo  [3] Abrir Bento Command OS (Admin)     (http://localhost:5174)
echo  [4] Ver Estado del Enjambre P2P        (http://localhost:19842/api/admin/stats)
echo  [5] Salir
echo.
set /p opt="Seleccione una opcion [1-5]: "

if "%opt%"=="1" (
    start http://localhost:5173
    goto end
)
if "%opt%"=="2" (
    start http://localhost:5176
    goto end
)
if "%opt%"=="3" (
    start http://localhost:5174
    goto end
)
if "%opt%"=="4" (
    start http://localhost:19842/api/admin/stats
    goto end
)

:end
exit
