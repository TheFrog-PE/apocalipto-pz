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
                // Inyectar el hook de salto de menú y conexión directa a creación de personaje en MainScreen.lua
                let main_screen_path = pz_dir.join("media").join("lua").join("client").join("OptionScreens").join("MainScreen.lua");
                if let Ok(content) = fs::read_to_string(&main_screen_path) {
                    // Firma del hook viejo (usa ConnectToServer.instance:connect — bug pantalla congelada)
                    let old_hook_sig = "ConnectToServer.instance:connect(";
                    // Firma del hook nuevo (usa bootstrapConnectPopup:connect — correcto)
                    let new_hook_sig = "bootstrapConnectPopup:connect(ip, port, pwd)";

                    let needs_inject = !content.contains("apocalipto_connect.ini");
                    let needs_upgrade = content.contains("apocalipto_connect.ini")
                        && content.contains(old_hook_sig)
                        && !content.contains(new_hook_sig);

                    if needs_inject || needs_upgrade {
                        let working_content = if needs_upgrade {
                            // Para upgrade: leer el archivo vanilla limpio y reparchar
                            // El archivo ya está parchado — necesitamos eliminar el hook viejo primero.
                            // Encontramos el bloque del hook por sus marcadores y lo eliminamos.
                            let hook_start = "        -- [APOCALIPTO PZ] TICKET DE SESION";
                            let hook_end = "        if okTicket and ticketUsed then\n            return\n        end\n";
                            if let (Some(hs), Some(he)) = (content.find(hook_start), content.find("        if okTicket and ticketUsed then")) {
                                let end_pos = he + "        if okTicket and ticketUsed then\n            return\n        end\n".len();
                                format!("{}{}", &content[..hs], &content[end_pos..])
                            } else {
                                content.clone()
                            }
                        } else {
                            content.clone()
                        };

                        let target_anchor = "local argsServer = getServerAddressFromArgs();";
                        if let Some(pos) = working_content.find(target_anchor) {
                            let lua_hook = r##"
        -- [APOCALIPTO PZ] TICKET DE SESION AUTO-JOIN DIRECTO & PREVENCIÓN DE CONGELAMIENTO
        local okTicket, ticketUsed = pcall(function()
            local reader = getFileReader("apocalipto_connect.ini", false)
            if not reader then return false end
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
            _G.ApocaliptoSession = params

            if params.ip and params.port and params.user and string.len(params.user) > 0 then
                -- Limpiar el ticket (overwrite=true trunca el archivo) para que el próximo inicio de PZ no lo reutilice
                local writer = getFileWriter("apocalipto_connect.ini", true, false)
                if writer then writer:close() end

                local ip = params.ip
                local port = tostring(params.port)
                local pwd = params.password or "12345"

                if MainScreen.instance.animPopup ~= nil then
                    MainScreen.instance.animPopup:removeFromUIManager()
                end
                MainScreen.instance.bottomPanel:setVisible(false)

                -- bootstrapConnectPopup es el método nativo de PZ para conectar desde la pantalla principal
                -- Mismo mecanismo que usa getServerAddressFromArgs() en PZ vanilla — garantiza UI correcta
                MainScreen.instance.bootstrapConnectPopup:connect(ip, port, pwd)
                return true
            end
            return false
        end)
        if okTicket and ticketUsed then
            return
        end
"##;
                            let patched = format!("{}{}{}", &working_content[..pos], lua_hook, &working_content[pos..]);
                            let _ = fs::write(&main_screen_path, patched);
                        }
                    }
                }

                // Inyectar el hook de bypass de spawn por facción en MapSpawnSelect.lua
                let map_spawn_path = pz_dir.join("media").join("lua").join("client").join("OptionScreens").join("MapSpawnSelect.lua");
                if let Ok(spawn_content) = fs::read_to_string(&map_spawn_path) {
                    if !spawn_content.contains("ApocaliptoSession") && !spawn_content.contains("apocalipto_session.ini") {
                        let target_spawn = "function MapSpawnSelect:hasChoices()";
                        if let Some(pos) = spawn_content.find(target_spawn) {
                            let spawn_hook = r##"function MapSpawnSelect:hasChoices()
	-- [APOCALIPTO PZ] Si hay una facción configurada en la sesión, forzar uso directo de su spawn sin selector manual
	local targetFaction = (ApocaliptoSession and ApocaliptoSession.faction) or nil
	if not targetFaction then
		local sReader = getFileReader("apocalipto_session.ini", false)
		if sReader then
			while true do
				local sLine = sReader:readLine()
				if sLine == nil then break end
				sLine = string.trim(sLine)
				local sSep = string.find(sLine, "=")
				if sSep then
					local sk = string.trim(string.sub(sLine, 1, sSep - 1))
					local sv = string.trim(string.sub(sLine, sSep + 1))
					if sk == "faction" then targetFaction = sv break end
				end
			end
			sReader:close()
		end
	end
	if targetFaction and targetFaction ~= "" then
		return false
	end

	local regions = self:getSpawnRegions()
	return regions and #regions > 1
end

function MapSpawnSelect:useDefaultSpawnRegion()
	self.selectedRegion = nil
	local regions = self:getSpawnRegions()
	if not regions or #regions == 0 then return end

	local targetFaction = (ApocaliptoSession and ApocaliptoSession.faction) or nil
	if not targetFaction then
		local sReader = getFileReader("apocalipto_session.ini", false)
		if sReader then
			while true do
				local sLine = sReader:readLine()
				if sLine == nil then break end
				sLine = string.trim(sLine)
				local sSep = string.find(sLine, "=")
				if sSep then
					local sk = string.trim(string.sub(sLine, 1, sSep - 1))
					local sv = string.trim(string.sub(sLine, sSep + 1))
					if sk == "faction" then targetFaction = sv break end
				end
			end
			sReader:close()
		end
	end

	if targetFaction and targetFaction ~= "" then
		local fTag = string.upper(targetFaction)
		for _, r in ipairs(regions) do
			if string.find(string.upper(r.name), fTag) then
				self.selectedRegion = r
				setSpawnRegion(r.name)
				getCore():setSelectedMap(tostring(r.name))
				print("[APOCALIPTO PZ] Spawn auto-asignado a territorio de faccion: " .. tostring(r.name))
				return self.selectedRegion
			end
		end
	end

	self.selectedRegion = regions[1]
	setSpawnRegion(self.selectedRegion.name)
	getCore():setSelectedMap(tostring(self.selectedRegion.name))
	return self.selectedRegion
end

function __UNUSED_ORIGINAL_hasChoices()
"##;
                            let patched = format!("{}{}{}", &spawn_content[..pos], spawn_hook, &spawn_content[pos..]);
                            let _ = fs::write(&map_spawn_path, patched);
                        }
                    }
                }

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

        // 4. Identificar el ejecutable actual para relanzarlo tras la instalación
        let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;

        // 5. Lanzar proceso desacoplado de Windows:
        //    - timeout /t 2 /nobreak: espera 2 segundos para liberar los archivos del launcher actual
        //    - "temp_setup" /S: instala silenciosamente la nueva versión sobreescribiendo archivos
        //    - start "" "current_exe": reabre el launcher actualizado automáticamente
        let cmd_script = format!(
            "timeout /t 2 /nobreak >nul & \"{}\" /S & start \"\" \"{}\"",
            temp_setup.display(),
            current_exe.display()
        );

        std::process::Command::new("cmd")
            .args(["/C", &cmd_script])
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_steam_game, apply_update])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
