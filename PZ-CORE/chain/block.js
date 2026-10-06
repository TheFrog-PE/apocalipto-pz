import { sha256, buildMerkleTree } from '../crypto/merkle.js';
import { signPayload, verifySignature } from '../crypto/keys.js';

/**
 * Estructura del Bloque de Guardado (Save-Chain Block)
 * Cada bloque inmuta el estado de supervivencia en un instante de tiempo.
 * No contiene IPs, ni rutas de Windows, ni datos sensibles de usuario.
 */

export const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Serializa de forma determinista el encabezado del bloque para hasheo y firma
 */
export function serializeHeader(header) {
  return JSON.stringify({
    index: header.index,
    timestamp: header.timestamp,
    prevHash: header.prevHash,
    merkleRoot: header.merkleRoot,
    alfaNodeId: header.alfaNodeId,
    changesCount: header.changesCount
  });
}

/**
 * Calcula el Hash SHA-256 del bloque a partir de su encabezado canónico
 */
export function calculateBlockHash(header) {
  return sha256(serializeHeader(header));
}

/**
 * Crea un nuevo Bloque de Guardado firmado por el Nodo Alfa
 */
export function createBlock({
  index,
  prevHash,
  changes,
  alfaNodeId,
  alfaPrivateKeyHex,
  timestamp = Date.now()
}) {
  // 1. Calcular Merkle Root de los cambios del mundo
  const merkleTree = buildMerkleTree(
    changes.map((c) => ({
      virtualPath: c.virtualPath,
      chunkHash: c.chunkHash
    }))
  );

  // 2. Construir encabezado canónico
  const header = {
    index,
    timestamp,
    prevHash,
    merkleRoot: merkleTree.root,
    alfaNodeId,
    changesCount: changes.length
  };

  const blockHash = calculateBlockHash(header);

  // 3. Firma del Alfa
  const headerSerialized = serializeHeader(header);
  const alfaSignature = signPayload(headerSerialized, alfaPrivateKeyHex);

  return {
    header,
    blockHash,
    changes,
    alfaSignature,
    witnessSignatures: [] // Se completará con el consenso de testigos
  };
}

/**
 * Permite a un Nodo Testigo verificar el bloque y agregar su firma criptográfica de consenso
 */
export function signAsWitness(block, witnessNodeId, witnessPrivateKeyHex) {
  const headerSerialized = serializeHeader(block.header);
  const signature = signPayload(headerSerialized, witnessPrivateKeyHex);

  // Evitar duplicados del mismo testigo
  const existing = block.witnessSignatures.find((w) => w.nodeId === witnessNodeId);
  if (existing) {
    existing.signature = signature;
    existing.timestamp = Date.now();
  } else {
    block.witnessSignatures.push({
      nodeId: witnessNodeId,
      signature,
      timestamp: Date.now()
    });
  }

  return block;
}

/**
 * Valida la integridad criptográfica completa de un bloque
 * @param {object} block
 * @param {string} alfaPublicKeyHex
 * @param {Map<string, string>|object} witnessPublicKeysMap - Mapa de nodeId -> publicKeyHex
 * @param {number} minWitnesses - Mínimo de firmas de testigos requeridas
 */
export function validateBlock(
  block,
  alfaPublicKeyHex,
  witnessPublicKeysMap = {},
  minWitnesses = 0
) {
  // 1. Validar Hash del Bloque
  const computedHash = calculateBlockHash(block.header);
  if (computedHash !== block.blockHash) {
    return { valid: false, error: 'BLOCK_HASH_MISMATCH' };
  }

  // 2. Validar Merkle Root recalculándolo desde los chunks
  const recalculatedTree = buildMerkleTree(
    block.changes.map((c) => ({
      virtualPath: c.virtualPath,
      chunkHash: c.chunkHash
    }))
  );

  if (recalculatedTree.root !== block.header.merkleRoot) {
    return { valid: false, error: 'MERKLE_ROOT_TAMPERED' };
  }

  // 3. Validar Firma del Nodo Alfa
  const headerSerialized = serializeHeader(block.header);
  const isAlfaValid = verifySignature(
    headerSerialized,
    block.alfaSignature,
    alfaPublicKeyHex
  );

  if (!isAlfaValid) {
    return { valid: false, error: 'INVALID_ALFA_SIGNATURE' };
  }

  // 4. Validar Firmas de los Testigos (Consenso)
  let validWitnessCount = 0;
  const keyMap =
    witnessPublicKeysMap instanceof Map
      ? witnessPublicKeysMap
      : new Map(Object.entries(witnessPublicKeysMap));

  for (const witness of block.witnessSignatures) {
    const pubKey = keyMap.get(witness.nodeId);
    if (pubKey) {
      const isValid = verifySignature(headerSerialized, witness.signature, pubKey);
      if (isValid) validWitnessCount++;
    }
  }

  if (validWitnessCount < minWitnesses) {
    return {
      valid: false,
      error: `INSUFFICIENT_WITNESSES (requeridos: ${minWitnesses}, válidos: ${validWitnessCount})`
    };
  }

  return { valid: true, verifiedWitnesses: validWitnessCount };
}
