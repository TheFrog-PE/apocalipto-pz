@echo off
setlocal enableextensions
cd /d "C:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid"
title Apocalipto PZ - Nodo Alfa (Simulacion del Mundo)
SET _JAVA_OPTIONS=
SET PZ_CLASSPATH=./;projectzomboid.jar
echo ================================================================
echo  APOCALIPTO PZ // INICIANDO NODO ALFA (BUILD 42)
echo  Perfil de Servidor: ApocaliptoPZ
echo  Memoria Asignada:   4096 MB (4 GB RAM)
echo  Sandbox:            30%% Zombies Inteligentes, 3%% Sprinters
echo ================================================================
echo.
".\jre64\bin\javaw.exe" -Dzomboid.steam=1 -Dzomboid.znetlog=1 --enable-native-access=ALL-UNNAMED --add-exports=java.base/jdk.internal.misc=ALL-UNNAMED -XX:+UseZGC -XX:-CreateCoredumpOnCrash -XX:-OmitStackTraceInFastThrow -Xms2048m -Xmx4096m -Djava.library.path=./natives/;./natives/win64/;./ -cp %PZ_CLASSPATH% zombie.network.GameServer -servername ApocaliptoPZ -adminpassword ApocaliptoSwarm2026SecureRCON#Root!
