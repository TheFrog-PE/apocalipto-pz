import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from '../crypto/merkle.js';

/**
 * Almacenamiento Direccionado por Contenido (CAS - Content-Addressable Storage)
 * Estilo Git / IPFS:
 * - Los chunks del mundo se guardan e indexan por su Hash SHA-256.
 * - Cero rutas de Windows expuestas en la red.
 * - Deduplicación automática (si un chunk no cambió, no se duplica).
 */

export class ContentAddressableStore {
  constructor(storageDir) {
    this.baseDir = storageDir;
    this.objectsDir = path.join(storageDir, 'objects');

    if (!fs.existsSync(this.objectsDir)) {
      fs.mkdirSync(this.objectsDir, { recursive: true });
    }
  }

  /**
   * Obtiene la ruta física local en el CAS para un hash dado
   */
  _getChunkPath(chunkHash) {
    const prefix = chunkHash.substring(0, 2);
    const rest = chunkHash.substring(2);
    const dir = path.join(this.objectsDir, prefix);
    return { dir, filePath: path.join(dir, `${rest}.chunk`) };
  }

  /**
   * Almacena un buffer en el CAS si no existe previamente
   * @param {Buffer} buffer
   * @returns {{ chunkHash: string, size: number, isNew: boolean }}
   */
  store(buffer) {
    const chunkHash = sha256(buffer);
    const { dir, filePath } = this._getChunkPath(chunkHash);

    if (fs.existsSync(filePath)) {
      return { chunkHash, size: buffer.length, isNew: false };
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    return { chunkHash, size: buffer.length, isNew: true };
  }

  /**
   * Verifica si un chunk existe localmente
   */
  has(chunkHash) {
    const { filePath } = this._getChunkPath(chunkHash);
    return fs.existsSync(filePath);
  }

  /**
   * Lee un chunk desde el CAS y verifica su integridad matemática
   */
  read(chunkHash) {
    const { filePath } = this._getChunkPath(chunkHash);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const buffer = fs.readFileSync(filePath);
    const verificationHash = sha256(buffer);

    // Verificación criptográfica obligatoria: integridad inviolable
    if (verificationHash !== chunkHash) {
      throw new Error(`CAS_CORRUPTION_DETECTED: El hash del chunk ${chunkHash} está corrupto en disco`);
    }

    return buffer;
  }

  /**
   * Lista todos los hashes presentes en el almacén local
   */
  listAllHashes() {
    const hashes = [];
    if (!fs.existsSync(this.objectsDir)) return hashes;

    const prefixes = fs.readdirSync(this.objectsDir);
    for (const prefix of prefixes) {
      const pDir = path.join(this.objectsDir, prefix);
      if (fs.statSync(pDir).isDirectory()) {
        const files = fs.readdirSync(pDir);
        for (const file of files) {
          if (file.endsWith('.chunk')) {
            const rest = file.replace('.chunk', '');
            hashes.push(`${prefix}${rest}`);
          }
        }
      }
    }

    return hashes;
  }
}
