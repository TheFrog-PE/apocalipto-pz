import net from 'node:net';

/**
 * Cliente Source RCON para Project Zomboid (TCP Puerto 27015)
 * Protocolo de Valve/Source:
 * Header: [Size (4 bytes LE)] [ID (4 bytes LE)] [Type (4 bytes LE)] [Body (null-terminated)] [Pad (0x00)]
 * Type 3: SERVERDATA_AUTH
 * Type 2: SERVERDATA_EXECCOMMAND
 */
export class PZ_RconClient {
  constructor(options = {}) {
    this.host = options.host || '127.0.0.1';
    this.port = options.port || 27015;
    this.password = options.password || 'ApocaliptoSwarm2026SecureRCON#Root!';
    this.timeout = options.timeout || 3000;
  }

  /**
   * Ejecuta un comando RCON de forma segura y devuelve la respuesta del servidor
   * @param {string} command - Comando a ejecutar (ej: "players", "servermsg Hola", "save")
   * @param {number} [customTimeout] - Timeout opcional para chequeos rápidos
   * @returns {Promise<{success: boolean, response: string, latencyMs: number}>}
   */
  async execute(command, customTimeout = null) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();
      let authed = false;
      let responseBuffer = '';
      let timer = null;

      const finish = (result) => {
        if (timer) clearTimeout(timer);
        socket.destroy();
        resolve({
          ...result,
          latencyMs: Date.now() - startTime
        });
      };

      const timeoutVal = customTimeout || this.timeout;
      timer = setTimeout(() => {
        finish({
          success: false,
          response: 'TIMEOUT: El Nodo Alfa no respondió en el puerto RCON 27015. ¿El servidor PZ está encendido?',
          offline: true
        });
      }, timeoutVal);

      socket.connect(this.port, this.host, () => {
        // Enviar paquete de autenticación (Type 3)
        this._sendPacket(socket, 1, 3, this.password);
      });

      socket.on('data', (data) => {
        let offset = 0;
        while (offset < data.length) {
          if (data.length < offset + 12) break;
          const size = data.readInt32LE(offset);
          const id = data.readInt32LE(offset + 4);
          const type = data.readInt32LE(offset + 8);
          const bodyBytes = data.subarray(offset + 12, offset + 4 + size - 2);
          const bodyStr = bodyBytes.toString('utf8');

          offset += 4 + size;

          if (type === 2 && !authed) {
            // Respuesta de autenticación
            if (id === -1) {
              return finish({ success: false, response: 'AUTH_FAILED: Contraseña RCON rechazada por el servidor PZ.' });
            }
            authed = true;
            // Enviar comando a ejecutar (Type 2)
            this._sendPacket(socket, 2, 2, command);
          } else if (authed) {
            responseBuffer += bodyStr;
            // Respuestas recibidas
            return finish({ success: true, response: responseBuffer || 'Comando ejecutado exitosamente en el Nodo Alfa.' });
          }
        }
      });

      socket.on('error', (err) => {
        finish({
          success: false,
          response: `RCON_OFFLINE: Nodo Alfa no accesible en ${this.host}:${this.port} (${err.code || err.message}).`,
          offline: true
        });
      });
    });
  }

  _sendPacket(socket, id, type, body) {
    const bodyBuf = Buffer.from(body, 'utf8');
    const size = 4 + 4 + bodyBuf.length + 2; // id (4) + type (4) + body + 2 null bytes
    const packet = Buffer.alloc(4 + size);

    packet.writeInt32LE(size, 0);
    packet.writeInt32LE(id, 4);
    packet.writeInt32LE(type, 8);
    bodyBuf.copy(packet, 12);
    packet.writeUInt8(0, 12 + bodyBuf.length);
    packet.writeUInt8(0, 13 + bodyBuf.length);

    socket.write(packet);
  }
}
