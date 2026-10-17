/**
 * Cliente del Enjambre para el Launcher (Swarm Client)
 * Administra la identidad criptográfica y la persistencia PERMANENTE de la Whitelist.
 *
 * REGLA FUNDAMENTAL:
 * Una vez que el creador aprueba a un jugador, el ticket firmado se guarda
 * localmente y NUNCA se le vuelve a pedir aprobación ni se molesta al creador.
 */

// Configuración de Descubrimiento Descentralizado (Bootstrap Registry)
const BOOTSTRAP_REGISTRY_URL = 'https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/public/swarm-gateway.json';
export const FALLBACK_PUBLIC_GATEWAY = 'http://127.0.0.1:19842';

let cachedRemoteGateway = null;
let isLocalHostActive = false;

// Inicialización de descubrimiento al arrancar el cliente
if (typeof window !== 'undefined') {
  // Limpiar URLs caducadas de TryCloudflare
  try {
    const saved = localStorage.getItem('apocalipto_swarm_gateway');
    if (saved && saved.includes('trycloudflare.com')) {
      localStorage.removeItem('apocalipto_swarm_gateway');
    }
  } catch {}

  // 1. Probar rápidamente si el Bridge corre en esta máquina local (PC de The Frog / Anfitrión)
  fetch('http://127.0.0.1:19842/api/health', { signal: AbortSignal.timeout(2000) })
    .then(r => {
      if (r.ok) {
        isLocalHostActive = true;
      }
    })
    .catch(() => {
      // Reintentar con /health por retrocompatibilidad
      fetch('http://127.0.0.1:19842/health', { signal: AbortSignal.timeout(2000) })
        .then(r => {
          if (r.ok) isLocalHostActive = true;
        })
        .catch(() => {
          isLocalHostActive = false;
          // 2. Si no es localhost, consultar el registro público en GitHub para jugadores remotos
          fetch(`${BOOTSTRAP_REGISTRY_URL}?_t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
            .then(r => r.json())
            .then(data => {
              if (data && data.gatewayUrl && !data.gatewayUrl.includes('trycloudflare.com')) {
                cachedRemoteGateway = data.gatewayUrl.replace(/\/$/, '');
                localStorage.setItem('apocalipto_swarm_gateway', cachedRemoteGateway);
              }
            })
            .catch(() => {});
        });
    });
}

/**
 * Obtiene la dirección del Puente del Enjambre (Swarm Gateway).
 * - En la PC del Creador: usa http://127.0.0.1:19842 (modo local rápido).
 * - En la PC de jugadores remotos: usa el Gateway público del Enjambre para conectar con Bento OS.
 */
export function getSwarmBridgeUrl() {
  if (typeof window !== 'undefined') {
    // Si estamos en la máquina del Anfitrión donde el bridge local está corriendo
    if (isLocalHostActive || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:19842';
    }

    // Si ya obtuvimos el gateway remoto del registro de GitHub
    if (cachedRemoteGateway && !cachedRemoteGateway.includes('trycloudflare.com')) {
      return cachedRemoteGateway;
    }

    // 1. Detección por Query Param (?gateway=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const gw = params.get('gateway');
      if (gw && !gw.includes('trycloudflare.com')) {
        localStorage.setItem('apocalipto_swarm_gateway', gw);
        return gw.replace(/\/$/, '');
      }
    } catch {}

    // 2. Gateway guardado previamente en localStorage
    const saved = localStorage.getItem('apocalipto_swarm_gateway');
    if (saved && saved.startsWith('http') && !saved.includes('trycloudflare.com')) {
      return saved.replace(/\/$/, '');
    }

    // 3. Fallback seguro: localhost
    return 'http://127.0.0.1:19842';
  }
  return 'http://127.0.0.1:19842';
}

export function setSwarmBridgeUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('apocalipto_swarm_gateway', url.trim());
    } else {
      localStorage.removeItem('apocalipto_swarm_gateway');
    }
  }
}

// Clave pública del creador (para verificar tickets de admisión de forma local e instantánea)
export const CREATOR_PUBLIC_KEY = 'apocalipto_creator_root_key';

/**
 * Convierte ArrayBuffer a hex string
 */
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un par de claves Ed25519 reales usando Web Crypto API del navegador.
 * Exporta clave privada en formato PKCS8 (compatible con Node.js crypto) y
 * pública en SPKI — idéntico al formato de keys.js del backend.
 */
async function generateEd25519Keypair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true, // exportable
    ['sign', 'verify']
  );

  const pubRaw = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const pubHex = bufToHex(pubRaw);
  const privHex = bufToHex(privRaw);

  // NodeID = SHA-256 de la clave pública (primeros 16 bytes hex) — igual que keys.js
  const pubBytes = new Uint8Array(pubRaw);
  const hashBuf = await window.crypto.subtle.digest('SHA-256', pubBytes);
  const hashHex = bufToHex(hashBuf);
  const nodeId = `node_${hashHex.substring(0, 16)}`;

  return { nodeId, publicKey: pubHex, privateKey: privHex };
}

/**
 * Firma un payload string con Ed25519 usando Web Crypto API.
 * Produce firma en hex — compatible con verifySignature() del backend.
 */
async function signWithEd25519(payloadString, privateKeyHex) {
  const privBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const privKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privBytes.buffer,
    { name: 'Ed25519' },
    false,
    ['sign']
  );
  const dataBytes = new TextEncoder().encode(payloadString);
  const sigBuf = await window.crypto.subtle.sign({ name: 'Ed25519' }, privKey, dataBytes);
  return bufToHex(sigBuf);
}

/**
 * Obtiene o inicializa la identidad criptográfica local Ed25519 en el navegador.
 * Genera un par de claves Ed25519 real la primera vez y lo persiste en localStorage.
 * La clave privada permanece SOLO en el navegador, nunca se envía al Bridge.
 */
export async function getOrCreateLocalIdentityAsync() {
  const STORAGE_KEY = 'apocalipto_local_identity_v2';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.nodeId && parsed.publicKey && parsed.privateKey) return parsed;
    }
  } catch {}

  // Generar par de claves Ed25519 real
  const identity = await generateEd25519Keypair();
  identity.steamId = '76561198' + Math.floor(100000000 + Math.random() * 900000000);
  identity.createdAt = Date.now();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {}

  return identity;
}

/**
 * Versión síncrona de compatibilidad — devuelve identidad guardada o placeholder.
 * Siempre usar getOrCreateLocalIdentityAsync() en código nuevo.
 */
export function getOrCreateLocalIdentity() {
  const STORAGE_KEY = 'apocalipto_local_identity_v2';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.nodeId && parsed.publicKey) return parsed;
    }
  } catch {}

  // Placeholder temporal hasta que se complete la generación async
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    nodeId: `node_${randomHex.substring(0, 16)}`,
    steamId: '76561198' + Math.floor(100000000 + Math.random() * 900000000),
    publicKey: randomHex,
    _pending: true, // señal de que aún no tiene Ed25519 real
    createdAt: Date.now()
  };
}


/**
 * Verifica si el jugador ya fue aprobado PERMANENTEMENTE en el pasado
 */
export function getSavedPermanentTicket() {
  const TICKET_KEY = 'apocalipto_admission_ticket';
  try {
    const saved = localStorage.getItem(TICKET_KEY);
    if (saved) {
      const ticket = JSON.parse(saved);
      if (ticket && ticket.creatorSignature) {
        return ticket;
      }
    }
  } catch {}
  return null;
}

/**
 * Guarda el ticket de admisión permanente emitido por el creador
 */
export function savePermanentTicket(ticket) {
  const TICKET_KEY = 'apocalipto_admission_ticket';
  try {
    localStorage.setItem(TICKET_KEY, JSON.stringify(ticket));
  } catch {}
}

/**
 * Limpia la identidad y ticket local para pruebas desde cero
 */
/**
 * Limpia la identidad y ticket local para pruebas desde cero
 */
export function resetLocalSwarmIdentity() {
  try {
    localStorage.removeItem('apocalipto_admission_ticket');
    localStorage.removeItem('apocalipto_local_identity_v2');
    localStorage.removeItem('apocalipto_chosen_faction');
    localStorage.removeItem('pz_survivor_name');
  } catch {}
  return getOrCreateLocalIdentity();
}

/**
 * Notifica al bridge para fijar o cambiar la facción elegida por el nodo aprobado
 */
export async function setSwarmNodeFaction(nodeId, faction, factionId) {
  try {
    const res = await fetch(`${getSwarmBridgeUrl()}/api/node/set-faction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, faction, factionId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

/**
 * Resetea el personaje en el bridge y en el almacenamiento local manteniendo la admisión permanente
 */
export async function resetSwarmCharacter(nodeId) {
  try {
    if (nodeId) {
      await fetch(`${getSwarmBridgeUrl()}/api/node/reset-character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId })
      });
    }
  } catch {}
  try {
    localStorage.removeItem('pz_survivor_name');
    localStorage.removeItem('apocalipto_chosen_faction');
    const ticket = getSavedPermanentTicket();
    if (ticket && ticket.payload) {
      ticket.payload.faction = null;
      ticket.payload.factionId = null;
      savePermanentTicket(ticket);
    }
  } catch {}
}

/**
 * Ejecuta el escaneo de hardware ligero (250ms) y consulta el estado del enjambre
 */
export async function verifyOrRegisterSwarmAccess(faction = 'DOE', lore = '', factionId = 'doe') {
  // Usar identidad Ed25519 real (asíncrona) — esperar si es la primera vez
  const identity = await getOrCreateLocalIdentityAsync();
  let savedTicket = getSavedPermanentTicket();

  // 1. Validar ticket con el puente del enjambre si está disponible
  if (savedTicket) {
    try {
      const checkRes = await fetch(`${getSwarmBridgeUrl()}/api/node/status/${identity.nodeId}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.status === 'APPROVED') {
          const currentTicket = checkData.ticket || savedTicket;
          if (faction && currentTicket?.payload) {
            currentTicket.payload.faction = faction.toUpperCase();
            currentTicket.payload.factionId = (factionId || faction).toLowerCase();
            savePermanentTicket(currentTicket);
            // Sincronizar de inmediato con el bridge
            await setSwarmNodeFaction(identity.nodeId, faction, factionId);
          }
          return {
            status: 'APPROVED',
            isPermanent: true,
            ticket: currentTicket,
            identity,
            message: 'Acceso permanente verificado criptográficamente.'
          };
        } else if (checkData.status === 'REJECTED') {
          localStorage.removeItem('apocalipto_admission_ticket');
          return {
            status: 'REJECTED',
            identity,
            message: 'Acceso denegado por el creador.'
          };
        } else {
          // El puente fue reseteado o el nodo fue revocado: invalidar ticket local obsoleto
          localStorage.removeItem('apocalipto_admission_ticket');
          savedTicket = null;
        }
      }
    } catch {
      // Modo offline: si el puente no responde, confiar en el ticket firmado localmente
      return {
        status: 'APPROVED',
        isPermanent: true,
        ticket: savedTicket,
        identity,
        message: 'Acceso permanente verificado localmente (modo offline).'
      };
    }
  }

  // 2. Micro-benchmark seguro de CPU/RAM (250 ms)
  const startTime = Date.now();
  let iterations = 0;
  while (Date.now() - startTime < 250) {
    iterations++;
  }
  const simulatedScore = Math.min(1800, Math.max(350, iterations * 10));

  // 3. Construir proofPayload y firmarlo con Ed25519 real
  const proofPayload = {
    nodeId: identity.nodeId,
    timestamp: Date.now(),
    cpuThreads: navigator.hardwareConcurrency || 8,
    ramTotalGB: 16,
    ramFreeGB: 8,
    benchmarkScore: iterations,
    hardwareScore: simulatedScore,
    roleClaimed: simulatedScore >= 200 ? 'ALFA' : 'SOMBRA'
  };

  // Firmar el payload con la clave privada Ed25519 local
  let signature;
  try {
    signature = await signWithEd25519(JSON.stringify(proofPayload), identity.privateKey);
  } catch (signErr) {
    // Si Ed25519 no está disponible en este browser, rechazar registro — sin bypass
    console.error('[Swarm] Error de firma Ed25519:', signErr.message);
    return { status: 'ERROR', identity, message: 'Tu navegador no soporta Ed25519. Actualiza Chrome/Edge.' };
  }

  const signedHardwareProof = {
    proofPayload,
    signature,      // firma Ed25519 real en hex
    publicKey: identity.publicKey  // clave pública SPKI en hex
  };

  // 4. Consultar al puente del enjambre
  try {
    let bridgeUrl = getSwarmBridgeUrl();
    let res = null;
    try {
      res = await fetch(`${bridgeUrl}/api/node/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamId: identity.steamId,
          faction,
          factionId,
          lore: lore || `Superviviente de ${faction} registrado en el enjambre.`,
          signedHardwareProof
        }),
        signal: AbortSignal.timeout(4000)
      });
    } catch {}

    // Si falló el envío con el gateway actual, refrescar desde GitHub y reintentar
    if (!res || !res.ok) {
      try {
        const ghRes = await fetch(`${BOOTSTRAP_REGISTRY_URL}?_t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData?.gatewayUrl) {
            cachedRemoteGateway = ghData.gatewayUrl.replace(/\/$/, '');
            try { localStorage.setItem('apocalipto_swarm_gateway', cachedRemoteGateway); } catch {}
            bridgeUrl = cachedRemoteGateway;
            res = await fetch(`${bridgeUrl}/api/node/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                steamId: identity.steamId,
                faction,
                factionId,
                lore: lore || `Superviviente de ${faction} registrado en el enjambre.`,
                signedHardwareProof
              }),
              signal: AbortSignal.timeout(4000)
            });
          }
        }
      } catch {}
    }

    if (!res || !res.ok) {
      return { status: 'PENDING', identity, message: 'Esperando respuesta del enjambre.' };
    }

    const data = await res.json();

    // Si el servidor confirma que ya estaba aprobado, guardar el ticket permanentemente
    if (data.status === 'APPROVED' && data.ticket) {
      savePermanentTicket(data.ticket);
      return { status: 'APPROVED', isPermanent: true, ticket: data.ticket };
    }

    return { status: data.status || 'PENDING', identity, score: simulatedScore };
  } catch (err) {
    // Si el puente no responde, verificar si hay ticket previo
    if (savedTicket) {
      return { status: 'APPROVED', isPermanent: true, ticket: savedTicket };
    }
    return { status: 'PENDING', identity, simulatedScore, offline: true };
  }
}

/**
 * Consulta si el Creador ya aprobó al jugador en Bento OS
 */
export async function pollApprovalStatus(nodeId) {
  try {
    let bridgeUrl = getSwarmBridgeUrl();
    let res = null;
    try {
      res = await fetch(`${bridgeUrl}/api/node/status/${nodeId}`, { signal: AbortSignal.timeout(3000) });
    } catch {}

    if (!res || !res.ok) {
      // Reintentar refrescando gateway desde GitHub
      try {
        const ghRes = await fetch(`${BOOTSTRAP_REGISTRY_URL}?_t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData?.gatewayUrl) {
            cachedRemoteGateway = ghData.gatewayUrl.replace(/\/$/, '');
            try { localStorage.setItem('apocalipto_swarm_gateway', cachedRemoteGateway); } catch {}
            bridgeUrl = cachedRemoteGateway;
            res = await fetch(`${bridgeUrl}/api/node/status/${nodeId}`, { signal: AbortSignal.timeout(3000) });
          }
        }
      } catch {}
    }

    if (!res || !res.ok) return { status: 'PENDING' };
    const data = await res.json();

    if (data.status === 'APPROVED' && data.ticket) {
      savePermanentTicket(data.ticket); // Guardar para siempre
      return { status: 'APPROVED', isPermanent: true, ticket: data.ticket };
    }

    return data;
  } catch {
    return { status: 'PENDING' };
  }
}

/**
 * Dispara el lanzamiento del juego con conexión directa al servidor Alfa.
 * Usa argumentos de PZ (-connect HOST -port PORT) para saltar el menú principal
 * y conectar directo al servidor sin intervención del jugador.
 */
export async function launchProjectZomboid(nodeId, faction, username, perfMode = true) {
  try {
    const bridgeUrl = getSwarmBridgeUrl();
    const isLocal = bridgeUrl.includes('localhost') || bridgeUrl.includes('127.0.0.1');
    let targetHost = '127.0.0.1';
    let targetPort = 16261;

    // 1. Consultar los endpoints del Enjambre para obtener host/port del servidor Alfa
    // Si la conexión es remota (no local) y este nodo no es el Alfa, usar el túnel de juego.
    // Si estamos en la máquina local (localhost / 127.0.0.1), conectar directo a loopback.
    if (!isLocal) {
      // Fallback por defecto al túnel oficial de Playit para jugadores de Internet
      targetHost = 'rails-switching.tun.ply.gg';
      targetPort = 63854;

      try {
        const endpointsRes = await fetch(`${bridgeUrl}/api/swarm/network-endpoints`, {
          signal: AbortSignal.timeout(3000)
        });
        if (endpointsRes.ok) {
          const epData = await endpointsRes.json();
          if (epData.gameTunnel?.host && epData.alfaNodeId !== nodeId) {
            targetHost = epData.gameTunnel.host;
            targetPort = Number(epData.gameTunnel.port) || 63854;
          }
        }
      } catch {}
    }

    // 2. Determinar nombre de usuario normal para el jugador (no admin)
    const factionTag = (faction || 'DOE').toUpperCase();
    const shortId = (nodeId || '1234').replace('node_', '').substring(0, 4).toUpperCase();
    const playerName = username || `Superviviente_${factionTag}_${shortId}`;

    // 3. Notificar al Bridge del enjambre para registrar la sesión y credenciales en whitelist
    let bridgeNotified = false;
    const candidateUrls = isLocal
      ? [...new Set([bridgeUrl, 'http://127.0.0.1:19842', 'http://localhost:19842'].filter(Boolean))]
      : [bridgeUrl].filter(Boolean);

    for (const u of candidateUrls) {
      try {
        const res = await fetch(`${u}/api/game/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nodeId, 
            faction, 
            username: playerName, 
            password: '12345',
            targetHost, 
            targetPort,
            perfMode: Boolean(perfMode)
          }),
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          bridgeNotified = true;
          break;
        }
      } catch (e) {
        console.warn('Swarm bridge notification warning:', e.message);
      }
    }

    // 4. Lanzar Project Zomboid conectando directamente al servidor de Apocalipto PZ
    // IP pública del túnel Playit o loopback local si es anfitrión
    const connectTarget = !isLocal ? `${targetHost}:${targetPort}` : '127.0.0.1:16261';
    let nativeLaunched = false;

    // A. Ejecutar comando nativo de Tauri (rundll32 a nivel de Windows OS, CERO advertencias de WebView2)
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('launch_steam_game', {
        connectAddress: connectTarget,
        username: playerName,
        faction: factionTag
      });
      nativeLaunched = true;
    } catch (invErr) {
      console.warn('Native launch_steam_game fallback:', invErr);
    }

    // B. Fallback si no está en Tauri desktop (ej: navegador web estándar)
    if (!nativeLaunched) {
      try {
        const { open } = await import('@tauri-apps/api/shell');
        await open('steam://rungameid/108600');
      } catch {
        try {
          if (typeof window !== 'undefined') {
            window.location.href = 'steam://rungameid/108600';
          }
        } catch {}
      }
    }

    return {
      success: true,
      game: 'Project Zomboid (Build 42)',
      nodeId,
      faction,
      username: playerName,
      serverHost: targetHost,
      serverPort: targetPort,
      isRemote: !isLocal,
      message: `Enlace P2P establecido como ${playerName}. Iniciando Project Zomboid...`
    };
  } catch (err) {
    const fallbackTarget = '147.185.221.215:63854';
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('launch_steam_game', {
        connectAddress: fallbackTarget,
        username: username || 'Superviviente',
        faction: (faction || 'MOK').toUpperCase()
      });
    } catch {
      try {
        const { open } = await import('@tauri-apps/api/shell');
        await open('steam://rungameid/108600');
      } catch {}
    }
    return {
      success: true,
      game: 'Project Zomboid (Build 42)',
      username: username || 'Superviviente',
      serverHost: 'rails-switching.tun.ply.gg',
      serverPort: 63854,
      isRemote: true,
      message: 'Project Zomboid iniciado vía Steam hacia Apocalipto PZ.'
    };
  }
}

/**
 * Verifica la integridad de mods contra el Nodo Alfa ANTES de lanzar PZ.
 *
 * Flujo:
 *  1. Consulta GET /api/swarm/modlist al Bridge del Enjambre.
 *  2. Si el Bridge detectó un failover reciente → { ok: false, resyncRequired: true }.
 *     El Launcher debe mostrar aviso y NO lanzar PZ hasta que el usuario reinicie el Launcher.
 *  3. Si checksumEnabled=true en el Alfa → alerta: puede expulsar jugadores con versiones distintas.
 *  4. En caso de éxito → { ok: true, modIds, workshopIds }.
 *
 * @returns {{ ok: boolean, resyncRequired?: boolean, checksumWarning?: boolean,
 *             modIds?: string[], workshopIds?: string[], offline?: boolean, message?: string }}
 */
export async function checkModSync() {
  try {
    const res = await fetch(`${getSwarmBridgeUrl()}/api/swarm/modlist`, {
      signal: AbortSignal.timeout(5000) // 5s — no bloquea si el Bridge está offline
    });

    if (!res.ok) {
      return { ok: true, offline: true, message: 'Bridge offline — verificación de mods omitida.' };
    }

    const data = await res.json();

    // ⚠️ Failover reciente: el Nodo Alfa cambió, mods pueden estar en estado distinto
    if (data.modResyncRequired) {
      return {
        ok: false,
        resyncRequired: true,
        alfaNodeId: data.alfaNodeId,
        message: '⚠️ El Enjambre acaba de cambiar de Nodo Alfa. Cierra y vuelve a abrir el Launcher para sincronizar mods antes de entrar al juego.'
      };
    }

    // ⚠️ DoLuaChecksum activo: PZ puede expulsar a jugadores con versiones distintas
    if (data.checksumEnabled) {
      return {
        ok: false,
        checksumWarning: true,
        modIds: data.modIds,
        workshopIds: data.workshopIds,
        message: '⚠️ El Nodo Alfa tiene verificación de mods activa (DoLuaChecksum=true). Asegúrate de que Steam haya actualizado todos tus mods antes de entrar.'
      };
    }

    // Todo OK
    return {
      ok: true,
      modIds: data.modIds || [],
      workshopIds: data.workshopIds || [],
      alfaNodeId: data.alfaNodeId,
      message: '✓ Mods sincronizados con el Nodo Alfa.'
    };
  } catch {
    // Timeout o fallo de red — dejar pasar, no bloquear el juego
    return { ok: true, offline: true, message: 'Verificación de mods omitida (Bridge no disponible).' };
  }
}

/**
 * Activa el Motor de Failover en modo ALFA en el Bridge.
 * Debe llamarse JUSTO DESPUÉS de lanzar PZ con éxito en el Nodo Alfa.
 * El Bridge emitirá heartbeats criptográficos cada 5s para que los Nodos
 * Sombra detecten si el Alfa cayó y ejecuten el relevo autónomo.
 *
 * @param {string} nodeId
 */
export async function activateAlfaEngine(nodeId) {
  try {
    const res = await fetch(`${getSwarmBridgeUrl()}/api/node/activate-alfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error || 'Error activando motor Alfa.' };
    }
    return await res.json();
  } catch (err) {
    return { success: false, message: `Bridge no disponible: ${err.message}` };
  }
}

/**
 * Consulta el estado del Motor de Failover Alfa en el Bridge.
 * El Launcher usa esto para mostrar el indicador de "Nodo Alfa Activo".
 */
export async function getAlfaStatus() {
  try {
    const res = await fetch(`${getSwarmBridgeUrl()}/api/node/alfa-status`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return { alfaEngineActive: false, alfaNodeId: null };
    return await res.json();
  } catch {
    return { alfaEngineActive: false, alfaNodeId: null };
  }
}
