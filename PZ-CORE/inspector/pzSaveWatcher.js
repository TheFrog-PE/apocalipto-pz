import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from '../crypto/merkle.js';

/**
 * Inspector de Guardados de Project Zomboid (PZ Save Watcher)
 * Seguridad y Privacidad:
 * - Toda ruta de archivo en Windows es estrictamente convertida a rutas relativas virtuales.
 * - Ninguna ruta local como "C:\Users\..." se incluye jamás en la estructura del bloque.
 */

export class PZSaveWatcher {
  constructor(saveFolderPath, casStore) {
    this.saveFolderPath = saveFolderPath;
    this.casStore = casStore;
    this.knownChunkHashes = new Map(); // virtualPath -> hash
  }

  /**
   * Convierte una ruta física de archivo a una ruta virtual canónica segura
   * Ej: C:\Users\Admin\Zomboid\Saves\Multiplayer\servertest\map_100_200.bin -> world/map_100_200.bin
   */
  toVirtualPath(filePath) {
    const rel = path.relative(this.saveFolderPath, filePath);
    const normalized = rel.replace(/\\/g, '/').toLowerCase();

    if (normalized.startsWith('map_')) {
      return `world/${normalized}`;
    }
    if (normalized.endsWith('.db')) {
      return `database/${normalized}`;
    }
    return `meta/${normalized}`;
  }

  /**
   * Escanea el directorio de guardado de PZ y detecta cambios (deltas)
   * Almacena automáticamente los nuevos chunks en el Content-Addressable Storage (CAS)
   * @returns {Array<{ virtualPath: string, chunkHash: string, size: number }>}
   */
  scanForChanges() {
    if (!fs.existsSync(this.saveFolderPath)) {
      return [];
    }

    const changes = [];
    const entries = fs.readdirSync(this.saveFolderPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      // Filtrar archivos temporales o de lock
      if (entry.name.endsWith('.tmp') || entry.name.endsWith('.lock') || entry.name.endsWith('-journal')) {
        continue;
      }

      const fullPath = path.join(this.saveFolderPath, entry.name);

      try {
        const buffer = fs.readFileSync(fullPath);
        const currentHash = sha256(buffer);
        const virtualPath = this.toVirtualPath(fullPath);

        const lastKnownHash = this.knownChunkHashes.get(virtualPath);

        if (currentHash !== lastKnownHash) {
          // Guardar en el CAS
          this.casStore.store(buffer);

          // Registrar cambio
          changes.push({
            virtualPath,
            chunkHash: currentHash,
            size: buffer.length
          });

          this.knownChunkHashes.set(virtualPath, currentHash);
        }
      } catch (err) {
        // En Windows, si el servidor PZ está escribiendo en el archivo exactamente ahora, se ignora temporalmente
        // y se procesará en el siguiente ciclo sin crashear el enjambre
      }
    }

    return changes;
  }
}
