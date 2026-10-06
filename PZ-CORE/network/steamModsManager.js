/**
 * ============================================================================
 * APOCALIPTO PZ - STEAM WORKSHOP MODS MANAGER
 * Permite a Bento OS gestionar los mods ACTIVOS EN EL ENJAMBRE (columna izquierda)
 * y explorar/buscar/instalar mods de STEAM WORKSHOP (columna derecha).
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { execFile } from 'node:child_process';

const POPULAR_CATALOG_IDS = [
  '2169435993', // Mod Options
  '2392709985', // Tsar's Common Library v.2.07
  '2544353492', // Has Been Read
  '2619072426', // Weapon Condition Indicator [41.60+]
  '2822286426', // RV Interior
  '2849247394', // Basements
  '2866258937', // Mini Health Panel
  '2982070344', // Inventory Tetris
  '3420581050', // TV & Radio ReInvented
  '3780682550', // Equipment UI [B42.20+]
  '3780683663', // Cye's Push Doors!
  '3579640010', // StarkTruffle Additions - Pry Open
  '2737665235', // Ladders!?
  '2754567348', // Noir's Attachments
  '2778576730', // Autotsar Motorclub
  '2815560151', // Share Annotations
  '2818577583', // Random Zombies
  '2954521171', // More Repair Recipes
  '3414679410', // Simple Wraps
  '3635591071', // Realistic Dashboard and Gauges
  '515555911'   // More Builds
];

export class SteamModsManager {
  constructor() {
    this.iniPath = path.join(os.homedir(), 'Zomboid', 'Server', 'ApocaliptoPZ.ini');
    this.serverWorkshopDir = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ProjectZomboid\\steamapps\\workshop\\content\\108600';
    this.clientWorkshopDir = 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\108600';
    this.steamcmdExe = 'C:\\Users\\The Frog\\steamcmd\\steamcmd.exe';
    this.steamcmdDownloads = 'C:\\Users\\The Frog\\steamcmd\\steamapps\\workshop\\content\\108600';
    
    // Cache de metadatos de Steam en memoria (TTL 10 minutos)
    this.cache = new Map();
    this.cacheTtlMs = 10 * 60 * 1000;
  }

  /**
   * Lee timestamps locales de los archivos ACF de Steam para comparar con versiones en la nube
   */
  _readLocalAcfTimestamps() {
    const acfPaths = [
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ProjectZomboid\\steamapps\\workshop\\appworkshop_108600.acf',
      'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\appworkshop_108600.acf'
    ];
    const map = {};
    for (const p of acfPaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          const regex = /"(\d+)"\s*\{\s*"size"\s*"(\d+)"\s*"timeupdated"\s*"(\d+)"/g;
          let m;
          while ((m = regex.exec(content)) !== null) {
            const wId = m[1];
            const timeUpdated = parseInt(m[3], 10);
            if (!map[wId] || timeUpdated > map[wId]) {
              map[wId] = timeUpdated;
            }
          }
        } catch {}
      }
    }
    return map;
  }

  /**
   * Actualiza el timestamp local en los archivos ACF tras una descarga exitosa
   */
  _updateLocalAcfTimestamp(wId) {
    const nowSec = Math.floor(Date.now() / 1000);
    const acfPaths = [
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ProjectZomboid\\steamapps\\workshop\\appworkshop_108600.acf',
      'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\appworkshop_108600.acf'
    ];
    for (const p of acfPaths) {
      if (fs.existsSync(p)) {
        try {
          let content = fs.readFileSync(p, 'utf8');
          content = content.replace(/"NeedsUpdate"\s*"1"/g, '"NeedsUpdate"\t\t"0"');
          const regex = new RegExp(`("${wId}"\\s*\\{[^}]*"timeupdated"\\s*")\\d+(")`);
          if (regex.test(content)) {
            content = content.replace(regex, `$1${nowSec}$2`);
            fs.writeFileSync(p, content, 'utf8');
          }
        } catch {}
      }
    }
  }

  /**
   * Consulta detalles de items publicados a la API pública de Steam
   */
  async fetchSteamWorkshopDetails(workshopIds) {
    if (!workshopIds || workshopIds.length === 0) return {};

    const now = Date.now();
    const missingIds = [];
    const results = {};

    for (const id of workshopIds) {
      const cached = this.cache.get(id);
      if (cached && (now - cached.timestamp < this.cacheTtlMs)) {
        results[id] = cached.data;
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length === 0) return results;

    const batchSize = 40;
    for (let i = 0; i < missingIds.length; i += batchSize) {
      const batch = missingIds.slice(i, i + batchSize);
      try {
        const params = new URLSearchParams();
        params.append('itemcount', batch.length.toString());
        batch.forEach((id, idx) => {
          params.append(`publishedfileids[${idx}]`, id);
        });

        const postData = params.toString();

        const steamData = await new Promise((resolve) => {
          const req = https.request({
            hostname: 'api.steampowered.com',
            path: '/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 8000
          }, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
              try {
                resolve(JSON.parse(raw));
              } catch (err) {
                resolve(null);
              }
            });
          });

          req.on('error', () => resolve(null));
          req.on('timeout', () => { req.destroy(); resolve(null); });
          req.write(postData);
          req.end();
        });

        if (steamData && steamData.response && steamData.response.publishedfiledetails) {
          for (const item of steamData.response.publishedfiledetails) {
            if (item.publishedfileid) {
              const formatted = {
                title: item.title || null,
                previewUrl: item.preview_url || null,
                fileSize: item.file_size ? parseInt(item.file_size, 10) : 0,
                timeUpdated: item.time_updated ? parseInt(item.time_updated, 10) : 0,
                subscriptions: item.subscriptions ? parseInt(item.subscriptions, 10) : 0,
                views: item.views ? parseInt(item.views, 10) : 0,
                tags: item.tags ? item.tags.map(t => t.tag) : [],
                description: item.description || ''
              };
              this.cache.set(item.publishedfileid, { timestamp: now, data: formatted });
              results[item.publishedfileid] = formatted;
            }
          }
        }
      } catch {}
    }

    return results;
  }

  /**
   * Lee mod.info local para extraer id, name y poster
   */
  _readLocalModInfo(workshopId) {
    const locations = [
      path.join(this.serverWorkshopDir, workshopId, 'mods'),
      path.join(this.clientWorkshopDir, workshopId, 'mods')
    ];

    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        try {
          const subdirs = fs.readdirSync(loc);
          for (const s of subdirs) {
            const infoPath = path.join(loc, s, 'mod.info');
            if (fs.existsSync(infoPath)) {
              const content = fs.readFileSync(infoPath, 'utf8');
              const idMatch = content.match(/^id\s*=\s*(.+)$/m);
              const nameMatch = content.match(/^name\s*=\s*(.+)$/m);
              const descMatch = content.match(/^description\s*=\s*(.+)$/m);
              const posterMatch = content.match(/^poster\s*=\s*(.+)$/m);

              return {
                modId: idMatch ? idMatch[1].trim() : s,
                name: nameMatch ? nameMatch[1].trim() : s,
                description: descMatch ? descMatch[1].trim() : '',
                poster: posterMatch ? posterMatch[1].trim() : null,
                folderPath: path.join(loc, s)
              };
            }
          }
        } catch {}
      }
    }

    return { modId: null, name: null, description: '', poster: null };
  }

  /**
   * Devuelve los mods estrictamente ACTIVOS EN EL ENJAMBRE (ApocaliptoPZ.ini)
   * y el CATÁLOGO DE STEAM WORKSHOP (disponibles para instalar).
   */
  async getModsList() {
    let iniContent = '';
    if (fs.existsSync(this.iniPath)) {
      iniContent = fs.readFileSync(this.iniPath, 'utf8');
    }

    const workshopMatch = iniContent.match(/^WorkshopItems\s*=\s*(.+)$/m);
    const modsMatch = iniContent.match(/^Mods\s*=\s*(.+)$/m);

    // Los mods del ENJAMBRE son ESTRICTAMENTE los configurados en ApocaliptoPZ.ini
    const enjambreWorkshopIds = workshopMatch
      ? workshopMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean)
      : [];
    const enjambreModIds = modsMatch
      ? modsMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean)
      : [];

    const enjambreWorkshopSet = new Set(enjambreWorkshopIds);
    const localTimestamps = this._readLocalAcfTimestamps();

    // Consultar Steam Web API para los del Enjambre y los del Catálogo
    const idsToFetch = Array.from(new Set([...enjambreWorkshopIds, ...POPULAR_CATALOG_IDS]));
    const steamDetails = await this.fetchSteamWorkshopDetails(idsToFetch);

    // 1. MODS EN EL ENJAMBRE (Columna Izquierda)
    const enjambreMods = [];

    for (let i = 0; i < enjambreWorkshopIds.length; i++) {
      const wId = enjambreWorkshopIds[i];
      const local = this._readLocalModInfo(wId);
      const steam = steamDetails[wId] || {};

      const modId = enjambreModIds[i] || local.modId || wId;
      const localTime = localTimestamps[wId] || 0;
      const hasUpdate = Boolean(steam.timeUpdated && localTime && steam.timeUpdated > (localTime + 300));

      enjambreMods.push({
        workshopId: wId,
        modId: modId,
        title: steam.title || local.name || `Mod #${wId}`,
        previewUrl: steam.previewUrl || null,
        fileSize: steam.fileSize || 0,
        timeUpdated: steam.timeUpdated || 0,
        localTimeUpdated: localTime,
        hasUpdate: hasUpdate,
        subscriptions: steam.subscriptions || 0,
        tags: steam.tags || [],
        description: steam.description || local.description || '',
        enabled: true,
        inEnjambre: true,
        workshopUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${wId}`
      });
    }

    // 2. CATÁLOGO STEAM WORKSHOP (Columna Derecha: disponibles para agregar)
    const catalog = [];
    for (const catId of POPULAR_CATALOG_IDS) {
      if (!enjambreWorkshopSet.has(catId)) {
        const local = this._readLocalModInfo(catId);
        const steam = steamDetails[catId] || {};
        catalog.push({
          workshopId: catId,
          modId: local.modId || catId,
          title: steam.title || local.name || `Workshop #${catId}`,
          previewUrl: steam.previewUrl || local.poster || null,
          fileSize: steam.fileSize || 0,
          timeUpdated: steam.timeUpdated || 0,
          subscriptions: steam.subscriptions || 0,
          tags: steam.tags || [],
          description: steam.description || local.description || '',
          inEnjambre: false,
          workshopUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${catId}`
        });
      }
    }

    return {
      success: true,
      enjambreCount: enjambreMods.length,
      updatesAvailableCount: enjambreMods.filter(m => m.hasUpdate).length,
      enjambreMods: enjambreMods,
      catalog: catalog
    };
  }

  /**
   * Agrega o remueve un mod de ApocaliptoPZ.ini (Enjambre)
   */
  toggleMod(workshopId, modId, enabled) {
    if (!fs.existsSync(this.iniPath)) {
      throw new Error('ApocaliptoPZ.ini no encontrado');
    }

    let content = fs.readFileSync(this.iniPath, 'utf8');

    const workshopMatch = content.match(/^WorkshopItems\s*=\s*(.*)$/m);
    const modsMatch = content.match(/^Mods\s*=\s*(.*)$/m);

    let currentWorkshops = workshopMatch
      ? workshopMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean)
      : [];
    let currentMods = modsMatch
      ? modsMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean)
      : [];

    const wStr = String(workshopId).trim();
    const mStr = String(modId || workshopId).trim();

    if (enabled) {
      if (!currentWorkshops.includes(wStr)) currentWorkshops.push(wStr);
      if (!currentMods.includes(mStr)) currentMods.push(mStr);
    } else {
      currentWorkshops = currentWorkshops.filter(id => id !== wStr);
      currentMods = currentMods.filter(id => id !== mStr);
    }

    const newWorkshopLine = `WorkshopItems=${currentWorkshops.join(';')}`;
    const newModsLine = `Mods=${currentMods.join(';')}`;

    content = content.replace(/^WorkshopItems\s*=.*$/m, newWorkshopLine);
    content = content.replace(/^Mods\s*=.*$/m, newModsLine);

    fs.writeFileSync(this.iniPath, content, 'utf8');

    return {
      success: true,
      workshopId: wStr,
      modId: mStr,
      enabled: Boolean(enabled),
      enjambreCount: currentWorkshops.length
    };
  }

  /**
   * Quita un mod del Enjambre
   */
  removeFromEnjambre(workshopId) {
    const local = this._readLocalModInfo(workshopId);
    return this.toggleMod(workshopId, local.modId || workshopId, false);
  }

  /**
   * Actualiza un mod específico descargando la última versión de Steam
   */
  async updateMod(workshopId) {
    if (!workshopId) throw new Error('workshopId requerido');
    const wId = String(workshopId).trim();
    if (!fs.existsSync(this.steamcmdExe)) {
      throw new Error('steamcmd no está instalado en ' + this.steamcmdExe);
    }

    console.log(`[STEAM-UPDATE] Actualizando mod ${wId} mediante steamcmd...`);

    await new Promise((resolve, reject) => {
      execFile(
        this.steamcmdExe,
        ['+login', 'anonymous', '+workshop_download_item', '108600', wId, '+quit'],
        { timeout: 180000 },
        (err, stdout, stderr) => {
          if (err) return reject(new Error(`Fallo de descarga: ${stderr || err.message}`));
          resolve(stdout);
        }
      );
    });

    const downloadedPath = path.join(this.steamcmdDownloads, wId);
    if (!fs.existsSync(downloadedPath)) {
      throw new Error(`La descarga no produjo la carpeta esperada en ${downloadedPath}`);
    }

    // Copiar a servidor y cliente
    const serverTarget = path.join(this.serverWorkshopDir, wId);
    if (fs.existsSync(serverTarget)) fs.rmSync(serverTarget, { recursive: true, force: true });
    fs.cpSync(downloadedPath, serverTarget, { recursive: true });

    const clientTarget = path.join(this.clientWorkshopDir, wId);
    if (fs.existsSync(clientTarget)) fs.rmSync(clientTarget, { recursive: true, force: true });
    fs.cpSync(downloadedPath, clientTarget, { recursive: true });

    // Invalidar cache de Steam y actualizar timestamp ACF
    this.cache.delete(wId);
    this._updateLocalAcfTimestamp(wId);

    console.log(`[STEAM-UPDATE] Mod ${wId} sincronizado con éxito.`);
    return {
      success: true,
      workshopId: wId,
      message: `Mod #${wId} actualizado a la versión más reciente de Steam Workshop.`
    };
  }

  /**
   * Instala un mod desde Steam Workshop y lo agrega al Enjambre
   */
  async installModFromWorkshop(input) {
    if (!input) throw new Error('ID o enlace de Workshop requerido');
    
    const match = String(input).match(/\d+/);
    if (!match) throw new Error('No se detectó un ID numérico de Workshop válido');
    
    const workshopId = match[0];

    if (!fs.existsSync(this.steamcmdExe)) {
      throw new Error('steamcmd no está instalado en ' + this.steamcmdExe);
    }

    // 1. Ejecutar steamcmd para descargar el item
    await new Promise((resolve, reject) => {
      execFile(
        this.steamcmdExe,
        ['+login', 'anonymous', '+workshop_download_item', '108600', workshopId, '+quit'],
        { timeout: 180000 },
        (err, stdout, stderr) => {
          if (err) return reject(new Error(`Fallo de descarga: ${stderr || err.message}`));
          resolve(stdout);
        }
      );
    });

    const downloadedPath = path.join(this.steamcmdDownloads, workshopId);
    if (!fs.existsSync(downloadedPath)) {
      throw new Error(`La descarga no produjo la carpeta en ${downloadedPath}`);
    }

    // 2. Copiar a la carpeta del servidor
    const serverTarget = path.join(this.serverWorkshopDir, workshopId);
    if (fs.existsSync(serverTarget)) fs.rmSync(serverTarget, { recursive: true, force: true });
    fs.cpSync(downloadedPath, serverTarget, { recursive: true });

    // 3. Copiar a la carpeta del cliente
    const clientTarget = path.join(this.clientWorkshopDir, workshopId);
    if (fs.existsSync(clientTarget)) fs.rmSync(clientTarget, { recursive: true, force: true });
    fs.cpSync(downloadedPath, clientTarget, { recursive: true });

    // 4. Identificar modId
    const local = this._readLocalModInfo(workshopId);
    const modId = local.modId || workshopId;

    // 5. Activar en ApocaliptoPZ.ini (Enjambre)
    this.toggleMod(workshopId, modId, true);
    this._updateLocalAcfTimestamp(workshopId);

    // 6. Consultar Steam API para obtener datos inmediatos
    const steamDetails = await this.fetchSteamWorkshopDetails([workshopId]);
    const details = steamDetails[workshopId] || {};

    return {
      success: true,
      workshopId,
      modId,
      title: details.title || local.name || `Mod #${workshopId}`,
      previewUrl: details.previewUrl || null,
      message: `Mod "${details.title || modId}" agregado al Enjambre con éxito.`
    };
  }
}

export const steamModsManager = new SteamModsManager();
export default steamModsManager;
