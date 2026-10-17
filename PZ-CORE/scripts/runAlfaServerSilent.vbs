Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid"
WshShell.Run "cmd /c ""E:\PZ-PROYECT\PZ-CORE\scripts\runAlfaServer.bat""", 0, False
