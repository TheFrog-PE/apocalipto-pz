/**
 * PlayitGameRelay - Enlace P2P de Alta Fidelidad para Project Zomboid (Build 42)
 * 
 * Problema resuelto:
 * Playit.gg reenvía el tráfico del túnel de juego (rails-switching.tun.ply.gg:63854)
 * al puerto local 16261. Sin embargo, en Project Zomboid Build 42 el motor de red
 * RakNet escucha exclusivamente en el puerto 16262.
 * 
 * Esta clase escucha en 127.0.0.1:16261 y asocia a cada cliente un socket dedicado
 * para reenviar el tráfico a 127.0.0.1:16262 y retornar las respuestas de RakNet
 * de manera 100% aislada, transparente y concurrente.
 */

import dgram from 'node:dgram';

export class PlayitGameRelay {
  constructor(options = {}) {
    this.listenPort = options.listenPort || 16261;
    this.listenHost = options.listenHost || '127.0.0.1';
    this.targetPort = options.targetPort || 16262;
    this.targetHost = options.targetHost || '127.0.0.1';

    this.mainSocket = null;
    this.sessions = new Map(); // key: 'ip:port' -> { socket, lastActive }
    this.cleanupTimer = null;
    this.stats = {
      packetsFromClients: 0,
      packetsFromServer: 0,
      activeSessions: 0,
      startedAt: null
    };
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.mainSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        this.mainSocket.on('message', (msg, rinfo) => {
          this.stats.packetsFromClients++;
          const clientKey = `${rinfo.address}:${rinfo.port}`;
          let session = this.sessions.get(clientKey);

          if (!session) {
            // Crear socket dedicado para este jugador
            const dedicatedSocket = dgram.createSocket({ type: 'udp4' });
            
            dedicatedSocket.on('message', (serverReply) => {
              this.stats.packetsFromServer++;
              // Retornar respuesta al cliente a través del socket principal
              this.mainSocket.send(serverReply, rinfo.port, rinfo.address, (err) => {
                if (err) console.error(`[PlayitRelay] Error enviando respuesta a ${clientKey}:`, err.message);
              });
            });

            dedicatedSocket.on('error', (err) => {
              console.warn(`[PlayitRelay] Error en sesión ${clientKey}:`, err.message);
            });

            session = {
              socket: dedicatedSocket,
              address: rinfo.address,
              port: rinfo.port,
              lastActive: Date.now()
            };
            this.sessions.set(clientKey, session);
            this.stats.activeSessions = this.sessions.size;
            console.log(`[PlayitRelay] Nueva sesión establecida para cliente ${clientKey} -> RakNet :${this.targetPort}`);
          }

          session.lastActive = Date.now();
          // Enviar paquete entrante a PZ RakNet (127.0.0.1:16262)
          session.socket.send(msg, this.targetPort, this.targetHost, (err) => {
            if (err) console.error(`[PlayitRelay] Error reenviando a RakNet:`, err.message);
          });
        });

        this.mainSocket.on('error', (err) => {
          console.error('[PlayitRelay] Error en socket principal:', err.message);
        });

        this.mainSocket.bind(this.listenPort, this.listenHost, () => {
          this.stats.startedAt = Date.now();
          console.log(`📡 [PlayitRelay] Enlace de Juego ACTIVO en ${this.listenHost}:${this.listenPort} -> RakNet :${this.targetPort}`);

          // Limpieza periódica de sesiones inactivas (> 90 segundos)
          this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            for (const [key, session] of this.sessions.entries()) {
              if (now - session.lastActive > 90000) {
                try { session.socket.close(); } catch {}
                this.sessions.delete(key);
                console.log(`[PlayitRelay] Sesión inactiva cerrada: ${key}`);
              }
            }
            this.stats.activeSessions = this.sessions.size;
          }, 30000);

          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  stop() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    for (const session of this.sessions.values()) {
      try { session.socket.close(); } catch {}
    }
    this.sessions.clear();
    if (this.mainSocket) {
      try { this.mainSocket.close(); } catch {}
      this.mainSocket = null;
    }
    console.log('[PlayitRelay] Enlace detenido.');
  }
}
