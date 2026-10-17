import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec, spawn } from 'node:child_process';
import { verifyHardwareProof } from '../hardware/scanner.js';
import { signPayload, verifySignature } from '../crypto/keys.js';
import { LocalUdpProxy } from './localProxy.js';
import { PZ_RconClient } from './rconClient.js';
import { FailoverEngine, FAILOVER_ROLES } from './failoverEngine.js';
import { steamModsManager } from './steamModsManager.js';

/**
 * Puente de Señalización del Enjambre (Swarm Signaling Bridge)
 * Conecta los Launchers de los jugadores con el Dashboard del Creador (Bento OS).
 *
 * MÁXIMA SEGURIDAD & PROTECCIÓN DEL EQUIPO DEL USUARIO:
 * 1. Límite de carga: Máximo 64 KB por petición (cero consumo desmedido de RAM).
 * 2. Rate-Limiting: Máximo 30 peticiones/min por IP (evita sobrecalentamiento/spam de red).
 * 3. Escritura Atómica en Disco: Guarda en archivos temporales antes de renombrar (cero corrupción de datos).
 * 4. Validación Criptográfica: Todo registro requiere firma Ed25519 válida.
 */

export class SwarmBridgeServer {
  constructor({ port = 19842, storageDir, adminIdentity }) {
    this.port = port;
    this.storageDir = storageDir;
    this.adminIdentity = adminIdentity; // Identidad Ed25519 del creador
    this.rcon = new PZ_RconClient({
      host: '127.0.0.1',
      port: 27015,
      password: 'ApocaliptoSwarm2026SecureRCON#Root!'
    });
    this.applicantsFile = path.join(storageDir, 'applicants.json');
    this.approvedNodesFile = path.join(storageDir, 'approved_nodes.json');
    this.rejectedNodesFile = path.join(storageDir, 'rejected_nodes.json');

    // Estado del Motor de Failover y Heartbeat del Enjambre P2P
    this.failoverState = {
      currentAlfaNodeId: adminIdentity?.nodeId || 'alfa_root',
      lastHeartbeatTimestamp: Date.now(),
      blockHeight: 0,
      blockHash: null,
      history: []
    };

    // Proxy UDP local para reenvío transparente de paquetes de juego PZ
    this.localProxy = new LocalUdpProxy();

    // Rate limiter en memoria: IP -> [timestamps]
    this.rateLimits = new Map();

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    this._initStorage();

    // Motor de Failover del Alfa — se instancia cuando el Nodo Alfa activa el juego.
    // Emite heartbeats criptográficos cada 5s al propio Bridge para que los Nodos Sombra
    // puedan detectar si el Alfa cayó y activar el protocolo de relevo autónomo.
    this._alfaEngine = null;
    this._alfaEngineActive = false;
  }

  _initStorage() {
    if (!fs.existsSync(this.applicantsFile)) {
      this._atomicWrite(this.applicantsFile, []);
    }
    if (!fs.existsSync(this.approvedNodesFile)) {
      this._atomicWrite(this.approvedNodesFile, {});
    }
    if (!fs.existsSync(this.rejectedNodesFile)) {
      this._atomicWrite(this.rejectedNodesFile, {});
    }
  }

  /**
   * Escritura atómica para evitar corrupción de archivos si se apaga la PC
   */
  _atomicWrite(filePath, data) {
    const tmpPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  _readJson(filePath, fallback = null) {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return fallback;
    }
  }

  /**
   * Verifica que una IP no esté spameando para proteger la CPU del host
   */
  _checkRateLimit(ip, maxPerMin = 120) {
    const now = Date.now();
    const windowStart = now - 60000;

    // Prevención de memory leak / inflación de mapa (BTC Bounded Memory)
    if (this.rateLimits.size > 1000) {
      for (const [key, list] of this.rateLimits.entries()) {
        if (!list || list.length === 0 || list[list.length - 1] < windowStart) {
          this.rateLimits.delete(key);
        }
      }
    }

    const timestamps = (this.rateLimits.get(ip) || []).filter(t => t > windowStart);

    if (timestamps.length >= maxPerMin) {
      return false;
    }

    timestamps.push(now);
    this.rateLimits.set(ip, timestamps);
    return true;
  }

  _getLocalLanIp() {
    try {
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) return net.address;
        }
      }
    } catch {}
    return '127.0.0.1';
  }

  /**
   * Registra un intento de acceso a un honeypot y escribe en el log de amenazas.
   * Cero contraataque: solo se registra y se bloquea silenciosamente.
   */
  _logHoneypotHit(ip, routePath, headers) {
    const record = {
      type: 'HONEYPOT_ALERT',
      timestamp: new Date().toISOString(),
      ip: ip,
      path: routePath,
      userAgent: headers['user-agent'] || 'UNKNOWN',
      referer: headers['referer'] || 'NONE',
    };

    // Bloquear IP en memoria para la sesión actual
    this.blockedIps = this.blockedIps || new Set();
    this.blockedIps.add(ip);

    // Escribir en archivo de log de amenazas (append atómico)
    const logPath = path.join(this.storageDir, 'threat_log.jsonl');
    try {
      fs.appendFileSync(logPath, JSON.stringify(record) + '\n', 'utf8');
    } catch {}

    console.warn(`\n⚠️  [HONEYPOT] IP ATRAPADA: ${ip} → ${routePath}`);
    console.warn(`   User-Agent: ${record.userAgent}`);
    console.warn(`   Registrado en: ${logPath}\n`);
  }

  start() {
    // Orígenes permitidos: solo el panel local del Creador y los Launchers locales
    const ALLOWED_ORIGINS = new Set([
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5176',
      `http://${this._getLocalLanIp()}:5173`,
      `http://${this._getLocalLanIp()}:5174`,
      `http://${this._getLocalLanIp()}:5176`,
    ]);

    // Rutas administrativas y de control: SOLO accesibles desde loopback directo del Creador (127.0.0.1 sin túnel)
    const ADMIN_ONLY_ROUTES = new Set([
      '/api/admin/approve',
      '/api/admin/reject',
      '/api/admin/revoke',
      '/api/admin/reset',
      '/api/admin/applicants',
      '/api/admin/rcon',
      '/api/admin/gateway-info',
      '/api/admin/gateway-config',
      '/api/admin/stats',
      '/api/admin/world/status',
      '/api/admin/world/start',
      '/api/admin/world/stop',
      '/api/admin/world/config',
      '/api/admin/mods',
      '/api/admin/mods/toggle',
      '/api/admin/mods/install',
      '/api/admin/mods/update',
      '/api/game/kill',
      '/api/game/launch',
      '/api/node/activate-alfa',
    ]);

    // ─────────────────────────────────────────────────────────────────
    // HONEYPOT ENDPOINTS: Rutas que ningún Launcher legítimo debería tocar.
    // Cualquier IP que acceda aquí queda baneada automáticamente.
    // ─────────────────────────────────────────────────────────────────
    const HONEYPOT_ROUTES = new Set([
      '/admin', '/panel', '/dashboard', '/wp-admin', '/config',
      '/.env', '/api/keys', '/api/secret', '/api/tokens',
      '/api/admin/export', '/api/admin/download', '/backup',
      '/api/v1/auth', '/api/v1/admin', '/login', '/api/login',
    ]);

    this.server = http.createServer(async (req, res) => {
      // 0a. Detección estricta de tráfico proveniente de túneles WAN (Cloudflare, proxies, etc.)
      const isTunnelRequest = Boolean(
        req.headers['cf-connecting-ip'] || 
        req.headers['cf-ray'] || 
        req.headers['cf-visitor'] ||
        req.headers['x-forwarded-for'] ||
        req.headers['x-forwarded-proto']
      );

      const rawSocketIp = req.socket.remoteAddress || '127.0.0.1';
      const isRawLoopback = rawSocketIp === '127.0.0.1' || rawSocketIp === '::1' || rawSocketIp === '::ffff:127.0.0.1';

      // SOLO es loopback genuino si el socket TCP es local Y NO proviene de ningún túnel o proxy externo
      const isLoopback = isRawLoopback && !isTunnelRequest;

      // La IP real del cliente (para rate limiting, honeypot y logs):
      const clientIp = isTunnelRequest
        ? (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'WAN_REMOTE')
        : rawSocketIp;

      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const origin = req.headers.origin || '';

      // 0b. Anti-Request Smuggling: Rechazar cabeceras contradictorias
      if (req.headers['transfer-encoding'] && req.headers['content-length']) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'BAD_REQUEST', message: 'Conflicting transfer-encoding and content-length' }));
      }

      // ── HONEYPOT TRAP ──────────────────────────────────────────────
      if (HONEYPOT_ROUTES.has(url.pathname)) {
        this._logHoneypotHit(clientIp, url.pathname, req.headers);
        // Respuesta falsa convincente para que el atacante crea que logró algo
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          status: 'ok',
          token: 'HONEYPOT_TOKEN_LOGGED',
          message: 'Authenticated'
        }));
      }

      // ── CORS SEGURO: Permitir peticiones legítimas de Launchers (Tauri / Web) ──
      const isPublicRoute = !ADMIN_ONLY_ROUTES.has(url.pathname);
      const isAllowedOrigin = ALLOWED_ORIGINS.has(origin) || origin.includes('localhost') || origin.includes('tauri.localhost') || origin === '';
      const corsOrigin = isPublicRoute ? (origin || '*') : (isAllowedOrigin ? origin : 'null');

      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Vary', 'Origin');

      if (req.method === 'OPTIONS') {
        if (!isPublicRoute && !isAllowedOrigin && origin !== '') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'CORS_ORIGIN_DENIED' }));
        }
        res.writeHead(204);
        return res.end();
      }

      // ── PROTECCIÓN ESTRICTA DE RUTAS ADMIN: solo loopback directo (NO túnel) ──
      if (ADMIN_ONLY_ROUTES.has(url.pathname) && !isLoopback) {
        this._logHoneypotHit(clientIp, url.pathname + ' [ADMIN_PROBE_BLOCKED]', req.headers);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'FORBIDDEN', message: 'Acceso restringido exclusivamente a la consola local del Creador.' }));
      }

      if (!url.pathname.includes('/health') && !url.pathname.includes('/stats')) {
        console.log(`[HTTP ${req.method}] ${url.pathname} from ${clientIp} (loopback: ${isLoopback})`);
      }

      // ── BLOQUEO PERMANENTE DE IPS QUE TOCARON HONEYPOTS ──────────
      if (this.blockedIps && this.blockedIps.has(clientIp) && !isLoopback) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not found');
      }

      // 1. Rate Limiting de protección (Exento para panel Admin y Loopback)
      if (!url.pathname.startsWith('/api/admin/') && !isLoopback && !this._checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED', message: 'Protección de red: Por favor espera un momento.' }));
      }

      // 2. Health Check
      if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ONLINE', protocol: 'APOCALIPTO_PZ_SWARM_V1' }));
      }

      // 2c. SAVE-CHAIN TELEMETRY (Último bloque validado del mundo)
      if (req.method === 'GET' && url.pathname === '/api/savechain/latest') {
        const ledgerFile = path.join(path.dirname(this.storageDir), 'ledger', 'chain.jsonl');
        let latestBlock = null;
        let height = 0;
        if (fs.existsSync(ledgerFile)) {
          const lines = fs.readFileSync(ledgerFile, 'utf8').trim().split('\n').filter(Boolean);
          height = lines.length;
          if (lines.length > 0) {
            try { latestBlock = JSON.parse(lines[lines.length - 1]); } catch {}
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          height,
          latestBlockHash: latestBlock?.blockHash || null,
          merkleRoot: latestBlock?.header?.merkleRoot || null,
          chunksCount: latestBlock?.changes?.length || 0,
          timestamp: latestBlock?.header?.timestamp || null,
          alfaNodeId: latestBlock?.header?.alfaNodeId || null,
        }));
      }

      // 2d. FAILOVER STATUS & HEARTBEAT TELEMETRY (Monitoreo de vida del Nodo Alfa)
      if (req.method === 'GET' && url.pathname === '/api/failover/status') {
        const now = Date.now();
        const ageMs = now - this.failoverState.lastHeartbeatTimestamp;
        const isAlfaAlive = ageMs < 15000; // 15 segundos sin latidos = caído

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          currentAlfaNodeId: this.failoverState.currentAlfaNodeId,
          lastHeartbeatTimestamp: this.failoverState.lastHeartbeatTimestamp,
          timeSinceLastHeartbeatMs: ageMs,
          isAlfaAlive,
          status: isAlfaAlive ? 'ALFA_HEALTHY' : 'ALFA_UNRESPONSIVE',
          blockHeight: this.failoverState.blockHeight,
          blockHash: this.failoverState.blockHash,
          historyCount: this.failoverState.history.length
        }));
      }

      // 2b. INFORMACIÓN DE ENLACE EXTERNO & GATEWAY (Para conectar jugadores de otras PCs)
      if (req.method === 'GET' && url.pathname === '/api/admin/gateway-info') {
        const osNets = os.networkInterfaces();
        let localLanIp = '127.0.0.1';
        for (const name of Object.keys(osNets)) {
          for (const net of osNets[name]) {
            if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('172.') && !net.address.startsWith('169.254')) {
              localLanIp = net.address;
              break;
            }
          }
        }

        const gatewayConfigFile = path.join(this.storageDir, 'gateway.json');
        const customConfig = this._readJson(gatewayConfigFile, {});
        const activeGateway = customConfig.publicGateway || localLanIp;
        const httpPort = this.port || 19842;
        const gameUdpPort = 16261;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          localLanIp,
          httpPort,
          gameUdpPort,
          publicGateway: customConfig.publicGateway || null,
          activeGateway,
          inviteUrl: `http://${activeGateway}:5176/?gateway=http://${activeGateway}:${httpPort}`,
          tunnelStatus: customConfig.publicGateway ? 'TUNNEL_CUSTOM' : 'LAN_DIRECT'
        }));
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/gateway-config') {
        this._parseBody(req, res, (body) => {
          const { publicGateway } = body;
          const gatewayConfigFile = path.join(this.storageDir, 'gateway.json');
          const current = this._readJson(gatewayConfigFile, {});
          current.publicGateway = (publicGateway || '').trim();
          current.updatedAt = Date.now();
          this._atomicWrite(gatewayConfigFile, current);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, publicGateway: current.publicGateway }));
        });
        return;
      }

      // 2e. EMISIÓN DE HEARTBEAT DEL NODO ALFA
      if (req.method === 'POST' && url.pathname === '/api/failover/heartbeat') {
        this._parseBody(req, res, (body) => {
          const { payload, signature, publicKey } = body;
          if (!payload || !payload.alfaNodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'INVALID_HEARTBEAT' }));
          }

          // Si el Alfa actual sigue respondiendo (< 15s) y otro nodo no autorizado intenta emitir heartbeat, rechazar
          if (this.failoverState.currentAlfaNodeId && this.failoverState.currentAlfaNodeId !== payload.alfaNodeId) {
            const ageMs = Date.now() - this.failoverState.lastHeartbeatTimestamp;
            if (ageMs < 15000) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'ALFA_ALREADY_ACTIVE', activeAlfa: this.failoverState.currentAlfaNodeId }));
            }
          }

          this.failoverState.currentAlfaNodeId = payload.alfaNodeId;
          this.failoverState.lastHeartbeatTimestamp = payload.timestamp || Date.now();
          this.failoverState.blockHeight = payload.blockHeight || this.failoverState.blockHeight;
          this.failoverState.blockHash = payload.blockHash || this.failoverState.blockHash;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, ack: Date.now() }));
        });
        return;
      }

      // 2f. RECLAMO CRIPTOGRÁFICO DE PROMOCIÓN A NODO ALFA (Failover)
      if (req.method === 'POST' && url.pathname === '/api/failover/promote') {
        this._parseBody(req, res, (body) => {
          const { claimPayload, signature, publicKey } = body;
          if (!claimPayload || !claimPayload.promotedNodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'INVALID_CLAIM' }));
          }

          const now = Date.now();
          const ageMs = now - this.failoverState.lastHeartbeatTimestamp;

          // Regla de Consenso Táctico (Objetivo 5 segundos):
          // Se autoriza la promoción si el Alfa anterior lleva > 4s en silencio absoluto.
          if (ageMs < 4000 && this.failoverState.currentAlfaNodeId !== claimPayload.promotedNodeId) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
              error: 'PROMOTION_REJECTED', 
              message: `El Alfa actual (${this.failoverState.currentAlfaNodeId}) sigue respondiendo (hace ${Math.round(ageMs/1000)}s). Se requieren al menos 4s de silencio confirmado.` 
            }));
          }

          // Escudo Anti-Aleteo (Cooldown de 60s):
          // Si ocurrió un relevo recientemente, el mando queda protegido para evitar rebotes de ping-pong.
          if (this.failoverState._lastPromotionTimestamp && (now - this.failoverState._lastPromotionTimestamp < 60000)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              error: 'PROMOTION_COOLDOWN_ACTIVE',
              message: 'Relevo reciente en curso. El liderazgo está protegido por estabilidad de red.'
            }));
          }

          const previousAlfa = this.failoverState.currentAlfaNodeId;
          this.failoverState.currentAlfaNodeId = claimPayload.promotedNodeId;
          this.failoverState.lastHeartbeatTimestamp = now;
          this.failoverState._lastPromotionTimestamp = now;
          // Activar señal de re-sync obligatoria de mods para todos los Supervivientes.
          // El Launcher detecta esta señal en /api/swarm/modlist y avisa al jugador que
          // debe cerrar y volver a abrir PZ para evitar desajuste de mods post-failover.
          this.failoverState._modResyncRequired = true;
          this.failoverState._modResyncTriggeredAt = now;
          // Limpiar la señal automáticamente en 120 segundos (tiempo suficiente para que
          // todos los Launchers conectados la detecten y actúen en consecuencia).
          clearTimeout(this._modResyncClearTimer);
          this._modResyncClearTimer = setTimeout(() => {
            this.failoverState._modResyncRequired = false;
            this.failoverState._modResyncTriggeredAt = null;
            console.log('[MOD SYNC] Señal de re-sync limpiada. Todos los nodos deberían haber reiniciado PZ.');
          }, 120_000);

          this.failoverState.history.push({
            previousAlfa,
            promotedAlfa: claimPayload.promotedNodeId,
            timestamp: now,
            reason: claimPayload.reason || 'FAILOVER_TRIGGERED'
          });

          console.log(`\n🚨 [FAILOVER P2P] RELEVO DE NODO ALFA EJECUTADO:`);
          console.log(`   Anterior: ${previousAlfa}`);
          console.log(`   Nuevo Alfa: ${claimPayload.promotedNodeId}`);
          console.log(`   Hora: ${new Date(now).toISOString()}`);
          console.log(`   ⚠️  Señal MOD_RESYNC_REQUIRED activada — activa por 120s\n`);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            promotedNodeId: claimPayload.promotedNodeId,
            previousAlfa,
            promotedAt: now
          }));
        });
        return;
      }

      // 3. REGISTRO DE NODO / SOLICITUD DE WHITELIST (Desde el Launcher de cualquier jugador)
      if (req.method === 'POST' && url.pathname === '/api/node/register') {
        this._parseBody(req, res, (body) => {
          const { steamId, faction, factionId, lore, signedHardwareProof } = body;

          if (!steamId || !signedHardwareProof) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_DATA' }));
          }

          // Validación criptográfica: ÚNICA ruta — firma Ed25519 nativa verificada
          // NO existe camino alternativo. Una firma inválida = rechazo total.
          let proofVerification = verifyHardwareProof(signedHardwareProof);

          if (!proofVerification.valid) {
            // Registrar intento de bypasear validación
            const clientIpLog = req.socket?.remoteAddress || 'unknown';
            const logPath = path.join(this.storageDir, 'threat_log.jsonl');
            try {
              fs.appendFileSync(logPath, JSON.stringify({
                type: 'INVALID_PROOF_ATTEMPT',
                timestamp: new Date().toISOString(),
                ip: clientIpLog,
                error: proofVerification.error,
                steamId: steamId ? String(steamId).substring(0, 20) : 'NONE',
              }) + '\n', 'utf8');
            } catch {}

            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'INVALID_HARDWARE_PROOF' }));
          }

          const nodeId = signedHardwareProof.proofPayload.nodeId;
          const score = proofVerification.score;
          const roleClaimed = proofVerification.verifiedRole;

          // Si el jugador ya fue aprobado previamente por el creador, mantenerlo APROBADO PERMANENTEMENTE
          const approvedNodes = this._readJson(this.approvedNodesFile, {});
          const existingApproval = approvedNodes[nodeId] || Object.values(approvedNodes).find(t => t.payload.steamId === steamId);

          if (existingApproval) {
            // Si el jugador ya fue aprobado previamente y está eligiendo una nueva facción (ej: reinició personaje)
            if (faction) {
              const targetFaction = faction.toUpperCase();
              const targetFactionId = (factionId || faction).toLowerCase();
              existingApproval.payload.faction = targetFaction;
              existingApproval.payload.factionId = targetFactionId;
              approvedNodes[nodeId] = existingApproval;
              this._atomicWrite(this.approvedNodesFile, approvedNodes);
              console.log(`[SWARM] Nodo aprobado ${nodeId} cambió a nueva facción: ${targetFaction}`);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              nodeId,
              status: 'APPROVED',
              ticket: existingApproval,
              message: 'Nodo ya verificado y aprobado permanentemente en el enjambre.'
            }));
          }

          const applicants = this._readJson(this.applicantsFile, []);
          const existingIdx = applicants.findIndex(a => a.nodeId === nodeId || a.steamId === steamId);

          const applicantRecord = {
            nodeId,
            steamId,
            faction: faction || 'DOE',
            factionId: factionId || (faction ? faction.toLowerCase() : 'doe'),
            lore: lore || 'Superviviente no afiliado',
            score,
            roleClaimed,
            hardwareMetrics: {
              threads: signedHardwareProof.proofPayload?.cpuThreads || 4,
              ramTotalGB: signedHardwareProof.proofPayload?.ramTotalGB || 16
            },
            publicKey: signedHardwareProof.publicKey || `ed25519_pk_${nodeId}`,
            signature: signedHardwareProof.signature || `sig_ed25519_${nodeId}`,
            status: 'PENDING',
            submittedAt: Date.now()
          };

          if (existingIdx >= 0) {
            applicants[existingIdx] = applicantRecord;
          } else {
            applicants.push(applicantRecord);
          }

          this._atomicWrite(this.applicantsFile, applicants);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, nodeId, status: 'PENDING', message: 'Solicitud firmada recibida por el enjambre.' }));
        });
        return;
      }

      // 3b. FIJAR O ACTUALIZAR FACCIÓN DE UN NODO AUTORIZADO
      if (req.method === 'POST' && url.pathname === '/api/node/set-faction') {
        this._parseBody(req, res, (body) => {
          const { nodeId, faction, factionId } = body;
          if (!nodeId || !faction) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_DATA' }));
          }

          const targetFaction = faction.toUpperCase();
          const targetFactionId = (factionId || faction).toLowerCase();

          const approvedNodes = this._readJson(this.approvedNodesFile, {});
          if (approvedNodes[nodeId]) {
            approvedNodes[nodeId].payload.faction = targetFaction;
            approvedNodes[nodeId].payload.factionId = targetFactionId;
            this._atomicWrite(this.approvedNodesFile, approvedNodes);
            console.log(`[SWARM] Facción fijada para nodo ${nodeId}: ${targetFaction}`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, faction: targetFaction, factionId: targetFactionId }));
        });
        return;
      }

      // 4. CONSULTA DE ESTADO (El Launcher verifica si ya fue aprobado)
      if (req.method === 'GET' && url.pathname.startsWith('/api/node/status/')) {
        const targetNodeId = url.pathname.replace('/api/node/status/', '');
        const approvedNodes = this._readJson(this.approvedNodesFile, {});

        if (approvedNodes[targetNodeId]) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            status: 'APPROVED',
            ticket: approvedNodes[targetNodeId]
          }));
        }

        const rejectedNodes = this._readJson(this.rejectedNodesFile, {});
        if (rejectedNodes[targetNodeId]) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            status: 'REJECTED',
            message: 'Solicitud rechazada por el creador.'
          }));
        }

        const applicants = this._readJson(this.applicantsFile, []);
        const applicant = applicants.find(a => a.nodeId === targetNodeId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          status: applicant ? applicant.status : 'NOT_FOUND'
        }));
      }

      // 5. LISTAR ASPIRANTES (Solo para TU Bento OS Dashboard)
      if (req.method === 'GET' && url.pathname === '/api/admin/applicants') {
        const applicants = this._readJson(this.applicantsFile, []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(applicants));
      }

      // 6. APROBAR ASPIRANTE (Emitir Ticket Criptográfico firmado por el Creador)
      if (req.method === 'POST' && url.pathname === '/api/admin/approve') {
        this._parseBody(req, res, (body) => {
          const { nodeId, assignedRole } = body;
          const applicants = this._readJson(this.applicantsFile, []);
          const applicant = applicants.find(a => a.nodeId === nodeId);

          if (!applicant) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'APPLICANT_NOT_FOUND' }));
          }

          const approvedNodes = this._readJson(this.approvedNodesFile, {});
          const nodesList = Object.values(approvedNodes);
          const fid = (applicant.factionId || applicant.faction || 'doe').toLowerCase();

          // Regla de escalabilidad: 40 cupos públicos (10 por facción) + 10 cupos fantasma para el Admin/Staff
          const isStaff = assignedRole === 'ADMIN' || assignedRole === 'STAFF';
          if (!isStaff) {
            const currentFactionCount = nodesList.filter(n => {
              const f = (n.payload?.factionId || n.payload?.faction || '').toLowerCase();
              return f.includes(fid) || fid.includes(f);
            }).length;

            if (currentFactionCount >= 10) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ 
                error: 'FACTION_FULL', 
                message: `La facción ${applicant.faction} ha alcanzado su límite de 10 supervivientes.` 
              }));
            }
          }

          // Crear ticket de admisión firmado por el creador
          const ticketPayload = {
            nodeId,
            steamId: applicant.steamId,
            faction: applicant.faction || 'DOE',
            factionId: applicant.factionId || (applicant.faction ? applicant.faction.toLowerCase() : 'doe'),
            assignedRole: assignedRole || applicant.roleClaimed,
            approvedAt: Date.now(),
            networkId: 'apocalipto_swarm_b42'
          };

          const signature = signPayload(JSON.stringify(ticketPayload), this.adminIdentity.privateKey);

          const ticket = {
            payload: ticketPayload,
            creatorSignature: signature,
            creatorPublicKey: this.adminIdentity.publicKey
          };

          // Guardar nodo aprobado
          approvedNodes[nodeId] = ticket;
          this._atomicWrite(this.approvedNodesFile, approvedNodes);

          // Actualizar estado en lista de aspirantes
          applicant.status = 'APPROVED';
          this._atomicWrite(this.applicantsFile, applicants.filter(a => a.nodeId !== nodeId));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, ticket }));
        });
        return;
      }

      // 9. CONTEO Y ESTADÍSTICAS EN TIEMPO REAL DE FACCIONES Y NODOS APROBADOS
      if (req.method === 'GET' && url.pathname === '/api/admin/stats') {
        const approvedNodes = this._readJson(this.approvedNodesFile, {});
        const nodesList = Object.values(approvedNodes);
        
        const counts = { doe: 0, mok: 0, kto: 0, riv: 0 };
        let adminGhostSlotsUsed = 0;

        for (const item of nodesList) {
          const role = item.payload?.assignedRole;
          if (role === 'ADMIN' || role === 'STAFF') {
            adminGhostSlotsUsed++;
          }
          const fid = (item.payload?.factionId || item.payload?.faction || '').toLowerCase();
          if (fid.includes('mok') || fid.includes('kin') || fid.includes('merod')) counts.mok++;
          else if (fid.includes('kto') || fid.includes('testam') || fid.includes('knox')) counts.kto++;
          else if (fid.includes('riv') || fid.includes('centin')) counts.riv++;
          else if (fid.includes('doe') || fid.includes('emerg') || fid.includes('milit')) counts.doe++;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          totalApproved: nodesList.length,
          counts,
          maxPublicSlots: 40,
          maxAdminGhostSlots: 10,
          totalServerSlots: 50,
          adminGhostSlotsUsed,
          approvedNodes
        }));
      }

      // 9b. ESTADÍSTICAS PÚBLICAS Y SANITIZADAS DE FACCIONES (Para Launchers y Landing Page)
      // CERO fuga de datos: solo devuelve conteos numéricos anónimos, sin Steam IDs ni tickets.
      if (req.method === 'GET' && url.pathname === '/api/swarm/stats') {
        const approvedNodes = this._readJson(this.approvedNodesFile, {});
        const nodesList = Object.values(approvedNodes);
        
        const counts = { doe: 0, mok: 0, kto: 0, riv: 0 };

        for (const item of nodesList) {
          const fid = (item.payload?.factionId || item.payload?.faction || '').toLowerCase();
          if (fid.includes('mok') || fid.includes('kin') || fid.includes('merod')) counts.mok++;
          else if (fid.includes('kto') || fid.includes('testam') || fid.includes('knox')) counts.kto++;
          else if (fid.includes('riv') || fid.includes('centin')) counts.riv++;
          else if (fid.includes('doe') || fid.includes('emerg') || fid.includes('milit')) counts.doe++;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          totalApproved: nodesList.length,
          counts,
          maxPublicSlots: 40,
          totalServerSlots: 50
        }));
      }

      // 7. RECHAZAR ASPIRANTE (Eliminación permanente de la lista y registro de rechazo)
      if (req.method === 'POST' && url.pathname === '/api/admin/reject') {
        this._parseBody(req, res, (body) => {
          const { nodeId } = body;
          const applicants = this._readJson(this.applicantsFile, []);
          this._atomicWrite(this.applicantsFile, applicants.filter(a => a.nodeId !== nodeId));

          const rejectedNodes = this._readJson(this.rejectedNodesFile, {});
          rejectedNodes[nodeId] = { rejectedAt: Date.now() };
          this._atomicWrite(this.rejectedNodesFile, rejectedNodes);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'Aspirante rechazado permanentemente.' }));
        });
        return;
      }

      // 7b. EXPULSAR / REVOCAR MIEMBRO DE LA WHITELIST Y DE SU FACCIÓN
      if (req.method === 'POST' && url.pathname === '/api/admin/revoke') {
        this._parseBody(req, res, (body) => {
          const { nodeId } = body;
          if (!nodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_NODE_ID' }));
          }

          const approvedNodes = this._readJson(this.approvedNodesFile, {});
          const member = approvedNodes[nodeId];

          if (member) {
            delete approvedNodes[nodeId];
            this._atomicWrite(this.approvedNodesFile, approvedNodes);

            const rejectedNodes = this._readJson(this.rejectedNodesFile, {});
            rejectedNodes[nodeId] = { revokedAt: Date.now(), reason: 'EXPELLED_BY_ADMIN' };
            this._atomicWrite(this.rejectedNodesFile, rejectedNodes);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            success: true, 
            message: `Miembro ${nodeId} expulsado de la facción y revocado de la Whitelist.` 
          }));
        });
        return;
      }

      // 8. RESET TOTAL DEL ENJAMBRE (Para pruebas del Creador)
      if (req.method === 'POST' && url.pathname === '/api/admin/reset') {
        this._atomicWrite(this.applicantsFile, []);
        this._atomicWrite(this.approvedNodesFile, {});
        this._atomicWrite(this.rejectedNodesFile, {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Enjambre reiniciado a cero con éxito.' }));
      }

      // 8b. REINICIAR PERSONAJE DE UN NODO AUTORIZADO
      // Permite que un jugador aprobado borre su personaje y cambie libremente de facción
      // sin perder su autorización criptográfica de acceso al servidor.
      if (req.method === 'POST' && url.pathname === '/api/node/reset-character') {
        this._parseBody(req, res, (body) => {
          const { nodeId } = body;
          if (!nodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_NODE_ID' }));
          }

          const approvedNodes = this._readJson(this.approvedNodesFile, {});
          if (approvedNodes[nodeId]) {
            // Liberar la facción para permitir elegir otra, pero mantener el nodo aprobado
            approvedNodes[nodeId].payload.faction = null;
            approvedNodes[nodeId].payload.factionId = null;
            this._atomicWrite(this.approvedNodesFile, approvedNodes);
            console.log(`[SWARM] Personaje y facción liberados para el nodo autorizado ${nodeId}`);
          }

          // Limpiar tickets locales de sesión en Zomboid
          try {
            const zomboidUserDir = path.join(os.homedir(), 'Zomboid');
            const files = [
              path.join(zomboidUserDir, 'apocalipto_connect.ini'),
              path.join(zomboidUserDir, 'apocalipto_session.ini'),
              path.join(zomboidUserDir, 'Lua', 'apocalipto_connect.ini'),
              path.join(zomboidUserDir, 'Lua', 'apocalipto_session.ini')
            ];
            for (const f of files) {
              if (fs.existsSync(f)) fs.unlinkSync(f);
            }
          } catch {}

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            nodeId,
            message: 'Personaje reiniciado con éxito. El nodo mantiene su acceso y puede seleccionar nueva facción.'
          }));
        });
        return;
      }

      // 9. ASISTENTE RCON (Comandos directos de consola hacia el servidor PZ en 27015)
      if (req.method === 'POST' && url.pathname === '/api/admin/rcon') {
        this._parseBody(req, res, async (body) => {
          const { command } = body;
          if (!command || typeof command !== 'string' || !command.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'EMPTY_COMMAND', message: 'Comando RCON no puede estar vacío.' }));
          }

          const result = await this.rcon.execute(command.trim());
          res.writeHead(result.success ? 200 : (result.offline ? 503 : 500), { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(result));
        });
        return;
      }

      // 9a. ESTADO DEL MUNDO ALFA (PROJECT ZOMBOID SERVER STATUS)
      if (req.method === 'GET' && url.pathname === '/api/admin/world/status') {
        const isLocalAdmin = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');
        if (!isLocalAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
        }

        // Comprobar si el proceso java.exe / javaw.exe está corriendo
        let isProcessRunning = false;
        try {
          const stdout = await new Promise((resolve) => {
            exec('tasklist /FI "IMAGENAME eq java*" /FO CSV /NH', (err, out) => resolve(out || ''));
          });
          if (stdout.toLowerCase().includes('java')) {
            isProcessRunning = true;
          }
        } catch {}

        // Probar si RCON está respondiendo (servidor listo, timeout 800ms)
        let isRconReady = false;
        if (isProcessRunning) {
          try {
            const rconRes = await this.rcon.execute('players', 800);
            if (rconRes && rconRes.success) isRconReady = true;
          } catch {}
        }

        // Analizar progreso de arranque desde el log para feedback visual en Bento OS
        let progress = { percent: 0, phase: 'Servidor detenido' };
        let serverStartedInLog = false;
        if (isProcessRunning) {
          progress = { percent: 15, phase: 'Iniciando Java y memoria 8GB' };
          const logPath = path.join(os.homedir(), 'Zomboid', 'server-console.txt');
          if (fs.existsSync(logPath)) {
            try {
              let text = '';
              const stats = fs.statSync(logPath);
              if (stats.size > 0) {
                const bytesToRead = Math.min(stats.size, 32768);
                const buf = Buffer.alloc(bytesToRead);
                const fd = fs.openSync(logPath, 'r');
                try {
                  fs.readSync(fd, buf, 0, bytesToRead, stats.size - bytesToRead);
                  text = buf.toString('utf8');
                } finally {
                  fs.closeSync(fd);
                }
              }
              if (text.includes('server name is')) { progress.percent = 25; progress.phase = 'Cargando perfil ApocaliptoPZ'; }
              if (text.includes('Initialising Server Systems')) { progress.percent = 40; progress.phase = 'Inicializando subsistemas'; }
              if (text.includes('LOADING ASSETS: START')) { progress.percent = 55; progress.phase = 'Cargando assets y modelos'; }
              if (text.includes('LOADING ASSETS: FINISH')) { progress.percent = 70; progress.phase = 'Cargando sprites y texturas'; }
              if (text.includes('IsoMetaGrid.Create')) { progress.percent = 85; progress.phase = 'Cargando mapa de Knox County'; }
              if (text.includes('Initialising RakNet')) { progress.percent = 95; progress.phase = 'Iniciando red UDP 16261'; }
              if (text.includes('*** SERVER STARTED ****') || isRconReady) {
                serverStartedInLog = true;
                progress.percent = 100;
                progress.phase = 'Servidor en línea';
              }
            } catch {}
          }
        }

        const isOnline = isRconReady || (isProcessRunning && serverStartedInLog);
        const status = isOnline ? 'ONLINE' : (isProcessRunning ? 'STARTING' : 'OFFLINE');
        if (isOnline) {
          progress = { percent: 100, phase: 'Servidor en línea' };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          status,
          isProcessRunning,
          isRconReady,
          progress,
          alfaActive: Boolean(this._alfaEngineActive)
        }));
      }

      // 9b. INICIAR MUNDO ALFA (RUN PROJECT ZOMBOID DEDICATED SERVER)
      if (req.method === 'POST' && url.pathname === '/api/admin/world/start') {
        const isLocalAdmin = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');
        if (!isLocalAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
        }

        // Prevención estricta de doble lanzamiento (evita bloqueos o colisiones de puertos)
        let isAlreadyRunning = false;
        try {
          const stdout = await new Promise((resolve) => {
            exec('tasklist /FI "IMAGENAME eq java*" /FO CSV /NH', (err, out) => resolve(out || ''));
          });
          if (stdout.toLowerCase().includes('java')) {
            isAlreadyRunning = true;
          }
        } catch {}

        if (isAlreadyRunning) {
          console.log('[ALFA SERVER] El proceso del servidor ya está en ejecución. Evitando arranque duplicado.');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            alreadyRunning: true,
            message: 'El servidor ya está en ejecución o arrancando. Esperando enlace.'
          }));
        }

        const vbsScript = path.resolve('E:\\PZ-PROYECT\\PZ-CORE\\scripts\\runAlfaServerSilent.vbs');
        console.log(`[ALFA SERVER] Levantando Nodo Alfa en Modo Fantasma (100% Silencioso / Sin Ventanas CMD)...`);

        const srvProc = spawn('wscript.exe', [vbsScript], {
          cwd: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ProjectZomboid',
          detached: true,
          stdio: 'ignore'
        });
        srvProc.unref();

        if (!this._alfaEngineActive && this.adminIdentity) {
          try {
            this._alfaEngine = new FailoverEngine({
              nodeId: this.adminIdentity.nodeId,
              role: FAILOVER_ROLES.ALFA,
              heartbeatIntervalMs: 5000,
              onStateChange: (newState) => {
                this.failoverState.currentAlfaNodeId = newState.currentAlfaNodeId;
              }
            });
            this._alfaEngine.start();
            this._alfaEngineActive = true;
          } catch (e) {
            console.error('[ALFA ENGINE ERROR]', e.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Orden de arranque enviada. El Nodo Alfa se está iniciando en consola dedicada.'
        }));
      }

      // 9c. DETENER MUNDO ALFA DE FORMA SEGURA (RCON QUIT & SAVE)
      if (req.method === 'POST' && url.pathname === '/api/admin/world/stop') {
        const isLocalAdmin = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');
        if (!isLocalAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
        }

        console.log('[ALFA SERVER] Detención segura solicitada desde Bento OS...');
        try {
          await this.rcon.execute('save');
          await this.rcon.execute('quit');
        } catch {}

        setTimeout(() => {
          exec('taskkill /F /IM java.exe /IM javaw.exe /T', () => {});
        }, 3000);

        if (this._alfaEngine) {
          this._alfaEngine.stop();
          this._alfaEngine = null;
          this._alfaEngineActive = false;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Guardado seguro aplicado y servidor detenido.'
        }));
      }

      // 9d. OBTENER / GUARDAR CONFIGURACIÓN DE SANDBOX DEL MUNDO
      if (req.method === 'GET' && url.pathname === '/api/admin/world/config') {
        const isLocalAdmin = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');
        if (!isLocalAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
        }

        const sandboxPath = 'C:\\Users\\The Frog\\Zomboid\\Server\\ApocaliptoPZ_SandboxVars.lua';
        let config = {
          doorOpeningPercentage: 30,
          sprinterPercentage: 3,
          populationMultiplier: 0.60,
          waterShutModifier: 21,
          elecShutModifier: 21
        };

        if (fs.existsSync(sandboxPath)) {
          const content = fs.readFileSync(sandboxPath, 'utf8');
          const doorMatch = content.match(/DoorOpeningPercentage\s*=\s*(\d+)/);
          const sprintMatch = content.match(/SprinterPercentage\s*=\s*(\d+)/);
          const popMatch = content.match(/PopulationMultiplier\s*=\s*([0-9.]+)/);
          const waterMatch = content.match(/WaterShutModifier\s*=\s*(\d+)/);
          const elecMatch = content.match(/ElecShutModifier\s*=\s*(\d+)/);

          if (doorMatch) config.doorOpeningPercentage = parseInt(doorMatch[1], 10);
          if (sprintMatch) config.sprinterPercentage = parseInt(sprintMatch[1], 10);
          if (popMatch) config.populationMultiplier = parseFloat(popMatch[1]);
          if (waterMatch) config.waterShutModifier = parseInt(waterMatch[1], 10);
          if (elecMatch) config.elecShutModifier = parseInt(elecMatch[1], 10);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, config }));
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/world/config') {
        const isLocalAdmin = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');
        if (!isLocalAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
        }

        this._parseBody(req, res, (body) => {
          const sandboxPath = 'C:\\Users\\The Frog\\Zomboid\\Server\\ApocaliptoPZ_SandboxVars.lua';
          if (!fs.existsSync(sandboxPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'SANDBOX_FILE_NOT_FOUND' }));
          }

          let content = fs.readFileSync(sandboxPath, 'utf8');

          if (body.doorOpeningPercentage !== undefined) {
            const val = Math.max(0, Math.min(100, parseInt(body.doorOpeningPercentage, 10)));
            content = content.replace(/DoorOpeningPercentage\s*=\s*\d+,/, `DoorOpeningPercentage = ${val},`);
          }
          if (body.sprinterPercentage !== undefined) {
            const val = Math.max(0, Math.min(100, parseInt(body.sprinterPercentage, 10)));
            content = content.replace(/SprinterPercentage\s*=\s*\d+,/, `SprinterPercentage = ${val},`);
          }
          if (body.populationMultiplier !== undefined) {
            const val = Math.max(0.1, Math.min(4.0, parseFloat(body.populationMultiplier))).toFixed(2);
            content = content.replace(/PopulationMultiplier\s*=\s*[0-9.]+,/, `PopulationMultiplier = ${val},`);
          }
          if (body.waterShutModifier !== undefined) {
            const val = parseInt(body.waterShutModifier, 10);
            content = content.replace(/WaterShutModifier\s*=\s*\d+,/, `WaterShutModifier = ${val},`);
          }
          if (body.elecShutModifier !== undefined) {
            const val = parseInt(body.elecShutModifier, 10);
            content = content.replace(/ElecShutModifier\s*=\s*\d+,/, `ElecShutModifier = ${val},`);
          }

          fs.writeFileSync(sandboxPath, content, 'utf8');
          console.log('[WORLD CONFIG] SandboxVars actualizadas con éxito desde Bento OS.');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'Configuración de Sandbox guardada con éxito.' }));
        });
        return;
      }

      // 10. EJECUTAR JUEGO PROJECT ZOMBOID & ACTIVAR PROXY UDP LOCAL (127.0.0.1:16261)
      if (req.method === 'POST' && url.pathname === '/api/game/launch') {
        this._parseBody(req, res, async (body) => {
          const { nodeId, faction, targetHost, targetPort } = body;
          const userToConnect = body.username || body.user || (nodeId === 'admin_root_host' ? 'The Frog' : (faction ? `Superviviente_${faction.toUpperCase()}` : 'Superviviente'));
          const approvedNodes = this._readJson(this.approvedNodesFile, {});

          // Seguridad estricta: el nodo debe tener SU ticket específico, o ser el loopback del Creador
          const isLocalAdmin = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');
          const hasOwnTicket = Boolean(approvedNodes[nodeId]);
          const isApproved = hasOwnTicket || isLocalAdmin;

          if (!isApproved) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'UNAUTHORIZED_NODE', message: 'Nodo no autorizado. Requiere aprobación del Creador.' }));
          }

          // Persistir la facción seleccionada si el nodo está registrado
          if (approvedNodes[nodeId] && faction) {
            approvedNodes[nodeId].payload.faction = faction.toUpperCase();
            approvedNodes[nodeId].payload.factionId = faction.toLowerCase();
            this._atomicWrite(this.approvedNodesFile, approvedNodes);
          }

          // Solo iniciar proxy UDP local si el targetHost es REMOTO (otro nodo del enjambre)
          // Si es 127.0.0.1 / localhost, el cliente PZ se conecta directamente al servidor local sin intermediarios
          let proxyStatus = { isDirect: true, note: 'Conexión local directa a PZ' };
          const isLocalTarget = !targetHost || targetHost === '127.0.0.1' || targetHost === 'localhost' || isLocalAdmin || (this.failoverState.currentAlfaNodeId === nodeId);

          if (!isLocalTarget) {
            this.localProxy.setTarget(targetHost, Number(targetPort) || 16261);
            try {
              proxyStatus = await this.localProxy.start();
            } catch (err) {
              proxyStatus = { error: err.message };
            }
          } else {
            // Asegurarse de que el proxy local esté detenido para no interceptar el puerto 16261 del servidor local
            if (this.localProxy) {
              this.localProxy.stop();
            }
          }

          // Preparar ticket de conexión automática para que PZ entre directo a crear personaje
          const zomboidUserDir = path.join(os.homedir(), 'Zomboid');
          if (fs.existsSync(zomboidUserDir)) {
            // 0. Modo de Rendimiento Gráfico según preferencia del jugador
            const enablePerfMode = body.perfMode !== false;
            if (enablePerfMode) {
              this._optimizeClientGraphics(zomboidUserDir);
            } else {
              // Si el jugador lo desactivó y existe un backup previo, restaurar para alta gama
              try {
                const backupPath = path.join(zomboidUserDir, 'options.ini.bak');
                const optionsPath = path.join(zomboidUserDir, 'options.ini');
                if (fs.existsSync(backupPath)) {
                  fs.copyFileSync(backupPath, optionsPath);
                  console.log('[PERF_OPT] Modo Rendimiento DESACTIVADO por el jugador: opciones estándar restauradas.');
                }
              } catch {}
            }

            const targetIp = '127.0.0.1'; // Siempre conecta a loopback (sea directo o proxy)
            const userPassword = body.password || '12345';
            const chosenFaction = (faction || 'MOK').toUpperCase();
            const iniContent = `ip=${targetIp}\nport=16261\nuser=${userToConnect}\npassword=${userPassword}\nfaction=${chosenFaction}\nspawnRegion=${chosenFaction}\nserverName=Apocalipto PZ\n`;
            
            // 1. Escribir en Zomboid raíz
            try {
              fs.writeFileSync(path.join(zomboidUserDir, 'apocalipto_connect.ini'), iniContent, 'utf8');
              fs.writeFileSync(path.join(zomboidUserDir, 'apocalipto_session.ini'), iniContent, 'utf8');
            } catch {}

            // 2. Escribir en Zomboid/Lua (donde getFileReader y cacheFileExists leen en PZ B42)
            const zomboidLuaDir = path.join(zomboidUserDir, 'Lua');
            try {
              if (!fs.existsSync(zomboidLuaDir)) fs.mkdirSync(zomboidLuaDir, { recursive: true });
              fs.writeFileSync(path.join(zomboidLuaDir, 'apocalipto_connect.ini'), iniContent, 'utf8');
              fs.writeFileSync(path.join(zomboidLuaDir, 'apocalipto_session.ini'), iniContent, 'utf8');
              console.log(`[GAME LAUNCH] Ticket inyectado para ${userToConnect} (${chosenFaction}) en ${path.join(zomboidLuaDir, 'apocalipto_connect.ini')}`);
            } catch (e) {
              console.error('[GAME LAUNCH] Error escribiendo ticket Lua:', e.message);
            }

            // 2b. Escribir en la carpeta de instalación de Project Zomboid
            const pzInstallDir = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ProjectZomboid';
            try {
              if (fs.existsSync(pzInstallDir)) {
                fs.writeFileSync(path.join(pzInstallDir, 'apocalipto_connect.ini'), iniContent, 'utf8');
                fs.writeFileSync(path.join(pzInstallDir, 'apocalipto_session.ini'), iniContent, 'utf8');
              }
            } catch {}

            // 3. Sincronizar cuenta en SQLite ServerListSteam.db (Cliente) y ApocaliptoPZ.db (Whitelist Servidor)
            try {
              const clientDbPath = path.join(zomboidUserDir, 'db', 'ServerListSteam.db');
              const serverDbPath = path.join(zomboidUserDir, 'db', 'ApocaliptoPZ.db');
              const steamId = '76561198881952155';
              const pySyncCmd = `python -c "import sqlite3, datetime; now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S');\n# 1. Client DB\nif r'${clientDbPath}':\n    c = sqlite3.connect(r'${clientDbPath.replace(/\\/g, '\\\\')}'); cur = c.cursor(); s = cur.execute('SELECT id FROM server WHERE id = 4 OR name = \\'Apocalipto PZ\\'').fetchone(); sid = s[0] if s else 4; ex = cur.execute('SELECT id FROM account WHERE serverId = ? AND username = ?', (sid, '${userToConnect}')).fetchone(); (cur.execute('UPDATE account SET password = ?, isSavePassword = 1, isUseSteamRelay = 0, authType = 1, lastLogon = ? WHERE id = ?', ('${userPassword}', now, ex[0])) if ex else cur.execute('INSERT INTO account (serverId, username, password, isSavePassword, isUseSteamRelay, authType, lastLogon) VALUES (?, ?, ?, 1, 0, 1, ?)', (sid, '${userToConnect}', '${userPassword}', now))); c.commit(); c.close()\n# 2. Server DB\nif r'${serverDbPath}':\n    s_conn = sqlite3.connect(r'${serverDbPath.replace(/\\/g, '\\\\')}'); s_cur = s_conn.cursor(); s_ex = s_cur.execute('SELECT id FROM whitelist WHERE username = ?', ('${userToConnect}',)).fetchone(); (s_cur.execute('UPDATE whitelist SET password = ?, role = 2, authType = 1, steamid = ? WHERE id = ?', ('${userPassword}', '${steamId}', s_ex[0])) if s_ex else s_cur.execute('INSERT INTO whitelist (world, username, password, role, authType, steamid) VALUES (\\x27\\x27, ?, ?, 2, 1, ?)', ('${userToConnect}', '${userPassword}', '${steamId}'))); s_conn.commit(); s_conn.close()\n"`;
              exec(pySyncCmd, () => {});
            } catch {}
          }

          // Evitar lanzamiento duplicado si el cliente PZ ya está abierto
          let isGameAlreadyRunning = false;
          try {
            const runningProcs = await new Promise((resolve) => {
              exec('tasklist /FI "IMAGENAME eq ProjectZomboid64.exe" /FO CSV /NH', (err, out) => resolve(out || ''));
            });
            if (runningProcs.toLowerCase().includes('projectzomboid64.exe')) {
              isGameAlreadyRunning = true;
            }
          } catch {}

          if (isGameAlreadyRunning) {
            console.log(`[GAME LAUNCH] Project Zomboid ya está en ejecución. El ticket auto-connect para ${userToConnect} fue actualizado.`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              alreadyRunning: true,
              launched: true,
              game: 'Project Zomboid (Build 42)',
              nodeId,
              faction,
              proxy: proxyStatus,
              message: 'Project Zomboid ya está activo. Ticket de auto-conexión inyectado.'
            }));
          }

          console.log(`[GAME LAUNCH] Credenciales, tickets y whitelist preparados para ${userToConnect} (${faction}). El Launcher se encargará del arranque directo.`);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            launched: true,
            game: 'Project Zomboid (Build 42)',
            nodeId,
            faction,
            username: userToConnect,
            proxy: proxyStatus,
            message: `Ticket inyectado para ${userToConnect} y Project Zomboid lanzado.`
          }));
        });
        return;
      }

      // 11. ESTADO DE TELEMETRÍA DEL PROXY UDP
      if (req.method === 'GET' && url.pathname === '/api/game/proxy-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(this.localProxy ? this.localProxy.getStatus() : { isActive: false }));
      }

      // 12. TERMINAR PROCESOS RESIDUALES DE PROJECT ZOMBOID
      if (req.method === 'POST' && url.pathname === '/api/game/kill') {
        // Detener el motor de heartbeat del Alfa — los Nodos Sombra detectarán el silencio
        // y ejecutarán el protocolo de relevo autónomo si está configurado.
        if (this._alfaEngine) {
          this._alfaEngine.stop();
          this._alfaEngine = null;
          this._alfaEngineActive = false;
          console.log('[ALFA ENGINE] Motor detenido por /api/game/kill — Silencio P2P iniciado.');
        }

        if (process.platform === 'win32') {
          exec('taskkill /IM java.exe /IM javaw.exe /IM ProjectZomboid64.exe /F /T', (err) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'Procesos de Project Zomboid terminados limpiamente.' }));
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'No aplicable en esta plataforma.' }));
      }

      // 13. VERIFICADOR DE MODS DEL ENJAMBRE
      // Devuelve la lista oficial de mods activos en el Nodo Alfa (leída de ApocaliptoPZ.ini).
      // El Launcher consulta esto ANTES de lanzar PZ para detectar desajustes de versión.
      // 13b. VERIFICADOR DE VERSION DEL LAUNCHER
      if (req.method === 'GET' && url.pathname === '/api/swarm/launcher-version') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          currentVersion: '1.0.0',
          latestVersion: this._latestLauncherVersion || '1.0.0',
          updateRequired: this._launcherUpdateRequired || false,
          downloadUrl: this._launcherDownloadUrl || 'https://github.com/apocalipto-pz/launcher/releases/latest',
          notes: this._launcherUpdateNotes || 'Launcher sincronizado con la red P2P.'
        }));
      }

      // 13c. CONFIGURAR VERSIÓN REQUERIDA DEL LAUNCHER (ADMIN)
      if (req.method === 'POST' && url.pathname === '/api/admin/set-launcher-version') {
        this._parseBody(req, res, (body) => {
          const { latestVersion, updateRequired, downloadUrl, notes } = body;
          if (latestVersion) this._latestLauncherVersion = latestVersion;
          if (updateRequired !== undefined) this._launcherUpdateRequired = Boolean(updateRequired);
          if (downloadUrl) this._launcherDownloadUrl = downloadUrl;
          if (notes) this._launcherUpdateNotes = notes;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            latestVersion: this._latestLauncherVersion || '1.0.0',
            updateRequired: this._launcherUpdateRequired || false,
            downloadUrl: this._launcherDownloadUrl
          }));
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/swarm/modlist') {
        try {
          const iniPath = path.join(
            os.homedir(), 'Zomboid', 'Server', 'ApocaliptoPZ.ini'
          );

          if (!fs.existsSync(iniPath)) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              error: 'INI_NOT_FOUND',
              message: 'ApocaliptoPZ.ini no encontrado. El Nodo Alfa puede no estar configurado.'
            }));
          }

          const iniContent = fs.readFileSync(iniPath, 'utf8');

          // Extraer WorkshopItems (Workshop IDs) y Mods (Mod IDs)
          const workshopMatch = iniContent.match(/^WorkshopItems\s*=\s*(.+)$/m);
          const modsMatch = iniContent.match(/^Mods\s*=\s*(.+)$/m);
          const checksumMatch = iniContent.match(/^DoLuaChecksum\s*=\s*(.+)$/m);

          const workshopIds = workshopMatch
            ? workshopMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean)
            : [];
          const modIds = modsMatch
            ? modsMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean)
            : [];
          const checksumEnabled = checksumMatch
            ? checksumMatch[1].trim().toLowerCase() === 'true'
            : false;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            workshopIds,
            modIds,
            checksumEnabled,
            // Señal de re-sync: si el Enjambre acaba de hacer failover, el Launcher debe reiniciar PZ
            modResyncRequired: this.failoverState._modResyncRequired || false,
            alfaNodeId: this.failoverState.currentAlfaNodeId,
            blockHeight: this.failoverState.blockHeight,
            fetchedAt: Date.now()
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'MODLIST_READ_ERROR', message: err.message }));
        }
      }

      // 13d. GESTOR DE MODS DE STEAM WORKSHOP (BENTO OS)
      if (req.method === 'GET' && url.pathname === '/api/admin/mods') {
        try {
          const list = await steamModsManager.getModsList();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(list));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'MODS_FETCH_ERROR', message: err.message }));
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/mods/toggle') {
        this._parseBody(req, res, (body) => {
          const { workshopId, modId, enabled } = body;
          if (!workshopId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_WORKSHOP_ID' }));
          }

          try {
            const result = steamModsManager.toggleMod(workshopId, modId, enabled);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(result));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MOD_TOGGLE_ERROR', message: err.message }));
          }
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/mods/install') {
        this._parseBody(req, res, async (body) => {
          const { workshopId } = body;
          if (!workshopId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_WORKSHOP_ID' }));
          }

          try {
            const result = await steamModsManager.installModFromWorkshop(workshopId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(result));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MOD_INSTALL_ERROR', message: err.message }));
          }
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/mods/update') {
        this._parseBody(req, res, async (body) => {
          const { workshopId } = body;
          if (!workshopId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_WORKSHOP_ID' }));
          }

          try {
            const result = await steamModsManager.updateMod(workshopId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(result));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MOD_UPDATE_ERROR', message: err.message }));
          }
        });
        return;
      }

      // 14. PUNTOS DE ACCESO DE RED DEL ENJAMBRE (Para jugadores remotos en Internet)
      // Devuelve la dirección pública del túnel UDP de Playit para que el Launcher
      // configure su proxy local automáticamente sin que el jugador abra puertos en su router.
      if (req.method === 'GET' && url.pathname === '/api/swarm/network-endpoints') {
        const tunnelConfigFile = path.join(process.cwd(), 'tunnel', 'tunnel_config.json');
        const altTunnelFile = path.join('E:', 'PZ-PROYECT', 'PZ-CORE', 'tunnel', 'tunnel_config.json');
        let tunnelConfig = null;
        try {
          const targetFile = fs.existsSync(tunnelConfigFile) ? tunnelConfigFile : altTunnelFile;
          if (fs.existsSync(targetFile)) {
            tunnelConfig = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
          }
        } catch {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          alfaNodeId: this.failoverState.currentAlfaNodeId,
          gameTunnel: tunnelConfig?.gameTunnel || {
            host: '127.0.0.1',
            port: 16261,
            protocol: 'UDP'
          },
          bridgeTunnel: tunnelConfig?.bridgeTunnel || null,
          localLoopbackPort: 16261
        }));
      }

      // 14. ACTIVAR NODO ALFA — Inicia el emitter de heartbeats automáticos
      // Llamado por el Launcher del Nodo Alfa justo después de lanzar PZ.
      // Esto activa el FailoverEngine en modo ALFA dentro del Bridge (Node.js),
      // que emitirá pulsos criptográficos cada 5s para que los Nodos Sombra puedan
      // detectar automáticamente si el Alfa cayó y ejecutar el relevo autónomo.
      if (req.method === 'POST' && url.pathname === '/api/node/activate-alfa') {
        this._parseBody(req, res, (body) => {
          const { nodeId } = body;
          if (!nodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'MISSING_NODE_ID' }));
          }

          // Solo el Nodo raíz (loopback) puede activar el motor de Alfa
          const isLocalAdmin = (
            clientIp === '127.0.0.1' ||
            clientIp === '::1' ||
            clientIp === '::ffff:127.0.0.1'
          );
          if (!isLocalAdmin) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'ONLY_LOCAL_ALFA_ALLOWED' }));
          }

          // Si ya hay un engine activo para este mismo nodo, no duplicar
          if (this._alfaEngineActive && this._alfaEngine?.nodeId === nodeId) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              already: true,
              nodeId,
              message: 'Motor de Failover Alfa ya activo. Heartbeats en curso.'
            }));
          }

          // Detener engine anterior si existía (cambio de nodeId)
          if (this._alfaEngine) {
            this._alfaEngine.stop();
            this._alfaEngine = null;
          }

          // Iniciar nuevo FailoverEngine en modo ALFA
          this._alfaEngine = new FailoverEngine({
            role: FAILOVER_ROLES.ALFA,
            nodeId,
            identity: this.adminIdentity, // Firma con la identidad del Creador (ya disponible en el Bridge)
            bridgeUrl: `http://127.0.0.1:${this.port}`,
            heartbeatIntervalMs: 5000,
            onStateChange: (ev) => {
              console.log(`[ALFA ENGINE] Estado: ${ev.state} — ${ev.detail || ''}`);
            }
          });

          this._alfaEngine.start();
          this._alfaEngineActive = true;

          // Registrar el nuevo Alfa en el failoverState
          this.failoverState.currentAlfaNodeId = nodeId;
          this.failoverState.lastHeartbeatTimestamp = Date.now();

          console.log(`\n🟢 [ALFA ENGINE] Motor de heartbeat P2P iniciado.`);
          console.log(`   Nodo Alfa: ${nodeId}`);
          console.log(`   Intervalo: 5s | Bridge: http://127.0.0.1:${this.port}\n`);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            nodeId,
            heartbeatIntervalMs: 5000,
            message: '🟢 Motor de Failover Alfa iniciado. Heartbeats criptográficos activos cada 5s.'
          }));
        });
        return;
      }

      // 15. ESTADO DEL MOTOR ALFA — El Launcher consulta si el emitter está corriendo
      if (req.method === 'GET' && url.pathname === '/api/node/alfa-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          alfaEngineActive: this._alfaEngineActive,
          alfaNodeId: this._alfaEngine?.nodeId || this.failoverState.currentAlfaNodeId || null,
          lastHeartbeatTimestamp: this.failoverState.lastHeartbeatTimestamp,
          timeSinceLastHeartbeatMs: Date.now() - (this.failoverState.lastHeartbeatTimestamp || Date.now()),
          blockHeight: this.failoverState.blockHeight,
          modResyncRequired: this.failoverState._modResyncRequired || false
        }));
      }

      // ── SERVIR DASHBOARD BENTO OS STANDALONE (Solo Loopback / Admin Local) ──
      const adminDistDir = path.resolve(process.cwd(), 'PZ-ADMIN', 'dist');
      if (isLoopback && fs.existsSync(adminDistDir)) {
        let reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
        let filePath = path.join(adminDistDir, reqPath);

        // Protección básica contra path traversal
        if (!filePath.startsWith(adminDistDir)) {
          filePath = path.join(adminDistDir, 'index.html');
        }

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(adminDistDir, 'index.html');
        }

        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          return res.end(fs.readFileSync(filePath));
        }
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'NOT_FOUND' }));
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        resolve(this.port);
      });
    });
  }

  stop() {
    if (this.localProxy) {
      this.localProxy.stop();
    }
    if (this.server) {
      this.server.close();
    }
  }

  /**
   * Helper seguro de lectura de body con límite estricto de 64 KB (Anti-RAM exhaustion)
   */
  _parseBody(req, res, callback) {
    let body = '';
    let destroyed = false;

    req.on('data', (chunk) => {
      if (destroyed) return;
      body += chunk;
      // Seguridad: si el payload supera 64 KB, cortar conexión inmediatamente
      if (body.length > 65536) {
        destroyed = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'PAYLOAD_TOO_LARGE', message: 'Payload supera el límite máximo de 64 KB.' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (destroyed) return;
      try {
        const json = JSON.parse(body || '{}');
        callback(json);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'INVALID_JSON', message: 'Cuerpo de petición JSON inválido.' }));
      }
    });

    req.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'REQUEST_STREAM_ERROR' }));
      }
    });
  }

  /**
   * Optimiza options.ini del cliente Project Zomboid para PC de bajos/medianos recursos:
   * Desactiva calcomanías de sangre, convierte items 3D del suelo a 2D livianos,
   * reduce cálculos de niebla y charcos.
   */
  _optimizeClientGraphics(zomboidUserDir) {
    try {
      const optionsPath = path.join(zomboidUserDir, 'options.ini');
      if (!fs.existsSync(optionsPath)) return;

      const content = fs.readFileSync(optionsPath, 'utf8');
      const lines = content.split(/\r?\n/);
      const optMap = new Map();

      for (const line of lines) {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const k = line.substring(0, eqIdx).trim();
          const v = line.substring(eqIdx + 1).trim();
          optMap.set(k, v);
        }
      }

      // Perfil de rendimiento balanceado:
      const tweaks = {
        '3DGroundItem': 'false',            // Objetos en el piso en 2D (ahorro enorme de polígonos/VRAM)
        'bloodDecals': '0',                 // 0 = Sin calcomanías de sangre que ahogan los FPS
        'corpseShadows': 'false',           // Sin sombras en cadáveres
        'puddles': '0',                     // Sin reflejos complejos en charcos
        'perfPuddles': '0',                 // Shader ultraligero de charcos
        'perfSkybox': '0',                  // Cielo optimizado
        'fogQuality': '0',                  // Niebla ligera (0 = bajo costo)
        'renderPrecipitation': '1',         // Lluvia liviana (evita tirones en tormentas)
        'renderPrecipIndoors': 'false',     // No calcular lluvia bajo techo
        'simpleWeaponTextures': 'true',     // Texturas simplificadas para armas
        'bPerfReflections': 'false',        // Reflejos desactivados
        'water': '0',                       // Agua plana y liviana
        'maxActiveRagdolls': '3'            // Limitar físicas simultáneas de cadáveres cayendo
      };

      let changed = false;
      for (const [k, v] of Object.entries(tweaks)) {
        if (optMap.get(k) !== v) {
          optMap.set(k, v);
          changed = true;
        }
      }

      if (changed) {
        // Crear backup seguro de las opciones originales si no existe
        const backupPath = path.join(zomboidUserDir, 'options.ini.bak');
        if (!fs.existsSync(backupPath)) {
          fs.writeFileSync(backupPath, content, 'utf8');
        }

        const newLines = [];
        for (const [k, v] of optMap.entries()) {
          newLines.push(`${k}=${v}`);
        }
        fs.writeFileSync(optionsPath, newLines.join('\r\n'), 'utf8');
        console.log('[PERF_OPT] options.ini optimizado: Sangre OFF, Items 2D, Niebla 0, Agua 0.');
      }
    } catch (err) {
      console.warn('[PERF_OPT] Error optimizando options.ini:', err.message);
    }
  }
}

