// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use sha2::{Digest, Sha256};

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

#[cfg(target_os = "windows")]
fn get_all_pz_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    let mut seen = std::collections::HashSet::new();

    if let Some(pz_exe) = find_pz_executable() {
        if let Some(parent) = pz_exe.parent() {
            let p = parent.to_path_buf();
            seen.insert(p.clone());
            dirs.push(p);
        }
    }

    if let Some(steam_path) = get_steam_path_from_registry() {
        let p = PathBuf::from(steam_path).join("steamapps").join("common").join("ProjectZomboid");
        if p.exists() && !seen.contains(&p) {
            seen.insert(p.clone());
            dirs.push(p);
        }
    }

    for drive in &["C", "D", "E", "F", "G", "H", "I"] {
        for prefix in &[
            format!(r"{}:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid", drive),
            format!(r"{}:\Program Files\Steam\steamapps\common\ProjectZomboid", drive),
            format!(r"{}:\SteamLibrary\steamapps\common\ProjectZomboid", drive),
            format!(r"{}:\Steam\steamapps\common\ProjectZomboid", drive),
            format!(r"{}:\Games\Steam\steamapps\common\ProjectZomboid", drive),
            format!(r"{}:\Games\ProjectZomboid", drive),
        ] {
            let p = PathBuf::from(prefix);
            if p.exists() && !seen.contains(&p) {
                seen.insert(p.clone());
                dirs.push(p);
            }
        }
    }

    dirs
}

fn is_host_server_node() -> bool {
    std::path::Path::new(r"E:\PZ-PROYECT").exists() || std::path::Path::new(r"E:\PZ-PROYECT\PZ-CORE").exists()
}

/// SANEAMIENTO Y AUTO-CURACIÓN TOTAL VANILLA
/// Restaura MapSpawnSelect.lua, ServerConnectPopup.lua y MainScreen.lua a su estado vanilla 100% puro.
/// Elimina cualquier puente efímero o ticket para que el cliente NUNCA sufra DoLuaChecksum kicks
/// en otros servidores multijugador públicos o en partidas en solitario.
fn run_full_vanilla_sanitization() {
    #[cfg(target_os = "windows")]
    {
        let _is_host = is_host_server_node();
        for pz_dir in get_all_pz_dirs() {
            let lua_client = pz_dir.join("media").join("lua").join("client");
            let option_screens = lua_client.join("OptionScreens");

            // 1. Limpiar archivos efímeros inyectados en media/lua/client/
            let _ = fs::remove_file(lua_client.join("ApocaliptoConnectBridge.lua"));
            let _ = fs::remove_file(lua_client.join("ApocaliptoFactionAutoSync.lua"));

            // 2. Limpiar tickets e inis en el directorio raíz del juego
            let _ = fs::remove_file(pz_dir.join("apocalipto_session.ini"));
            let _ = fs::remove_file(pz_dir.join("apocalipto_connect.ini"));
            let _ = fs::remove_file(pz_dir.join("apocalipto_launch_ticket.ini"));
            let _ = fs::remove_file(pz_dir.join("apocalipto_faction.txt"));

            // 3. Auto-curación de MapSpawnSelect.lua
            let map_spawn_path = option_screens.join("MapSpawnSelect.lua");
            let map_spawn_bak = option_screens.join("MapSpawnSelect.lua.vanilla_bak");
            if map_spawn_bak.exists() {
                let _ = fs::copy(&map_spawn_bak, &map_spawn_path);
                let _ = fs::remove_file(&map_spawn_bak);
            } else if map_spawn_path.exists() {
                if let Ok(content) = fs::read_to_string(&map_spawn_path) {
                    if content.contains("Apocalipto") || content.contains("apocalipto") || content.contains("getApocaliptoFaction") {
                        let vanilla_spawn_methods = "function MapSpawnSelect:hasChoices()\n\tlocal regions = self:getSpawnRegions()\n\treturn regions and #regions > 1\nend\n\nfunction MapSpawnSelect:useDefaultSpawnRegion()\n\tself.selectedRegion = nil\n\tlocal regions = self:getSpawnRegions()\n\tif regions and #regions > 0 then\n\t\tself.selectedRegion = regions[1]\n\t\tsetSpawnRegion(self.selectedRegion.name)\n\t\tgetCore():setSelectedMap(tostring(self.selectedRegion.name))\n\t\treturn self.selectedRegion\n\tend\nend\n\n";
                        
                        // Caso A: Inyección de getApocaliptoFaction antes de fillList()
                        if let Some(start_idx) = content.find("function MapSpawnSelect:getApocaliptoFaction()") {
                            if let Some(end_rel) = content[start_idx..].find("function MapSpawnSelect:fillList()") {
                                let end_idx = start_idx + end_rel;
                                let repaired = format!("{}{}{}", &content[..start_idx], vanilla_spawn_methods, &content[end_idx..]);
                                let _ = fs::write(&map_spawn_path, repaired);
                            }
                        } else if let Some(cut_idx) = content.find("-- [APOCALIPTO PZ] BYPASS DE SPAWN FORZADO POR FACCION") {
                            // Caso B: Inyección antigua al final del archivo
                            let repaired = content[..cut_idx].trim_end().to_string() + "\n";
                            let _ = fs::write(&map_spawn_path, repaired);
                        }
                    }
                }
            }

            // 4. Auto-curación de ServerConnectPopup.lua
            let server_popup_path = option_screens.join("ServerConnectPopup.lua");
            let server_popup_bak = option_screens.join("ServerConnectPopup.lua.vanilla_bak");
            if server_popup_bak.exists() {
                let _ = fs::copy(&server_popup_bak, &server_popup_path);
                let _ = fs::remove_file(&server_popup_bak);
            } else if server_popup_path.exists() {
                if let Ok(content) = fs::read_to_string(&server_popup_path) {
                    if content.contains("[APOCALIPTO PZ]") || content.contains("isApocConnecting") || content.contains("chosenFaction") {
                        let vanilla_set_server = "function ServerConnectPopup:setServer(ip, port, passwordStr)\n    if not type(port) == \"string\" then error \"port must be a string\" end\n    self.ip = ip;\n    self.port = port;\n\n    local servers = getServerList();\n    for _,server in ipairs(servers) do\n        if server:getIp() == self.ip and tostring(server:getPort()) == tostring(self.port) then\n            self.serverPasswordEntry:setText(passwordStr or server:getPwd() or \"\")\n            self.usernameEntry:setText(server:getUserName())\n            self.passwordEntry:setText(server:getPassword())\n            if getSteamModeActive() and self.connectTypeEntry then\n                self.connectTypeEntry.selected[1] = server:getUseSteamRelay()\n            end\n        end\n    end\nend\n\n";
                        if let Some(start_idx) = content.find("function ServerConnectPopup:setServer(ip, port, passwordStr)") {
                            if let Some(end_rel) = content[start_idx..].find("function ServerConnectPopup:prerender()") {
                                let end_idx = start_idx + end_rel;
                                let repaired = format!("{}{}{}", &content[..start_idx], vanilla_set_server, &content[end_idx..]);
                                let _ = fs::write(&server_popup_path, repaired);
                            }
                        }
                    }
                }
            }

            // 5. Auto-curación de MainScreen.lua
            let main_screen_path = option_screens.join("MainScreen.lua");
            let main_screen_bak = option_screens.join("MainScreen.lua.vanilla_bak");
            if main_screen_bak.exists() {
                let _ = fs::copy(&main_screen_bak, &main_screen_path);
                let _ = fs::remove_file(&main_screen_bak);
            } else if main_screen_path.exists() {
                if let Ok(content) = fs::read_to_string(&main_screen_path) {
                    let hook_start = "        -- [APOCALIPTO PZ] TICKET DE SESION";
                    let hook_end_anchor = "        if okTicket and ticketUsed then";
                    if let (Some(hs), Some(he_rel)) = (content.find(hook_start), content[..].find(hook_end_anchor)) {
                        if hs < he_rel {
                            let end_str = "        if okTicket and ticketUsed then\n            return\n        end\n";
                            let end_pos = he_rel + end_str.len();
                            if end_pos <= content.len() {
                                let repaired = format!("{}{}", &content[..hs], &content[end_pos..]);
                                let _ = fs::write(&main_screen_path, repaired);
                            }
                        }
                    }
                }
            }
        }

        // 6. Limpieza de tickets en %USERPROFILE%/Zomboid
        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            let zomboid_dir = PathBuf::from(&user_profile).join("Zomboid");
            let lua_dir = zomboid_dir.join("Lua");
            let _ = fs::remove_file(zomboid_dir.join("apocalipto_session.ini"));
            let _ = fs::remove_file(lua_dir.join("apocalipto_session.ini"));
            let _ = fs::remove_file(zomboid_dir.join("apocalipto_connect.ini"));
            let _ = fs::remove_file(lua_dir.join("apocalipto_connect.ini"));
            let _ = fs::remove_file(zomboid_dir.join("apocalipto_launch_ticket.ini"));
            let _ = fs::remove_file(lua_dir.join("apocalipto_launch_ticket.ini"));
            let _ = fs::remove_file(zomboid_dir.join("apocalipto_faction.txt"));
            let _ = fs::remove_file(lua_dir.join("apocalipto_faction.txt"));
        }
    }
}

/// Genera el código del puente Lua en memoria.
/// Hookea en tiempo de ejecución (RAM) MapSpawnSelect, BootstrapConnectPopup y ServerConnectPopup
/// de modo que NINGÚN archivo original en disco sea modificado jamás.
fn build_bridge_lua_code(user: &str, faction: &str, ip: &str, port: u16, password: &str) -> String {
    format!(r##"-- [APOCALIPTO PZ] Puente de Conexion Automatica Seguro y Sandbox en Memoria
local bridgeRan = false
local EMBEDDED_TICKET = {{
    user = "{user}",
    faction = "{faction}",
    ip = "{ip}",
    port = "{port}",
    serverName = "Apocalipto PZ",
    password = "{password}"
}}

local function safeLog(msg)
    pcall(function() print("[APOCALIPTO PZ] " .. tostring(msg)) end)
end

-- Hook de Seleccion de Spawn por Faccion en Memoria
local function hookMapSpawnSelect()
    pcall(function()
        if MapSpawnSelect and not _G.ApocaliptoSpawnHooked then
            _G.ApocaliptoSpawnHooked = true
            
            local old_hasChoices = MapSpawnSelect.hasChoices
            MapSpawnSelect.hasChoices = function(self)
                local targetFaction = (_G.ApocaliptoSession and _G.ApocaliptoSession.faction) or EMBEDDED_TICKET.faction
                if targetFaction and targetFaction ~= "" then
                    return false
                end
                if old_hasChoices then return old_hasChoices(self) end
                local regions = self:getSpawnRegions()
                return regions and #regions > 1
            end

            local old_useDefault = MapSpawnSelect.useDefaultSpawnRegion
            MapSpawnSelect.useDefaultSpawnRegion = function(self)
                self.selectedRegion = nil
                local regions = self:getSpawnRegions()
                if regions and #regions > 0 then
                    local targetFaction = (_G.ApocaliptoSession and _G.ApocaliptoSession.faction) or EMBEDDED_TICKET.faction
                    if targetFaction and targetFaction ~= "" then
                        local fTag = string.upper(tostring(targetFaction))
                        for _, r in ipairs(regions) do
                            if string.find(string.upper(tostring(r.name)), fTag) then
                                self.selectedRegion = r
                                setSpawnRegion(r.name)
                                getCore():setSelectedMap(tostring(r.name))
                                safeLog("Spawn auto-asignado a territorio: " .. tostring(r.name))
                                return self.selectedRegion
                            end
                        end
                    end

                    if old_useDefault then return old_useDefault(self) end
                    self.selectedRegion = regions[1]
                    setSpawnRegion(self.selectedRegion.name)
                    getCore():setSelectedMap(tostring(self.selectedRegion.name))
                    return self.selectedRegion
                end
            end
            safeLog("MapSpawnSelect hookeado dinamicamente con exito.")
        end
    end)
end

-- Intento de conexion (Se ejecuta UNICAMENTE en el primer menu principal vanilla)
local function tryConnect()
    if bridgeRan then return end

    -- Si ya estamos en cliente de red o jugando, jamas reconectar
    if isClient and isClient() then
        bridgeRan = true
        return
    end

    local mainScreen = MainScreen and MainScreen.instance
    if not mainScreen or not mainScreen.bottomPanel then
        return
    end

    -- Si ya estamos en las pantallas de creacion de personaje o spawn, jamas conectar
    if (mainScreen.charCreationProfession and mainScreen.charCreationProfession:getIsVisible()) or
       (mainScreen.charCreationMain and mainScreen.charCreationMain:getIsVisible()) then
        bridgeRan = true
        return
    end

    local connectUI = (ConnectToServer and ConnectToServer.instance) or mainScreen.connectToServer
    if not connectUI then
        return
    end

    -- Si ya esta en proceso de conexion, no volver a llamarlo
    if connectUI.connecting then
        bridgeRan = true
        return
    end

    local ticket = EMBEDDED_TICKET
    if not ticket or not ticket.user or ticket.user == "" or not ticket.ip or ticket.ip == "" then
        return
    end

    bridgeRan = true -- Marcar inmediatamente para que ningun otro frame lo invoque

    if connectUI.create and not connectUI.title then
        pcall(function() connectUI:create() end)
    end

    local targetPort = tostring(ticket.port or 16261)
    safeLog("CONEXION AUTOMATICA: Conectando como '" .. tostring(ticket.user) .. "' -> " .. tostring(ticket.ip) .. ":" .. targetPort)

    if not _G.ApocaliptoSession then _G.ApocaliptoSession = {{}} end
    _G.ApocaliptoSession.faction = ticket.faction or "MOK"
    _G.ApocaliptoSession.user = ticket.user
    _G.ApocaliptoSession.serverName = ticket.serverName or "Apocalipto PZ"

    pcall(function()
        connectUI:connect(
            mainScreen.bottomPanel or mainScreen,
            ticket.serverName or "Apocalipto PZ",
            ticket.user,
            ticket.password or "12345",
            ticket.ip,
            "",
            targetPort,
            "",
            true,
            true,
            1
        )
    end)
    safeLog("ConnectToServer:connect() invocado con exito.")
end

-- Hook dinamico a MainScreen
local function setupHooks()
    pcall(function()
        hookMapSpawnSelect()
        
        if MainScreen and not MainScreen._apocaliptoHooked then
            MainScreen._apocaliptoHooked = true

            local old_prerender = MainScreen.prerender
            MainScreen.prerender = function(self, ...)
                local res
                if old_prerender then res = old_prerender(self, ...) end
                if not bridgeRan then
                    pcall(tryConnect)
                end
                return res
            end

            local old_render = MainScreen.render
            MainScreen.render = function(self, ...)
                local res
                if old_render then res = old_render(self, ...) end
                if not bridgeRan then
                    pcall(tryConnect)
                end
                return res
            end

            local old_OnTick = MainScreen.OnTick
            MainScreen.OnTick = function(...)
                local res
                if old_OnTick then res = old_OnTick(...) end
                if not bridgeRan then
                    pcall(tryConnect)
                end
                return res
            end

            safeLog("MainScreen hooks inyectados con exito.")
        end
    end)
end

-- Cargar inmediatamente y registrar en eventos del motor
pcall(function()
    setupHooks()
    if Events and Events.OnMainMenuEnter then
        Events.OnMainMenuEnter.Add(function()
            safeLog("OnMainMenuEnter disparado.")
            setupHooks()
            tryConnect()
        end)
    end
end)
"##)
}

fn spawn_process_exit_cleaner() {
    std::thread::spawn(move || {
        for _ in 0..30 {
            std::thread::sleep(std::time::Duration::from_secs(1));
            if is_game_running() {
                break;
            }
        }
        while is_game_running() {
            std::thread::sleep(std::time::Duration::from_millis(1500));
        }
        run_full_vanilla_sanitization();
    });
}

#[tauri::command]
fn launch_steam_game(connect_address: String, username: String, faction: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // 0. Saneamiento preventivo total: restaurar todo a vanilla antes de empezar
        run_full_vanilla_sanitization();

        let (raw_host, clean_port) = if let Some((ip, port)) = connect_address.split_once(':') {
            let parsed_port = port.trim().parse::<u16>().unwrap_or(63854);
            let final_port = if parsed_port == 63855 { 63854 } else { parsed_port };
            (ip.trim().to_string(), final_port)
        } else {
            let default_p = if connect_address.trim() == "127.0.0.1" || connect_address.trim() == "localhost" || connect_address.trim() == "192.168.0.101" { 16261 } else { 63854 };
            (connect_address.trim().to_string(), default_p)
        };

        // Si el host es el dominio del túnel Playit, resolvemos su IP directa para evitar fallos de DNS.
        // Si es loopback (127.0.0.1), cambiamos a la LAN IP del host (192.168.0.101) porque Steam Networking rechaza 127.0.0.1.
        let (clean_ip, clean_port) = if raw_host == "rails-switching.tun.ply.gg" || raw_host == "147.185.221.215" {
            ("147.185.221.215".to_string(), 63854)
        } else if raw_host == "127.0.0.1" || raw_host == "localhost" || raw_host.is_empty() {
            ("192.168.0.101".to_string(), 16261)
        } else {
            (raw_host, clean_port)
        };

        let clean_user = if username.trim().is_empty() {
            "Superviviente".to_string()
        } else {
            username.trim().to_string()
        };

        let clean_faction = if faction.trim().is_empty() {
            "MOK".to_string()
        } else {
            faction.trim().to_string()
        };

        let ticket_content = format!(
            "user={}\nfaction={}\nip={}\nport={}\nserverName=Apocalipto PZ\npassword=12345\n",
            clean_user, clean_faction, clean_ip, clean_port
        );

        // 1. Inyectar configuración de sesión en %USERPROFILE%/Zomboid del jugador
        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            let zomboid_dir = PathBuf::from(&user_profile).join("Zomboid");
            let lua_dir = zomboid_dir.join("Lua");
            let _ = fs::create_dir_all(&lua_dir);

            // Escribir ticket efímero de conexión automática directa
            let ticket_path = zomboid_dir.join("apocalipto_launch_ticket.ini");
            let lua_ticket_path = lua_dir.join("apocalipto_launch_ticket.ini");
            let _ = fs::write(&ticket_path, &ticket_content);
            let _ = fs::write(&lua_ticket_path, &ticket_content);

            // Escribir facción activa para enrutamiento automático de spawn en RAM
            let _ = fs::write(lua_dir.join("apocalipto_faction.txt"), &clean_faction);
            let _ = fs::write(zomboid_dir.join("apocalipto_faction.txt"), &clean_faction);

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
                            "UPDATE server SET ip = ?1, port = ?2 WHERE id = ?3",
                            rusqlite::params![clean_ip, clean_port as i64, sid],
                        );
                    } else {
                        let _ = conn.execute(
                            "INSERT OR IGNORE INTO server (name, ip, port, serverPassword, description)
                             VALUES ('Apocalipto PZ', ?1, ?2, '', 'Servidor P2P Apocalipto PZ Build 42')",
                            rusqlite::params![clean_ip, clean_port as i64],
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

                        let b_pwd = "12345";

                        if acc_exists.is_err() {
                            let _ = conn.execute(
                                "INSERT INTO account (serverId, username, password, playerFirstAndLastName, isSavePassword, isUseSteamRelay, authType, lastLogon)
                                 VALUES (?1, ?2, ?3, ?4, 1, 1, 1, datetime('now', 'localtime'))",
                                rusqlite::params![sid, clean_user, b_pwd, clean_faction],
                            );
                        } else {
                            let _ = conn.execute(
                                "UPDATE account SET password = ?3, playerFirstAndLastName = ?4, isSavePassword = 1, isUseSteamRelay = 1, lastLogon = datetime('now', 'localtime') WHERE serverId = ?1 AND username = ?2",
                                rusqlite::params![sid, clean_user, b_pwd, clean_faction],
                            );
                        }
                    }
                }
            }
        }

        // 2. Asegurar doVideoEffects=true en options.ini para fondo moderno de B42
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            let options_path = std::path::Path::new(&user_profile).join("Zomboid").join("options.ini");
            if let Ok(opts) = fs::read_to_string(&options_path) {
                if opts.contains("doVideoEffects=false") {
                    let updated_opts = opts.replace("doVideoEffects=false", "doVideoEffects=true");
                    let _ = fs::write(&options_path, updated_opts);
                }
            }
        }

        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // 3. Lanzar Project Zomboid directamente si el ejecutable existe en disco
        if let Some(pz_exe) = find_pz_executable() {
            if let Some(pz_dir) = pz_exe.parent() {
                let lua_client = pz_dir.join("media").join("lua").join("client");
                let _ = fs::create_dir_all(&lua_client);

                let bridge_path = lua_client.join("ApocaliptoConnectBridge.lua");
                let _ = fs::write(&bridge_path, build_bridge_lua_code(&clean_user, &clean_faction, &clean_ip, clean_port, "12345"));

                // NO pasar +connect: PZ lanza BootstrapConnectPopup que hace steamRequestServerDetails()
                // (consulta A2S). Si falla → "El servidor no ha respondido". En su lugar, nuestro
                // bridge lee el ticket efímero en OnMainMenuEnter y conecta directamente vía
                // ConnectToServer:connect(), bypaseando A2S por completo.
                let _ = fs::write(pz_dir.join("apocalipto_launch_ticket.ini"), &ticket_content);
                let spawn_res = std::process::Command::new(&pz_exe)
                    .current_dir(pz_dir)
                    .spawn();

                if spawn_res.is_ok() {
                    spawn_process_exit_cleaner();
                    return Ok(format!("Project Zomboid iniciado con Sandbox Activo: {:?}", pz_exe));
                }
            }
        }

        // Fallback 1: Si encontramos steam.exe, lanzar con -applaunch 108600
        if let Some(steam_dir) = get_steam_path_from_registry() {
            let pz_steam_dir = PathBuf::from(&steam_dir).join("steamapps").join("common").join("ProjectZomboid");
            let steam_client_lua = pz_steam_dir.join("media").join("lua").join("client");
            let _ = fs::create_dir_all(&steam_client_lua);

            let bridge_path = steam_client_lua.join("ApocaliptoConnectBridge.lua");
            let _ = fs::write(&bridge_path, build_bridge_lua_code(&clean_user, &clean_faction, &clean_ip, clean_port, "12345"));
            let _ = fs::write(pz_steam_dir.join("apocalipto_launch_ticket.ini"), &ticket_content);

            let steam_exe = PathBuf::from(&steam_dir).join("steam.exe");
            if steam_exe.exists() {
                // Lanzar PZ sin +connect (ver comentario arriba sobre A2S)
                let res = std::process::Command::new(&steam_exe)
                    .args(["-applaunch", "108600"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn();

                if res.is_ok() {
                    spawn_process_exit_cleaner();
                    return Ok("Project Zomboid iniciado via Steam -applaunch 108600".into());
                }
            }
        }

        // Fallback 2: Protocolo Steam URI (sin +connect, el bridge maneja la conexión)
        let steam_app_uri = "steam://rungameid/108600".to_string();
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", &steam_app_uri])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;

        spawn_process_exit_cleaner();

        Ok("Project Zomboid iniciado vía Steam App ID 108600".into())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok("Entorno no-Windows".into())
    }
}

#[tauri::command]
fn apply_update(binary_data_base64: String, expected_sha256: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // 1. Decodificar el binario del instalador recibido
        let bytes = BASE64
            .decode(binary_data_base64.trim())
            .map_err(|e| format!("Error al decodificar binario de actualización: {}", e))?;

        if bytes.is_empty() {
            return Err("El binario de actualización recibido está vacío".into());
        }

        // 2. Verificación criptográfica estricta SHA-256 (Anti-Tamper / Anti-Malware)
        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let computed_hash = format!("{:x}", hasher.finalize());

        let target_expected = expected_sha256.trim().to_lowercase();
        if !target_expected.is_empty() && computed_hash != target_expected {
            return Err(format!(
                "Firma de seguridad inválida: el hash SHA-256 calculado ({}) no coincide con el oficial ({})",
                computed_hash, target_expected
            ));
        }

        // 3. Escribir el ejecutable temporal en la carpeta %TEMP% de Windows
        let temp_dir = std::env::temp_dir();
        let temp_setup = temp_dir.join("ApocaliptoPZ-Setup-Update.exe");
        fs::write(&temp_setup, &bytes).map_err(|e| format!("Error al guardar instalador temporal: {}", e))?;

        // 4. Identificar el ejecutable actual y la ruta de instalación oficial en LOCALAPPDATA
        let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
        let target_installed_exe = if !local_app_data.is_empty() {
            std::path::PathBuf::from(&local_app_data).join("ApocaliptoPZ").join("ApocaliptoPZ.exe")
        } else {
            current_exe.clone()
        };

        // 5. Crear script batch desacoplado en %TEMP%:
        //    - ping 127.0.0.1 -n 3: espera 2 segundos exactos para que el launcher actual termine y libere el binario
        //    - start /wait "" "temp_setup" /S: instala silenciosamente la nueva versión
        //    - Relanza el launcher actualizado desde la ruta de instalación o la actual
        //    - (goto) 2>nul & del "%~f0": auto-elimina el script temporal
        let bat_path = temp_dir.join("apocalipto_run_update.bat");
        let bat_script = format!(
            "@echo off\r\nping 127.0.0.1 -n 3 >nul\r\nstart /wait \"\" \"{}\" /S\r\nif exist \"{}\" (\r\n  start \"\" \"{}\"\r\n) else (\r\n  start \"\" \"{}\"\r\n)\r\n(goto) 2>nul & del \"%~f0\"\r\n",
            temp_setup.to_string_lossy(),
            target_installed_exe.to_string_lossy(),
            target_installed_exe.to_string_lossy(),
            current_exe.to_string_lossy()
        );
        fs::write(&bat_path, bat_script).map_err(|e| format!("Error al crear script de actualización: {}", e))?;

        std::process::Command::new("cmd.exe")
            .args(["/C", &bat_path.to_string_lossy()])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("Error al ejecutar script de actualización: {}", e))?;

        // 6. Cerrar el proceso actual en un hilo de fondo tras confirmar éxito
        std::thread::spawn(|| {
            std::thread::sleep(std::time::Duration::from_millis(600));
            std::process::exit(0);
        });

        Ok("Actualización verificada e iniciada con éxito".into())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Auto-actualización silenciosa solo soportada en Windows".into())
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SavedCharacter {
    pub id: i64,
    pub server_id: i64,
    pub username: String,
    pub player_name: Option<String>,
    pub time_played: i64,
    pub last_logon: Option<String>,
}

#[tauri::command]
fn get_saved_characters() -> Result<Vec<SavedCharacter>, String> {
    #[cfg(target_os = "windows")]
    {
        let mut characters: Vec<SavedCharacter> = Vec::new();
        let mut seen_usernames = std::collections::HashSet::new();

        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            let db_dir = PathBuf::from(&user_profile).join("Zomboid").join("db");
            for db_name in &["ServerListSteam.db", "ServerList.db"] {
                let db_path = db_dir.join(db_name);
                if !db_path.exists() {
                    continue;
                }
                if let Ok(conn) = rusqlite::Connection::open(&db_path) {
                    let server_id: Option<i64> = conn
                        .query_row(
                            "SELECT id FROM server WHERE name = 'Apocalipto PZ'",
                            [],
                            |row| row.get(0),
                        )
                        .ok();

                    if let Some(sid) = server_id {
                        if let Ok(mut stmt) = conn.prepare(
                            "SELECT id, serverId, username, playerFirstAndLastName, timePlayed, lastLogon 
                             FROM account 
                             WHERE serverId = ?1 
                             ORDER BY id DESC"
                        ) {
                            let rows = stmt.query_map([sid], |row| {
                                Ok(SavedCharacter {
                                    id: row.get(0)?,
                                    server_id: row.get(1)?,
                                    username: row.get(2)?,
                                    player_name: row.get(3)?,
                                    time_played: row.get::<_, Option<i64>>(4)?.unwrap_or(0),
                                    last_logon: row.get(5)?,
                                })
                            });

                            if let Ok(char_iter) = rows {
                                for ch in char_iter.flatten() {
                                    if !seen_usernames.contains(&ch.username) {
                                        seen_usernames.insert(ch.username.clone());
                                        characters.push(ch);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        Ok(characters)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(Vec::new())
    }
}

#[tauri::command]
fn delete_saved_character(username: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let clean_user = username.trim().to_string();
        if clean_user.is_empty() {
            return Err("Nombre de usuario vacío".into());
        }

        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            let db_dir = PathBuf::from(&user_profile).join("Zomboid").join("db");
            for db_name in &["ServerListSteam.db", "ServerList.db"] {
                let db_path = db_dir.join(db_name);
                if db_path.exists() {
                    if let Ok(conn) = rusqlite::Connection::open(&db_path) {
                        let _ = conn.execute(
                            "DELETE FROM account 
                             WHERE username = ?1 
                             AND serverId IN (SELECT id FROM server WHERE name = 'Apocalipto PZ')",
                            rusqlite::params![clean_user],
                        );
                    }
                }
            }

            // También purgar de la base de datos del servidor local si existe
            let server_db = db_dir.join("ApocaliptoPZ.db");
            if server_db.exists() {
                if let Ok(conn) = rusqlite::Connection::open(&server_db) {
                    let _ = conn.execute(
                        "DELETE FROM whitelist WHERE username = ?1",
                        rusqlite::params![clean_user],
                    );
                }
            }

            // Y purgar del save de jugadores si existe
            let players_db = PathBuf::from(&user_profile).join("Zomboid").join("Saves").join("Multiplayer").join("ApocaliptoPZ").join("players.db");
            if players_db.exists() {
                if let Ok(conn) = rusqlite::Connection::open(&players_db) {
                    let _ = conn.execute(
                        "DELETE FROM networkPlayers WHERE username = ?1",
                        rusqlite::params![clean_user],
                    );
                }
            }
        }
        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(true)
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SteamUserIdentity {
    pub steam_id: String,
    pub friend_code: String,
    pub account_name: String,
    pub persona_name: String,
    pub is_detected: bool,
}

#[tauri::command]
fn get_steam_user_identity() -> Result<SteamUserIdentity, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut friend_code_str = String::new();
        let mut steam_id_64_str = String::new();
        let mut account_name_str = String::new();

        if let Ok(output) = std::process::Command::new("reg")
            .args(["query", r"HKCU\Software\Valve\Steam\ActiveProcess", "/v", "ActiveUser"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            if output.status.success() {
                let text = String::from_utf8_lossy(&output.stdout);
                for line in text.lines() {
                    if line.contains("ActiveUser") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 3 {
                            let hex_str = parts[2].trim_start_matches("0x");
                            if let Ok(account_id) = u64::from_str_radix(hex_str, 16) {
                                if account_id > 0 {
                                    friend_code_str = account_id.to_string();
                                    steam_id_64_str = (account_id + 76561197960265728).to_string();
                                }
                            }
                        }
                    }
                }
            }
        }

        if let Ok(output) = std::process::Command::new("reg")
            .args(["query", r"HKCU\Software\Valve\Steam", "/v", "AutoLoginUser"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            if output.status.success() {
                let text = String::from_utf8_lossy(&output.stdout);
                for line in text.lines() {
                    if line.contains("AutoLoginUser") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 3 {
                            account_name_str = parts[2..].join(" ");
                        }
                    }
                }
            }
        }

        let is_detected = !steam_id_64_str.is_empty();
        Ok(SteamUserIdentity {
            steam_id: if is_detected { steam_id_64_str } else { "76561198000000000".into() },
            friend_code: friend_code_str,
            account_name: account_name_str.clone(),
            persona_name: account_name_str,
            is_detected,
        })
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(SteamUserIdentity {
            steam_id: "76561198000000000".into(),
            friend_code: "".into(),
            account_name: "".into(),
            persona_name: "".into(),
            is_detected: false,
        })
    }
}

#[tauri::command]
fn is_game_running() -> bool {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let output = std::process::Command::new("tasklist")
            .args(["/FI", "IMAGENAME eq ProjectZomboid*", "/NH"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(out) = output {
            let text = String::from_utf8_lossy(&out.stdout);
            return text.contains("ProjectZomboid");
        }
    }
    false
}

#[tauri::command]
fn get_app_version() -> String {
    let pkg = env!("CARGO_PKG_VERSION");
    if pkg.is_empty() || pkg == "1.2.8" {
        "1.2.9".to_string()
    } else {
        pkg.to_string()
    }
}

fn main() {
    // Al abrir el Launcher: curar y sanear inmediatamente toda la instalación de PZ
    run_full_vanilla_sanitization();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            launch_steam_game,
            apply_update,
            get_saved_characters,
            delete_saved_character,
            get_steam_user_identity,
            is_game_running,
            get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
