#![windows_subsystem = "windows"]

use std::fs;
use std::net::TcpStream;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn is_port_listening(port: u16) -> bool {
    TcpStream::connect_timeout(
        &std::net::SocketAddr::from(([127, 0, 0, 1], port)),
        Duration::from_millis(300),
    )
    .is_ok()
}

fn ensure_windows_startup() {
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let startup_dir = PathBuf::from(appdata)
            .join("Microsoft")
            .join("Windows")
            .join("Start Menu")
            .join("Programs")
            .join("Startup");

        if startup_dir.exists() {
            let vbs_content = r#"Set WshShell = CreateObject("WScript.Shell")
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
On Error Resume Next
http.open "GET", "http://localhost:19842", False
http.send
If Err.Number <> 0 Then
    WshShell.CurrentDirectory = "E:\PZ-PROYECT"
    WshShell.Run "cmd /c net start playitd", 0, False
    WshShell.Run "node ""E:\PZ-PROYECT\PZ-CORE\scripts\startBridge.js""", 0, False
    WshShell.Run "node ""E:\PZ-PROYECT\PZ-CORE\tunnel\tunnelWatchdog.js""", 0, False
End If
"#;
            let _ = fs::write(startup_dir.join("ApocaliptoBentoDaemon.vbs"), vbs_content);
        }
    }
}

fn start_daemon_silently() {
    let vbs_path = r"E:\PZ-PROYECT\PZ-CORE\scripts\startBridgeSilent.vbs";
    let _ = Command::new("wscript.exe")
        .arg(vbs_path)
        .current_dir(r"E:\PZ-PROYECT")
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
}

fn main() {
    // 1. Asegurar auto-arranque silencioso de fondo en Windows
    ensure_windows_startup();

    // 2. Si el servidor de Bento OS (puerto 19842) no está activo, iniciarlo 100% silencioso
    if !is_port_listening(19842) {
        start_daemon_silently();

        let start = Instant::now();
        while start.elapsed() < Duration::from_secs(8) {
            std::thread::sleep(Duration::from_millis(250));
            if is_port_listening(19842) {
                break;
            }
        }
    }

    // 3. Abrir la interfaz de Bento OS como Aplicación de Escritorio Nativa (PWA Standalone)
    let localappdata = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Temp".to_string());
    let user_data = format!(r"{}\ApocaliptoBentoOS", localappdata);
    let app_arg = "--app=http://localhost:19842";
    let window_size = "--window-size=1380,880";
    let data_arg = format!("--user-data-dir={}", user_data);

    let candidates = [
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ];

    for candidate in candidates {
        if Path::new(candidate).exists() {
            let res = Command::new(candidate)
                .args([app_arg, window_size, &data_arg])
                .creation_flags(CREATE_NO_WINDOW)
                .spawn();
            if res.is_ok() {
                return;
            }
        }
    }

    let _ = Command::new("cmd")
        .args(["/c", "start", "http://localhost:19842"])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
}
