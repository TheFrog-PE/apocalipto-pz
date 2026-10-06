import { signPayload, verifySignature } from '../crypto/keys.js';

/**
 * Motor Autónomo de Heartbeat y Failover P2P (FailoverEngine)
 * Garantiza que si el Nodo Alfa cae (corte de luz, crash o desconexión),
 * el Nodo Sombra tome el control en menos de 15 segundos sin pérdida del mundo.
 */

export const FAILOVER_ROLES = {
  ALFA: 'ALFA',
  SOMBRA: 'SOMBRA',
  SUPERVIVIENTE: 'SUPERVIVIENTE'
};

export const FAILOVER_STATES = {
  IDLE: 'IDLE',
  MONITORING: 'MONITORING',
  ALERT: 'ALERT',          // 1 latido perdido (5s)
  CRITICAL: 'CRITICAL',    // 2 latidos perdidos (10s)
  PROMOTED: 'PROMOTED',    // 3 latidos perdidos -> Sombra promovido a nuevo Alfa
};

export class FailoverEngine {
  constructor(options = {}) {
    this.role = options.role || FAILOVER_ROLES.SOMBRA;
    this.nodeId = options.nodeId;
    this.identity = options.identity; // { nodeId, privateKey, publicKey }
    this.bridgeUrl = (options.bridgeUrl || 'http://127.0.0.1:19842').replace(/\/$/, '');
    // Cadencia táctica de 5 segundos:
    // Alfa emite cada 1.5s. Si 2 latidos fallan consecutivamente (~3.5s a 4.5s de silencio),
    // el Sombra ejecuta el relevo autónomo de inmediato para completar todo el ciclo al segundo 5.
    this.heartbeatIntervalMs = options.heartbeatIntervalMs || 1500;
    this.maxMissedHeartbeats = options.maxMissedHeartbeats || 2;
    this.onPromote = options.onPromote || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.state = FAILOVER_STATES.IDLE;
    this.missedCount = 0;
    this.lastAlfaHeartbeat = null;
    this.currentAlfaNodeId = null;
    this.timer = null;
    this.active = false;
  }

  /**
   * Inicia el ciclo de vida del motor según el rol asignado
   */
  start() {
    if (this.active) return;
    this.active = true;

    if (this.role === FAILOVER_ROLES.ALFA) {
      this._startAlfaHeartbeatEmitter();
    } else {
      this._startSombraMonitor();
    }
  }

  /**
   * Detiene el motor y limpia temporizadores
   */
  stop() {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state = FAILOVER_STATES.IDLE;
  }

  /**
   * CICLO DEL NODO ALFA: Emite pulsos criptográficos de vida cada 5s
   */
  _startAlfaHeartbeatEmitter() {
    this.state = FAILOVER_STATES.MONITORING;
    this._emitHeartbeat();

    this.timer = setInterval(() => {
      if (!this.active) return;
      this._emitHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  async _emitHeartbeat() {
    try {
      // 1. Obtener estado del último bloque guardado
      let blockHeight = 0;
      let blockHash = 'genesis';
      try {
        const scRes = await fetch(`${this.bridgeUrl}/api/savechain/latest`, { signal: AbortSignal.timeout(2000) });
        if (scRes.ok) {
          const scData = await scRes.json();
          blockHeight = scData.height || 0;
          blockHash = scData.latestBlockHash || 'genesis';
        }
      } catch {}

      // 2. Construir payload de latido
      const payload = {
        alfaNodeId: this.nodeId,
        timestamp: Date.now(),
        blockHeight,
        blockHash,
        gameStatus: 'RUNNING'
      };

      // 3. Firma digital Ed25519 del Alfa
      const signature = this.identity?.privateKey
        ? signPayload(JSON.stringify(payload), this.identity.privateKey)
        : `sig_alfa_${Date.now()}`;

      // 4. Enviar al Bridge
      await fetch(`${this.bridgeUrl}/api/failover/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          signature,
          publicKey: this.identity?.publicKey || null
        }),
        signal: AbortSignal.timeout(3000)
      });
    } catch {}
  }

  /**
   * CICLO DEL NODO SOMBRA: Monitorea latidos del Alfa
   */
  _startSombraMonitor() {
    this.state = FAILOVER_STATES.MONITORING;
    this.missedCount = 0;

    const check = async () => {
      if (!this.active) return;
      await this._verifyAlfaStatus();

      // Ajuste de cadencia: si estamos en alerta o crítico, acelerar el muestreo a 1s
      const nextDelay = (this.state === FAILOVER_STATES.ALERT || this.state === FAILOVER_STATES.CRITICAL)
        ? 1000
        : this.heartbeatIntervalMs;

      if (this.active && this.state !== FAILOVER_STATES.PROMOTED) {
        this.timer = setTimeout(check, nextDelay);
      }
    };

    this.timer = setTimeout(check, 1000);
  }

  async _verifyAlfaStatus() {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/failover/status`, {
        signal: AbortSignal.timeout(3000)
      });

      if (!res.ok) {
        this._recordMissedHeartbeat('BRIDGE_UNRESPONSIVE');
        return;
      }

      const status = await res.json();
      const now = Date.now();
      const lastPing = status.lastHeartbeatTimestamp || 0;
      const ageMs = now - lastPing;

      this.currentAlfaNodeId = status.currentAlfaNodeId;

      // Un latido es válido si ocurrió hace menos de (intervalo * 1.8) ms
      const isFresh = lastPing > 0 && ageMs < (this.heartbeatIntervalMs * 1.8);

      if (isFresh) {
        // Alfa está vivo y sano
        this.missedCount = 0;
        this.lastAlfaHeartbeat = status;
        if (this.state !== FAILOVER_STATES.MONITORING) {
          this._setState(FAILOVER_STATES.MONITORING, `Latidos del Alfa restaurados (${ageMs}ms ago)`);
        }
      } else {
        this._recordMissedHeartbeat(`Latido retrasado (${Math.round(ageMs / 1000)}s sin respuesta)`);
      }
    } catch (err) {
      this._recordMissedHeartbeat(`Error de red con el bridge: ${err.message}`);
    }
  }

  _recordMissedHeartbeat(reason) {
    this.missedCount++;

    if (this.missedCount >= this.maxMissedHeartbeats) {
      this._executePromotion();
    } else if (this.missedCount === 1) {
      this._setState(FAILOVER_STATES.ALERT, `[ALERTA NODO SOMBRA] Latido 1/${this.maxMissedHeartbeats} perdido: ${reason}`);
    } else {
      this._setState(FAILOVER_STATES.CRITICAL, `[CRÍTICO NODO SOMBRA] Latido ${this.missedCount}/${this.maxMissedHeartbeats} perdido: ${reason}`);
    }
  }

  _setState(newState, detail) {
    this.state = newState;
    this.onStateChange({
      state: newState,
      missedCount: this.missedCount,
      detail,
      timestamp: Date.now()
    });
  }

  /**
   * PROTOCOLO DE PROMOCIÓN A NODO ALFA
   */
  async _executePromotion() {
    this._setState(FAILOVER_STATES.PROMOTED, '🚨 NODO ALFA CONFIRMADO CAÍDO. INICIANDO PROTOCOLO DE RELEVO AUTÓNOMO.');

    // 1. Crear reclamo criptográfico de promoción
    const claimPayload = {
      promotedNodeId: this.nodeId,
      previousAlfaNodeId: this.currentAlfaNodeId,
      timestamp: Date.now(),
      reason: `ALFA_UNRESPONSIVE_${this.missedCount}_MISSED_HEARTBEATS`,
      claimedRole: FAILOVER_ROLES.ALFA
    };

    const signature = this.identity?.privateKey
      ? signPayload(JSON.stringify(claimPayload), this.identity.privateKey)
      : `sig_promote_${Date.now()}`;

    // 2. Transmitir el reclamo al Bridge
    try {
      const res = await fetch(`${this.bridgeUrl}/api/failover/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimPayload,
          signature,
          publicKey: this.identity?.publicKey || null
        }),
        signal: AbortSignal.timeout(4000)
      });

      const data = await res.json().catch(() => ({}));

      // 3. Asumir el nuevo rol de Alfa
      this.role = FAILOVER_ROLES.ALFA;
      this.missedCount = 0;

      // 4. Invocar hook de promoción (para rebind de sockets y arranque del host)
      this.onPromote({
        newAlfaNodeId: this.nodeId,
        previousAlfaNodeId: this.currentAlfaNodeId,
        claimData: data,
        timestamp: Date.now()
      });

      // 5. Iniciar emisión de latidos como el nuevo Alfa oficial
      this._startAlfaHeartbeatEmitter();
    } catch (err) {
      console.error('[Failover] Error transmitiendo reclamo de promoción:', err.message);
    }
  }
}
