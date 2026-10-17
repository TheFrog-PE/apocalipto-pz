Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\PZ-PROYECT"
WshShell.Run "cmd /c net start playitd", 0, False
WshShell.Run "node ""E:\PZ-PROYECT\PZ-CORE\scripts\startBridge.js""", 0, False
WshShell.Run "node ""E:\PZ-PROYECT\PZ-CORE\tunnel\tunnelWatchdog.js""", 0, False