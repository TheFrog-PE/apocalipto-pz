/**
 * Local UDP Proxy / Relay para Project Zomboid (Build 42)
 *
 * Escucha en loopback 127.0.0.1:16261 (puerto estándar de PZ Client).
 * Reenvía los paquetes UDP de juego de forma transparente hacia el nodo
 * ALFA del Enjambre P2P y retorna las respuestas al cliente.
 *
 * Características de seguridad:
 * - Límite de tamaño de buffer por paquete: 64 KB.
 * - Cero allocations innecesarios en memoria.
 * - Manejo seguro de EADDRINUSE y desconexiones.
 */

import dgram from 'node:dgram';

export class LocalUdpProxy {
  constructor(options = {}) {
    this.localPort = options.localPort || 16261;
    this.localHost = options.localHost || '127.0.0.1';
    this.targetPort = options.targetPort || 16261;
    this.targetHost = options.targetHost || '127.0.0.1';

    this.serverSocket = null;
    this.clientEndpoints = new Map(); // key: 'ip:port' -> { lastSeen }
    
    this.stats = {
      isActive: false,
      startedAt: null,
      packetsReceived: 0,
      packetsSent: 0,
      bytesTransferred: 0,
      lastPacketAt: null,
      clientCount: 0
    };
  }

  /**
   * Inicia el proxy UDP en segundo plano
   */
  start() {
    if (this.serverSocket) {
      return Promise.resolve(this.getStatus());
    }

    // Si el destino es el propio loopback local en el mismo puerto, no interceptar
    if (
      (this.targetHost === '127.0.0.1' || this.targetHost === 'localhost') &&
      Number(this.targetPort) === Number(this.localPort)
    ) {
      this.stats.isActive = false;
      this.stats.isLoopbackDirect = true;
      this.stats.note = 'Servidor local detectado en 16261: Enlace directo activo sin proxy';
      return Promise.resolve(this.getStatus());
    }

    return new Promise((resolve, reject) => {
      try {
        // En Windows, reuseAddr: true permite que Node.js secuestre el puerto UDP 16261
        // del servidor dedicado de PZ si ambos corren en la misma máquina.
        // Usamos reuseAddr: false para que si el servidor PZ ya está escuchando en 16261,
        // lance EADDRINUSE y se active el enlace directo sin secuestrar paquetes.
        this.serverSocket = dgram.createSocket({ type: 'udp4', reuseAddr: false });

        this.serverSocket.on('error', (err) => {
          if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
            // Si el puerto 16261 ya está ocupado (ej. Servidor PZ dedicado corriendo en esta PC),
            // el cliente se conecta directamente sin intermediario
            this.stats.isActive = true;
            this.stats.isLoopbackDirect = true;
            this.stats.note = 'Servidor PZ local detectado en 16261 (Enlace Directo)';
            resolve(this.getStatus());
          } else {
            console.error('[UDP PROXY ERROR]', err.message);
            this.stop();
            resolve(this.getStatus());
          }
        });

        this.serverSocket.on('message', (msg, rinfo) => {
          // 1. Mitigación de amplificación / paquetes anómalos (PZ UDP MTU <= 1400 bytes)
          if (msg.length > 2048) {
            this.stats.droppedPackets = (this.stats.droppedPackets || 0) + 1;
            return;
          }

          this.stats.packetsReceived++;
          this.stats.bytesTransferred += msg.length;
          this.stats.lastPacketAt = Date.now();

          // 2. Prevención de memory leak por escaneo de puertos (Bounded Memory)
          if (this.clientEndpoints.size > 64) {
            const cutoff = Date.now() - 60000;
            for (const [key, val] of this.clientEndpoints.entries()) {
              if (val.lastSeen < cutoff) this.clientEndpoints.delete(key);
            }
          }

          const isTargetHost = rinfo.address === this.targetHost || (this.targetHost === '127.0.0.1' && rinfo.port === this.targetPort);

          if (!isTargetHost && (rinfo.address === '127.0.0.1' || rinfo.address === '::1' || rinfo.address === 'localhost')) {
            // Paquete del cliente local de PZ -> guardar endpoint del cliente
            this.lastLocalClient = { address: rinfo.address, port: rinfo.port };
            this.clientEndpoints.set(`${rinfo.address}:${rinfo.port}`, { ...this.lastLocalClient, lastSeen: Date.now() });
            this.stats.clientCount = this.clientEndpoints.size;

            // Reenviar paquete al servidor del Creador/Host
            if (this.targetHost !== this.localHost || this.targetPort !== this.localPort) {
              this.serverSocket.send(msg, this.targetPort, this.targetHost, (err) => {
                if (!err) this.stats.packetsSent++;
              });
            }
          } else if (this.lastLocalClient) {
            // Paquete de respuesta del servidor remoto -> reenviar de vuelta al cliente PZ local
            this.serverSocket.send(msg, this.lastLocalClient.port, this.lastLocalClient.address, (err) => {
              if (!err) this.stats.packetsSent++;
            });
          }
        });

        this.serverSocket.on('listening', () => {
          const addr = this.serverSocket.address();
          this.stats.isActive = true;
          this.stats.startedAt = Date.now();
          console.log(`[UDP PROXY] Escuchando enlace P2P en ${addr.address}:${addr.port}`);
          resolve(this.getStatus());
        });

        this.serverSocket.bind(this.localPort, this.localHost);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Detiene el proxy de forma limpia
   */
  stop() {
    if (this.serverSocket) {
      try {
        this.serverSocket.close();
      } catch {}
      this.serverSocket = null;
    }
    this.stats.isActive = false;
    this.clientEndpoints.clear();
  }

  /**
   * Actualiza el nodo destino (Failover dinámico en caso de cambio de host)
   */
  setTarget(host, port) {
    this.targetHost = host;
    this.targetPort = port;
  }

  /**
   * Retorna telemetría en vivo del proxy
   */
  getStatus() {
    return {
      ...this.stats,
      localBinding: `${this.localHost}:${this.localPort}`,
      targetDestination: `${this.targetHost}:${this.targetPort}`
    };
  }
}
