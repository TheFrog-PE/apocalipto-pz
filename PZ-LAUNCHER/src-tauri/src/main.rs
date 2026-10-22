// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use sha2::{Digest, Sha256};

#[tauri::command]
fn launch_steam_game(connect_address: String, username: String, faction: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let (raw_host, clean_port) = if let Some((ip, port)) = connect_address.split_once(':') {
            (ip.trim().to_string(), port.trim().parse::<u16>().unwrap_or(16261))
        } else {
            (connect_address.trim().to_string(), 16261)
        };

        // Si el host es el dominio del túnel Playit, resolvemos o usamos su IP directa para evitar fallos de DNS en clientes
        let clean_ip = if raw_host == "rails-switching.tun.ply.gg" {
            "147.185.221.215".to_string()
        } else if raw_host.is_empty() {
            "127.0.0.1".to_string()
        } else {
            raw_host
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

        let _ini_content = format!(
            "ip={}\nport={}\nuser={}\npassword=12345\nfaction={}\nspawnRegion={}\nserverName=Apocalipto PZ\n",
            clean_ip, clean_port, clean_user, clean_faction, clean_faction
        );

        // 1. Inyectar configuración de sesión en %USERPROFILE%/Zomboid del jugador
        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            let zomboid_dir = PathBuf::from(&user_profile).join("Zomboid");
            let lua_dir = zomboid_dir.join("Lua");
            let _ = fs::create_dir_all(&lua_dir);

            // Limpiar archivos residuales antiguos para que NUNCA interfieran con partidas en solitario
            let _ = fs::remove_file(zomboid_dir.join("apocalipto_session.ini"));
            let _ = fs::remove_file(lua_dir.join("apocalipto_session.ini"));
            let _ = fs::remove_file(zomboid_dir.join("apocalipto_connect.ini"));
            let _ = fs::remove_file(lua_dir.join("apocalipto_connect.ini"));

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

                        if acc_exists.is_err() {
                            let _ = conn.execute(
                                "INSERT INTO account (serverId, username, password, isSavePassword, isUseSteamRelay, authType)
                                 VALUES (?1, ?2, '12345', 1, 0, 1)",
                                rusqlite::params![sid, clean_user],
                            );
                        } else {
                            let _ = conn.execute(
                                "UPDATE account SET password = '12345', isSavePassword = 1, isUseSteamRelay = 0 WHERE serverId = ?1 AND username = ?2",
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
                let _ = fs::remove_file(pz_dir.join("apocalipto_session.ini"));
                let _ = fs::remove_file(pz_dir.join("apocalipto_connect.ini"));

                // Auto-reparar MainScreen.lua: Restaurar siempre limpio a vanilla para NUNCA interferir con Singleplayer
                let main_screen_path = pz_dir.join("media").join("lua").join("client").join("OptionScreens").join("MainScreen.lua");
                if let Ok(content) = fs::read_to_string(&main_screen_path) {
                    if content.contains("APOCALIPTO PZ") {
                        let hook_start = "        -- [APOCALIPTO PZ]";
                        if let (Some(hs), Some(he)) = (content.find(hook_start), content.find("        if okTicket and ticketUsed then")) {
                            let end_pos = he + "        if okTicket and ticketUsed then\n            return\n        end\n".len();
                            let clean_content = format!("{}{}", &content[..hs], &content[end_pos..]);
                            let _ = fs::write(&main_screen_path, clean_content);
                        }
                    }
                }

                // Inyectar y auto-reparar el hook de bypass de spawn por facción en MapSpawnSelect.lua
                let map_spawn_path = pz_dir.join("media").join("lua").join("client").join("OptionScreens").join("MapSpawnSelect.lua");
                if let Ok(spawn_content) = fs::read_to_string(&map_spawn_path) {
                    let cleaned_content = spawn_content
                        .replace("function __UNUSED_ORIGINAL_hasChoices()", "-- [REPAIRED] function __UNUSED_ORIGINAL_hasChoices()")
                        .replace("function __UNUSED_ORIGINAL_hasChoices", "-- [REPAIRED] function __UNUSED_ORIGINAL_hasChoices");

                    let base_content = if cleaned_content.contains("ApocaliptoSpawnInjected") {
                        if let Some(idx) = cleaned_content.find("-- [APOCALIPTO PZ] BYPASS DE SPAWN FORZADO") {
                            cleaned_content[..idx].trim_end().to_string()
                        } else {
                            cleaned_content
                        }
                    } else {
                        cleaned_content
                    };

                    let spawn_hook = r##"

-- [APOCALIPTO PZ] BYPASS DE SPAWN FORZADO POR FACCION (SOLO EN APOCALIPTO PZ)
if not _G.ApocaliptoSpawnInjected then
    _G.ApocaliptoSpawnInjected = true

    local function getApocaliptoFaction()
        if not isClient or not isClient() then return nil end
        if _G.ApocaliptoSession and _G.ApocaliptoSession.faction and _G.ApocaliptoSession.faction ~= "" then
            return _G.ApocaliptoSession.faction
        end
        local files = { "apocalipto_session.ini", "apocalipto_connect.ini" }
        for _, fname in ipairs(files) do
            local reader = getFileReader(fname, false)
            if reader then
                local faction = nil
                while true do
                    local line = reader:readLine()
                    if line == nil then break end
                    line = string.trim(line)
                    local sep = string.find(line, "=")
                    if sep then
                        local k = string.trim(string.sub(line, 1, sep - 1))
                        local v = string.trim(string.sub(line, sep + 1))
                        if k == "faction" and v ~= "" then
                            faction = v
                            break
                        end
                    end
                end
                reader:close()
                if faction and faction ~= "" then
                    if not _G.ApocaliptoSession then _G.ApocaliptoSession = {} end
                    _G.ApocaliptoSession.faction = faction
                    _G.ApocaliptoSession.serverName = "Apocalipto PZ"
                    return faction
                end
            end
        end
        return nil
    end

    local old_hasChoices = MapSpawnSelect.hasChoices
    MapSpawnSelect.hasChoices = function(self)
        local faction = getApocaliptoFaction()
        if faction then
            return false
        end
        if old_hasChoices then return old_hasChoices(self) end
        local regions = self:getSpawnRegions()
        return regions and #regions > 1
    end

    local old_useDefault = MapSpawnSelect.useDefaultSpawnRegion
    MapSpawnSelect.useDefaultSpawnRegion = function(self)
        local faction = getApocaliptoFaction()
        if faction then
            self.selectedRegion = nil
            local regions = self:getSpawnRegions()
            if regions and #regions > 0 then
                local fTag = string.upper(faction)
                for _, r in ipairs(regions) do
                    if string.find(string.upper(r.name), fTag) then
                        self.selectedRegion = r
                        setSpawnRegion(r.name)
                        getCore():setSelectedMap(tostring(r.name))
                        print("[APOCALIPTO PZ] Spawn auto-asignado a territorio de faccion: " .. tostring(r.name))
                        return self.selectedRegion
                    end
                end
                self.selectedRegion = regions[1]
                setSpawnRegion(self.selectedRegion.name)
                getCore():setSelectedMap(tostring(self.selectedRegion.name))
                return self.selectedRegion
            end
        end

        if old_useDefault then return old_useDefault(self) end
        local regions = self:getSpawnRegions()
        if regions and #regions > 0 then
            self.selectedRegion = regions[1]
            setSpawnRegion(self.selectedRegion.name)
            getCore():setSelectedMap(tostring(self.selectedRegion.name))
            return self.selectedRegion
        end
    end

    local base_setVisible = MapSpawnSelect.setVisible or ISPanelJoypad.setVisible or ISUIElement.setVisible
    MapSpawnSelect.setVisible = function(self, visible, joypadData)
        if visible then
            local faction = getApocaliptoFaction()
            if faction then
                self:useDefaultSpawnRegion()
                if base_setVisible then base_setVisible(self, false, joypadData) end
                if MainScreen.instance and MainScreen.instance.charCreationProfession then
                    MainScreen.instance:setVisible(true)
                    MainScreen.instance.bottomPanel:setVisible(false)
                    MainScreen.instance.charCreationProfession.previousScreen = nil
                    MainScreen.instance.charCreationProfession:setVisible(true, joypadData)
                end
                return
            end
        end
        if base_setVisible then base_setVisible(self, visible, joypadData) end
    end
end
"##;
                    let final_content = format!("{}\n{}", base_content, spawn_hook);
                    if final_content != spawn_content {
                        let _ = fs::write(&map_spawn_path, final_content);
                    }
                }

                // Auto-reparar ServerConnectPopup.lua: Limpiar cualquier hook residual para asegurar estabilidad total
                let server_connect_path = pz_dir.join("media").join("lua").join("client").join("OptionScreens").join("ServerConnectPopup.lua");
                if let Ok(popup_content) = fs::read_to_string(&server_connect_path) {
                    if popup_content.contains("-- [APOCALIPTO PZ]") {
                        if let Some(idx) = popup_content.find("-- [APOCALIPTO PZ]") {
                            let clean_popup = popup_content[..idx].trim_end().to_string() + "\n";
                            let _ = fs::write(&server_connect_path, clean_popup);
                        }
                    }
                }

                let faction_sync_path = pz_dir.join("media").join("lua").join("client").join("ApocaliptoFactionAutoSync.lua");
                let lua_sync_content = r##"-- [APOCALIPTO PZ] Sincronización Automática de Facción y Visibilidad en Mapa / Minimapa
local factionColors = {
    DOE = { r = 0.20, g = 0.50, b = 1.00 },
    MOK = { r = 0.95, g = 0.20, b = 0.20 },
    KTO = { r = 1.00, g = 0.70, b = 0.10 },
    RIV = { r = 0.10, g = 0.85, b = 0.45 },
}

local function syncApocaliptoFaction(player)
    if not isClient or not isClient() then return end
    if not player then player = getPlayer() end
    if not player then return end

    local uName = player:getUsername()
    local session = _G.ApocaliptoSession

    if not session or not session.faction then
        pcall(function()
            local reader = getFileReader("apocalipto_session.ini", false)
            if reader then
                local params = {}
                while true do
                    local line = reader:readLine()
                    if line == nil then break end
                    line = string.trim(line)
                    if line ~= "" and string.sub(line, 1, 1) ~= "#" then
                        local sep = string.find(line, "=")
                        if sep then
                            local k = string.trim(string.sub(line, 1, sep - 1))
                            local v = string.trim(string.sub(line, sep + 1))
                            params[k] = v
                        end
                    end
                end
                reader:close()
                session = params
                _G.ApocaliptoSession = params
            end
        end)
    end

    if not session or not session.faction then return end

    local targetFaction = string.upper(session.faction)
    if targetFaction == "" then return end

    local fact = Faction.getPlayerFaction(player)
    if not fact then
        fact = Faction.getFaction(targetFaction)
        if not fact then
            pcall(function()
                if sendFactionCreate then
                    sendFactionCreate(targetFaction, uName)
                end
            end)
            pcall(function()
                fact = Faction.new(targetFaction, uName)
                if fact then
                    fact:setTag(targetFaction)
                    local col = factionColors[targetFaction]
                    if col and ColorInfo then
                        fact:setTagColor(ColorInfo.new(col.r, col.g, col.b, 1))
                    end
                    local factions = Faction.getFactions()
                    if factions ~= nil then
                        factions:add(fact)
                    end
                end
            end)
        else
            if not fact:isOwner(uName) and not fact:isMember(uName) then
                pcall(function()
                    fact:addPlayer(uName)
                    local col = factionColors[targetFaction]
                    if col and ColorInfo then
                        fact:setTagColor(ColorInfo.new(col.r, col.g, col.b, 1))
                    end
                end)
            end
        end
    else
        pcall(function()
            if not fact:getTag() or fact:getTag() == "" then
                fact:setTag(fact:getName())
            end
            local col = factionColors[fact:getName()]
            if col and ColorInfo then
                fact:setTagColor(ColorInfo.new(col.r, col.g, col.b, 1))
            end
        end)
    end

    pcall(function()
        if ISWorldMap_instance then
            ISWorldMap_instance.showRemotePlayers = true
            ISWorldMap_instance.showPlayerNames = true
            if ISWorldMap_instance.mapAPI then
                ISWorldMap_instance.mapAPI:setBoolean("RemotePlayers", true)
                ISWorldMap_instance.mapAPI:setBoolean("PlayerNames", true)
            end
        end
    end)

    pcall(function()
        if ISMiniMap and ISMiniMap.mapAPI then
            ISMiniMap.mapAPI:setBoolean("RemotePlayers", true)
            ISMiniMap.mapAPI:setBoolean("PlayerNames", true)
            ISMiniMap.mapAPI:setBoolean("MiniMapSymbols", true)
        end
    end)
end

Events.OnGameStart.Add(syncApocaliptoFaction)
Events.OnPlayerSpawn.Add(syncApocaliptoFaction)
Events.OnCreatePlayer.Add(function(id)
    local p = getSpecificPlayer(id)
    if p then syncApocaliptoFaction(p) end
end)
Events.EveryOneMinute.Add(function()
    local p = getPlayer()
    if p then syncApocaliptoFaction(p) end
end)
"##;
                let _ = fs::write(&faction_sync_path, lua_sync_content);

                // Asegurar doVideoEffects=true en options.ini para que se muestre el fondo moderno de B42
                if let Ok(user_profile) = std::env::var("USERPROFILE") {
                    let options_path = std::path::Path::new(&user_profile).join("Zomboid").join("options.ini");
                    if let Ok(opts) = fs::read_to_string(&options_path) {
                        if opts.contains("doVideoEffects=false") {
                            let updated_opts = opts.replace("doVideoEffects=false", "doVideoEffects=true");
                            let _ = fs::write(&options_path, updated_opts);
                        }
                    }
                }

                let connect_arg = format!("{}:{}", clean_ip, clean_port);
                let spawn_res = std::process::Command::new(&pz_exe)
                    .current_dir(pz_dir)
                    .args(["-connect", &connect_arg, "-password", "12345"])
                    .spawn();

                if spawn_res.is_ok() {
                    return Ok(format!("Project Zomboid iniciado directamente: {:?}", pz_exe));
                }
            }
        }

        // Fallback 1: Si encontramos steam.exe, lanzar con -applaunch 108600 (evita el modal de opciones de inicio de Steam)
        if let Some(steam_dir) = get_steam_path_from_registry() {
            let steam_exe = PathBuf::from(steam_dir).join("steam.exe");
            if steam_exe.exists() {
                let connect_arg = format!("{}:{}", clean_ip, clean_port);
                let res = std::process::Command::new(&steam_exe)
                    .args(["-applaunch", "108600", "-connect", &connect_arg, "-password", "12345"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn();
                if res.is_ok() {
                    return Ok("Project Zomboid iniciado vía Steam -applaunch 108600".into());
                }
            }
        }

        // Fallback 2: Protocolo Steam URI
        let steam_app_uri = format!("steam://run/108600//-connect%20{}:{}%20-password%2012345", clean_ip, clean_port);
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", &steam_app_uri])
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
            // Check ServerListSteam.db first (primary for Steam PZ), then ServerList.db
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
        }
        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(true)
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_steam_game, apply_update, get_saved_characters, delete_saved_character])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
