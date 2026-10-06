import fs from 'node:fs';
import path from 'node:path';
import {
  createBlock,
  validateBlock,
  GENESIS_PREV_HASH
} from './block.js';

/**
 * Libro Mayor de la Cadena de Guardados (Save-Chain Ledger)
 * Almacena el historial inmutable de bloques de supervivencia.
 */

export class SaveChainLedger {
  constructor(storageDir) {
    this.storageDir = storageDir;
    this.chainFile = path.join(storageDir, 'chain.jsonl');
    this.blocks = [];
    this.blocksByHash = new Map();

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    this._loadChain();
  }

  _loadChain() {
    this.blocks = [];
    this.blocksByHash.clear();

    if (!fs.existsSync(this.chainFile)) {
      return;
    }

    const lines = fs.readFileSync(this.chainFile, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const block = JSON.parse(line);
        this.blocks.push(block);
        this.blocksByHash.set(block.blockHash, block);
      } catch (err) {
        console.error('[Ledger] Error parseando bloque en línea:', err.message);
      }
    }
  }

  /**
   * Inicializa el Bloque Génesis si la cadena está vacía
   */
  initGenesis(alfaNodeId, alfaPrivateKeyHex) {
    if (this.blocks.length > 0) {
      return this.blocks[0];
    }

    const genesisBlock = createBlock({
      index: 0,
      prevHash: GENESIS_PREV_HASH,
      changes: [
        {
          virtualPath: 'system/genesis.dat',
          chunkHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA256('')
          size: 0
        }
      ],
      alfaNodeId,
      alfaPrivateKeyHex,
      timestamp: Date.now()
    });

    this.appendBlock(genesisBlock);
    return genesisBlock;
  }

  getLatestBlock() {
    if (this.blocks.length === 0) return null;
    return this.blocks[this.blocks.length - 1];
  }

  getHeight() {
    return this.blocks.length;
  }

  getBlockByIndex(index) {
    return this.blocks[index] || null;
  }

  getBlockByHash(hash) {
    return this.blocksByHash.get(hash) || null;
  }

  /**
   * Agrega un bloque al ledger validando que enlace exactamente con el bloque anterior
   */
  appendBlock(block, alfaPublicKeyHex, witnessPublicKeys = {}, minWitnesses = 0) {
    // Si no es el bloque génesis, validar continuidad
    if (this.blocks.length > 0) {
      const latest = this.getLatestBlock();

      if (block.header.index !== latest.header.index + 1) {
        throw new Error(
          `LEDGER_INVALID_INDEX: Índice esperado ${latest.header.index + 1}, recibido ${block.header.index}`
        );
      }

      if (block.header.prevHash !== latest.blockHash) {
        throw new Error(
          `LEDGER_FORK_DETECTED: prevHash no coincide con el último bloque conocido`
        );
      }

      // Validar criptografía completa si se provee la clave pública del Alfa
      if (alfaPublicKeyHex) {
        const validation = validateBlock(block, alfaPublicKeyHex, witnessPublicKeys, minWitnesses);
        if (!validation.valid) {
          throw new Error(`LEDGER_BLOCK_INVALID: ${validation.error}`);
        }
      }
    }

    // Persistir de forma segura en archivo JSON Lines
    this.blocks.push(block);
    this.blocksByHash.set(block.blockHash, block);

    fs.appendFileSync(this.chainFile, JSON.stringify(block) + '\n', 'utf8');
    return true;
  }

  /**
   * Audita la integridad matemática de toda la cadena desde el bloque 0
   */
  auditChain() {
    if (this.blocks.length === 0) return { valid: true, auditedBlocks: 0 };

    for (let i = 1; i < this.blocks.length; i++) {
      const prev = this.blocks[i - 1];
      const curr = this.blocks[i];

      if (curr.header.prevHash !== prev.blockHash) {
        return {
          valid: false,
          error: `BROKEN_CHAIN: Bloque #${curr.header.index} no enlaza con bloque #${prev.header.index}`
        };
      }
    }

    return { valid: true, auditedBlocks: this.blocks.length };
  }
}
