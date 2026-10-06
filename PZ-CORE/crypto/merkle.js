import crypto from 'node:crypto';

/**
 * Módulo del Árbol de Merkle para el Estado del Mundo en Project Zomboid
 * Cada chunk (.bin / .db) es una hoja en el árbol criptográfico.
 * El Merkle Root representa matemáticamente el estado completo e inmutable del mundo.
 */

/**
 * Calcula el hash SHA-256 de un buffer o string
 */
export function sha256(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Normaliza y hashea una hoja del árbol de Merkle
 * Formato canónico: SHA256(virtualPath + ":" + chunkHash)
 */
export function hashLeaf(virtualPath, chunkHash) {
  // Normalizar ruta para evitar cualquier inconsistencia Windows vs Linux
  const normalizedPath = virtualPath.replace(/\\/g, '/').toLowerCase();
  return sha256(`${normalizedPath}:${chunkHash}`);
}

/**
 * Hashea dos nodos hijos combinados (ordenados para árbol canónico)
 */
export function hashPair(left, right) {
  if (!right) return left;
  // Ordenamiento canónico lexicográfico para que el árbol sea determinista
  const [first, second] = left < right ? [left, right] : [right, left];
  return sha256(`${first}:${second}`);
}

/**
 * Construye el Árbol de Merkle a partir de una lista de chunks
 * @param {Array<{ virtualPath: string, chunkHash: string }>} chunks
 * @returns {{ root: string, leaves: string[], layers: string[][] }}
 */
export function buildMerkleTree(chunks) {
  if (!chunks || chunks.length === 0) {
    // Hash vacío estándar para estado vacío
    return {
      root: sha256('EMPTY_WORLD_STATE'),
      leaves: [],
      layers: [[]]
    };
  }

  // 1. Crear hojas ordenadas
  const sortedChunks = [...chunks].sort((a, b) =>
    a.virtualPath.localeCompare(b.virtualPath)
  );

  let currentLayer = sortedChunks.map((c) => hashLeaf(c.virtualPath, c.chunkHash));
  const layers = [currentLayer];

  // 2. Reducir capas hasta la raíz
  while (currentLayer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : null;
      nextLayer.push(hashPair(left, right));
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return {
    root: currentLayer[0],
    leaves: layers[0],
    layers
  };
}

/**
 * Genera una Prueba de Merkle (Merkle Proof) para verificar que un chunk específico
 * pertenece al estado sin requerir todos los demás chunks.
 */
export function generateMerkleProof(virtualPath, chunkHash, chunks) {
  const tree = buildMerkleTree(chunks);
  const targetLeaf = hashLeaf(virtualPath, chunkHash);

  let index = tree.leaves.indexOf(targetLeaf);
  if (index === -1) {
    return null; // La hoja no existe en el árbol
  }

  const proof = [];

  for (let l = 0; l < tree.layers.length - 1; l++) {
    const layer = tree.layers[l];
    const isRightNode = index % 2 === 1;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < layer.length) {
      proof.push({
        position: isRightNode ? 'left' : 'right',
        data: layer[siblingIndex]
      });
    }

    index = Math.floor(index / 2);
  }

  return {
    leaf: targetLeaf,
    root: tree.root,
    proof
  };
}

/**
 * Verifica una Prueba de Merkle de forma independiente
 */
export function verifyMerkleProof(leafHash, proof, expectedRoot) {
  let currentHash = leafHash;

  for (const step of proof) {
    currentHash = hashPair(currentHash, step.data);
  }

  return currentHash === expectedRoot;
}
