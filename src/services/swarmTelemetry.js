/**
 * Swarm Telemetry Service para PZ-Landing
 * Consulta en tiempo real las estadísticas del Enjambre P2P y el estado de la pasarela.
 */

export function getBridgeApiUrl() {
  if (typeof window !== 'undefined') {
    // Si viene por query param ?gateway=http://...
    try {
      const params = new URLSearchParams(window.location.search);
      const gw = params.get('gateway');
      if (gw) return gw.replace(/\/$/, '');
    } catch {}

    // Si hay un gateway guardado
    const saved = localStorage.getItem('apocalipto_swarm_gateway');
    if (saved) return saved.replace(/\/$/, '');

    // Si estamos en una IP de red local (ej. 192.168.x.x), usar esa misma IP para el bridge
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:19842`;
    }
  }
  return 'http://localhost:19842';
}

/**
 * Obtiene las estadísticas de cupos y nodos en vivo del Enjambre
 */
export async function fetchLiveSwarmStats() {
  const bridgeUrl = getBridgeApiUrl();
  try {
    const res = await fetch(`${bridgeUrl}/api/swarm/stats`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        onlineNodes: data.totalApproved || 1,
        totalSlots: data.totalServerSlots || 50,
        maxPublicSlots: data.maxPublicSlots || 40,
        adminGhostSlots: 10,
        adminGhostSlotsUsed: 0,
        factions: {
          doe: { count: data.counts?.doe || 0, cap: 10, name: 'D.O.E. (Militares)' },
          mok: { count: data.counts?.mok || 0, cap: 10, name: 'MOK (Crimen)' },
          kto: { count: data.counts?.kto || 0, cap: 10, name: 'KTO (Culto)' },
          riv: { count: data.counts?.riv || 0, cap: 10, name: 'RIV (Milicia)' },
        },
        isLive: true,
        bridgeUrl
      };
    }
  } catch (err) {
    // Fallback silencioso si el bridge está temporalmente inactivo
  }

  return {
    onlineNodes: 1,
    totalSlots: 50,
    maxPublicSlots: 40,
    adminGhostSlots: 10,
    adminGhostSlotsUsed: 0,
    factions: {
      doe: { count: 0, cap: 10, name: 'D.O.E. (Militares)' },
      mok: { count: 1, cap: 10, name: 'MOK (Crimen)' },
      kto: { count: 0, cap: 10, name: 'KTO (Culto)' },
      riv: { count: 0, cap: 10, name: 'RIV (Milicia)' },
    },
    isLive: false,
    bridgeUrl
  };
}

/**
 * Obtiene la información de gateway y el enlace de invitación para el Launcher
 */
export async function fetchGatewayInfo() {
  const bridgeUrl = getBridgeApiUrl();
  try {
    const res = await fetch(`${bridgeUrl}/api/admin/gateway-info`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  return {
    localLanIp: host,
    httpPort: 19842,
    gameUdpPort: 16261,
    inviteUrl: `http://${host}:5176/?gateway=http://${host}:19842`,
    tunnelStatus: 'LAN_DIRECT'
  };
}
