import os from 'node:os';
import crypto from 'node:crypto';
import { signPayload, verifySignature } from '../crypto/keys.js';
import { sha256 } from '../crypto/merkle.js';

/**
 * Escáner de Prueba de Hardware Delegada (Delegated Proof of Hardware - DPoH)
 * Mide la capacidad técnica de la máquina del jugador y emite un certificado
 * firmado criptográficamente con su clave privada Ed25519.
 *
 * Protección estricta de privacidad:
 * - NO incluye direcciones MAC, ni números de serie de placa madre.
 * - NO incluye nombres de usuario del sistema operativo ni rutas.
 * - Solo métricas de rendimiento estandarizadas para el consenso del enjambre.
 */

/**
 * Ejecuta un micro-benchmark para medir rendimiento real de CPU y memoria
 * (calcula miles de hashes SHA-256 por segundo de forma segura)
 */
function runMicroBenchmark(durationMs = 250) {
  const start = Date.now();
  let iterations = 0;
  const chunk = crypto.randomBytes(4096);

  while (Date.now() - start < durationMs) {
    crypto.createHash('sha256').update(chunk).digest();
    iterations++;
  }

  // Iteraciones normalizadas por cada 100ms
  return Math.round((iterations / durationMs) * 100);
}

/**
 * Escanea el hardware del equipo y calcula el Hardware Score
 */
export function scanHardware() {
  const cpus = os.cpus();
  const cpuThreads = cpus.length || 1;
  const cpuModel = cpus[0]?.model ? cpus[0].model.trim() : 'Generic CPU';

  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();

  const ramTotalGB = Number((totalMemBytes / (1024 ** 3)).toFixed(1));
  const ramFreeGB = Number((freeMemBytes / (1024 ** 3)).toFixed(1));

  // Benchmark sintético de procesamiento
  const benchmarkScore = runMicroBenchmark(250);

  // Fórmula matemática de puntuación de hardware:
  // Hilos CPU (x10) + RAM Total GB (x5) + RAM Libre GB (x5) + Benchmark (x0.2)
  const hardwareScore = Math.round(
    cpuThreads * 10 +
    ramTotalGB * 5 +
    ramFreeGB * 5 +
    benchmarkScore * 0.2
  );

  // Clasificación táctica de roles en el enjambre:
  // - ALFA: Equipos potentes (16+ GB RAM, CPU de alto rendimiento) aptos para hostear el enjambre completo.
  // - SOMBRA: Equipos de 8+ GB RAM (perfil ligero optimizado) listos para relevo autónomo en 5-8s.
  // - TESTIGO / SEMBRADOR: Equipos clientes que validan consenso criptográfico y distribuyen la Save-Chain.
  let recommendedRole = 'SEMBRADOR';
  if (hardwareScore >= 180 && ramTotalGB >= 15.0) {
    recommendedRole = 'ALFA';
  } else if (hardwareScore >= 100 && ramTotalGB >= 7.5) {
    recommendedRole = 'SOMBRA';
  } else if (hardwareScore >= 60) {
    recommendedRole = 'TESTIGO';
  }

  return {
    metrics: {
      cpuThreads,
      cpuModel,
      ramTotalGB,
      ramFreeGB,
      benchmarkScore,
      hardwareScore
    },
    recommendedRole
  };
}

/**
 * Genera la Prueba de Hardware (DPoH) firmada criptográficamente por la identidad local
 * @param {object} identity - { nodeId, privateKey, publicKey }
 * @returns {object} Certificado DPoH firmado
 */
export function generateSignedHardwareProof(identity) {
  const scan = scanHardware();
  const timestamp = Date.now();

  const proofPayload = {
    nodeId: identity.nodeId,
    timestamp,
    cpuThreads: scan.metrics.cpuThreads,
    ramTotalGB: scan.metrics.ramTotalGB,
    ramFreeGB: scan.metrics.ramFreeGB,
    benchmarkScore: scan.metrics.benchmarkScore,
    hardwareScore: scan.metrics.hardwareScore,
    roleClaimed: scan.recommendedRole
  };

  // Firma canónica determinista
  const canonicalString = JSON.stringify(proofPayload);
  const signature = signPayload(canonicalString, identity.privateKey);

  return {
    proofPayload,
    signature,
    publicKey: identity.publicKey
  };
}

/**
 * Verifica la autenticidad matemática de una Prueba de Hardware recibida de otro nodo
 */
export function verifyHardwareProof(signedProof) {
  try {
    if (!signedProof || typeof signedProof !== 'object') {
      return { valid: false, error: 'MALFORMED_PROOF_OBJECT' };
    }

    const { proofPayload, signature, publicKey } = signedProof;

    if (!proofPayload || typeof proofPayload !== 'object') {
      return { valid: false, error: 'MISSING_OR_INVALID_PAYLOAD' };
    }

    if (!signature || typeof signature !== 'string') {
      return { valid: false, error: 'MISSING_OR_INVALID_SIGNATURE' };
    }

    if (!publicKey || typeof publicKey !== 'string' || publicKey.length < 16) {
      return { valid: false, error: 'MISSING_OR_INVALID_PUBLIC_KEY' };
    }

    if (!proofPayload.nodeId || typeof proofPayload.nodeId !== 'string') {
      return { valid: false, error: 'INVALID_NODE_ID' };
    }

    if (typeof proofPayload.timestamp !== 'number' || isNaN(proofPayload.timestamp)) {
      return { valid: false, error: 'INVALID_TIMESTAMP' };
    }

    // 1. Verificar que el nodeId derive matemáticamente de la clave pública
    let expectedHash;
    try {
      expectedHash = sha256(Buffer.from(publicKey, 'hex')).substring(0, 16);
    } catch {
      return { valid: false, error: 'INVALID_HEX_PUBLIC_KEY' };
    }

    if (proofPayload.nodeId !== `node_${expectedHash}`) {
      return { valid: false, error: 'NODE_ID_SPOOFED' };
    }

    // 2. Verificar la firma Ed25519
    const canonicalString = JSON.stringify(proofPayload);
    const isSignatureValid = verifySignature(canonicalString, signature, publicKey);

    if (!isSignatureValid) {
      return { valid: false, error: 'INVALID_SIGNATURE' };
    }

    // 3. Verificar que el timestamp no sea del futuro ni ridículamente antiguo (máx 1 hora)
    const now = Date.now();
    if (proofPayload.timestamp > now + 60000 || now - proofPayload.timestamp > 3600000) {
      return { valid: false, error: 'PROOF_EXPIRED_OR_TIME_DRIFT' };
    }

    return { 
      valid: true, 
      verifiedRole: proofPayload.roleClaimed || 'SOMBRA', 
      score: Number(proofPayload.hardwareScore) || 500 
    };
  } catch (err) {
    return { valid: false, error: 'CRYPTO_VERIFICATION_EXCEPTION', details: err.message };
  }
}
