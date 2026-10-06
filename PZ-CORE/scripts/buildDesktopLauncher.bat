@echo off
chcp 65001 >nul
title APOCALIPTO PZ // COMPILADOR DEL LAUNCHER DESKTOP (.EXE)
cls

echo =========================================================================
echo    APOCALIPTO PZ // COMPILADOR TAURI WINDOWS DESKTOP (.EXE)
echo =========================================================================
echo.

:: 1. Verificar si Rust está instalado
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Rust/Cargo no esta instalado actualmente en este equipo.
    echo.
    echo     Para compilar el ejecutable .exe nativo de Windows:
    echo     1. Descarga el instalador oficial de Rust desde: https://rustup.rs/
    echo     2. Ejecuta rustup-init.exe y selecciona la instalacion por defecto (1)
    echo     3. Vuelve a ejecutar este script para compilar el instalador final.
    echo.
    echo [*] Nota: Mientras tanto, el Launcher de pruebas sigue funcionando
    echo     al 100%% en http://localhost:5176 con Ed25519 nativo.
    echo.
    pause
    exit /b 0
)

echo [✓] Compilador Rust detectado:
rustc --version
cargo --version
echo.

:: 2. Instalar CLI de Tauri si no existe
cd /d "%~dp0..\..\PZ-LAUNCHER"
echo [*] Instalando dependencias de empaquetado Tauri...
call npm install --save-dev @tauri-apps/cli

:: 3. Compilar Release .exe
echo.
echo [*] Compilando ejecutable .exe optimizado (Release)...
call npx tauri build

echo.
echo =========================================================================
echo [✓] COMPILACION FINALIZADA
echo     El instalador .exe generado se encuentra en:
echo     PZ-LAUNCHER\src-tauri\target\release\bundle\msi\
echo =========================================================================
pause
