// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn launch_steam_game(connect_address: String, username: String, faction: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // 1. Inyectar configuración de sesión en %USERPROFILE%/Zomboid del jugador
        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            let zomboid_dir = PathBuf::from(&user_profile).join("Zomboid");
            let lua_dir = zomboid_dir.join("Lua");
            let _ = fs::create_dir_all(&lua_dir);

            let clean_ip = if connect_address.contains(':') {
                connect_address.split(':').next().unwrap_or("147.185.221.215")
            } else {
                "147.185.221.215"
            };

            let clean_user = if username.trim().is_empty() {
                "Superviviente"
            } else {
                username.trim()
            };

            let clean_faction = if faction.trim().is_empty() {
                "MOK"
            } else {
                faction.trim()
            };

            let ini_content = format!(
                "ip={}\nport=63854\nuser={}\npassword=12345\nfaction={}\nspawnRegion={}\nserverName=Apocalipto PZ\n",
                clean_ip, clean_user, clean_faction, clean_faction
            );

            let _ = fs::write(zomboid_dir.join("apocalipto_session.ini"), &ini_content);
            let _ = fs::write(lua_dir.join("apocalipto_session.ini"), &ini_content);
            let _ = fs::write(zomboid_dir.join("apocalipto_connect.ini"), &ini_content);
            let _ = fs::write(lua_dir.join("apocalipto_connect.ini"), &ini_content);

            // Inyectar en bases de datos SQLite locales de Project Zomboid (Favoritos automáticos)
            let db_dir = zomboid_dir.join("db");
            let _ = fs::create_dir_all(&db_dir);
            for db_name in &["ServerList.db", "ServerListSteam.db"] {
                let db_path = db_dir.join(db_name);
                if let Ok(conn) = rusqlite::Connection::open(&db_path) {
                    let _ = conn.execute(
                        "CREATE TABLE IF NOT EXISTS server (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT UNIQUE,
                            ip TEXT,
                            port INTEGER,
                            serverPassword TEXT,
                            description TEXT,
                            mods TEXT,
                            icon BLOB,
                            banner BLOB,
                            panelBackground BLOB,
                            screenBackground BLOB,
                            lastOnline TEXT,
                            lastDataUpdate TEXT
                        )",
                        [],
                    );

                    let _ = conn.execute(
                        "CREATE TABLE IF NOT EXISTS account (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            serverId INTEGER,
                            playerFirstAndLastName TEXT,
                            username TEXT,
                            password TEXT,
                            isSavePassword INTEGER,
                            isUseSteamRelay INTEGER,
                            authType INTEGER,
                            icon BLOB,
                            timePlayed INTEGER,
                            lastLogon TEXT
                        )",
                        [],
                    );

                    let mut server_id: Option<i64> = conn
                        .query_row(
                            "SELECT id FROM server WHERE name = 'Apocalipto PZ'",
                            [],
                            |row| row.get(0),
                        )
                        .ok();

                    if let Some(sid) = server_id {
                        let _ = conn.execute(
                            "UPDATE server SET ip = ?1, port = 63854 WHERE id = ?2",
                            rusqlite::params![clean_ip, sid],
                        );
                    } else {
                        let _ = conn.execute(
                            "INSERT OR IGNORE INTO server (name, ip, port, serverPassword, description)
                             VALUES ('Apocalipto PZ', ?1, 63854, '', 'Servidor P2P Apocalipto PZ Build 42')",
                            rusqlite::params![clean_ip],
                        );
                        server_id = conn
                            .query_row(
                                "SELECT id FROM server WHERE name = 'Apocalipto PZ'",
                                [],
                                |row| row.get(0),
                            )
                            .ok();
                    }

                    if let Some(sid) = server_id {
                        let acc_exists: Result<i64, _> = conn.query_row(
                            "SELECT id FROM account WHERE serverId = ?1 AND username = ?2",
                            rusqlite::params![sid, clean_user],
                            |row| row.get(0),
                        );

                        if acc_exists.is_err() {
                            let _ = conn.execute(
                                "INSERT INTO account (serverId, username, password, isSavePassword, isUseSteamRelay, authType)
                                 VALUES (?1, ?2, '12345', 1, 0, 1)",
                                rusqlite::params![sid, clean_user],
                            );
                        }
                    }
                }
            }
        }

        // 2. Lanzar Project Zomboid directamente si el ejecutable existe en disco
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        if let Some(pz_exe) = find_pz_executable() {
            if let Some(pz_dir) = pz_exe.parent() {
                let spawn_res = std::process::Command::new(&pz_exe)
                    .current_dir(pz_dir)
                    .spawn();

                if spawn_res.is_ok() {
                    return Ok(format!("Project Zomboid iniciado directamente: {:?}", pz_exe));
                }
            }
        }

        // Fallback: ordenar a Steam ejecutar Project Zomboid Build 42 (App ID 108600)
        let steam_app_uri = "steam://rungameid/108600";
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", steam_app_uri])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;

        Ok("Project Zomboid iniciado vía Steam App ID 108600".into())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok("Entorno no-Windows".into())
    }
}

#[cfg(target_os = "windows")]
fn get_steam_path_from_registry() -> Option<String> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let output = std::process::Command::new("reg")
        .args(["query", r"HKCU\Software\Valve\Steam", "/v", "SteamPath"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            if line.contains("SteamPath") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    let path_val = parts[2..].join(" ").replace('/', "\\");
                    return Some(path_val);
                }
            }
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn find_pz_executable() -> Option<PathBuf> {
    // 1. Probar unidades comunes de Windows
    let drives = ["C", "D", "E", "F", "G", "H", "I"];
    for drive in drives {
        let candidates = [
            format!(r"{}:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid\ProjectZomboid64.exe", drive),
            format!(r"{}:\Program Files\Steam\steamapps\common\ProjectZomboid\ProjectZomboid64.exe", drive),
            format!(r"{}:\SteamLibrary\steamapps\common\ProjectZomboid\ProjectZomboid64.exe", drive),
            format!(r"{}:\Steam\steamapps\common\ProjectZomboid\ProjectZomboid64.exe", drive),
            format!(r"{}:\Games\Steam\steamapps\common\ProjectZomboid\ProjectZomboid64.exe", drive),
            format!(r"{}:\Games\ProjectZomboid\ProjectZomboid64.exe", drive),
        ];
        for cand in candidates {
            let p = PathBuf::from(&cand);
            if p.exists() {
                return Some(p);
            }
        }
    }

    // 2. Probar ruta de instalación de Steam desde el Registro y sus librerías
    if let Some(steam_path) = get_steam_path_from_registry() {
        let direct_pz = PathBuf::from(&steam_path)
            .join("steamapps")
            .join("common")
            .join("ProjectZomboid")
            .join("ProjectZomboid64.exe");
        if direct_pz.exists() {
            return Some(direct_pz);
        }

        // Leer bibliotecas adicionales en libraryfolders.vdf
        let vdf_path = PathBuf::from(&steam_path)
            .join("steamapps")
            .join("libraryfolders.vdf");
        if let Ok(content) = fs::read_to_string(vdf_path) {
            for line in content.lines() {
                if line.contains("\"path\"") {
                    let parts: Vec<&str> = line.split('"').collect();
                    if parts.len() >= 4 {
                        let lib_path = parts[3].replace(r"\\", r"\");
                        let cand = PathBuf::from(&lib_path)
                            .join("steamapps")
                            .join("common")
                            .join("ProjectZomboid")
                            .join("ProjectZomboid64.exe");
                        if cand.exists() {
                            return Some(cand);
                        }
                    }
                }
            }
        }
    }

    None
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_steam_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
