import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Módulo Criptográfico de Identidad y Firmas Ed25519
 * Protección de privacidad:
 * - Claves privadas cifradas localmente con AES-256-GCM
 * - NodeID derivado de Hash SHA-256 de la clave pública (sin datos de usuario)
 * - Sanitización automática de rutas y credenciales del SO
 */

// Utilidad para sanitizar y ofuscar rutas absolutas de Windows (ej: C:\Users\Juan\...)
export function sanitizePath(rawPath) {
  if (typeof rawPath !== 'string') return rawPath;
  const userProfile = os.homedir();
  let sanitized = rawPath.split(userProfile).join('~');
  // Reemplazar barras inversas por barras normales para consistencia multiplataforma
  sanitized = sanitized.replace(/\\/g, '/');
  return sanitized;
}

// Utilidad para ofuscar IPs y datos sensibles en logs
export function obfuscateIP(ip) {
  if (!ip || typeof ip !== 'string') return '0.0.0.0';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return '***.encrypted';
}

/**
 * Genera un nuevo par de claves Ed25519
 */
export function generateIdentityKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  const pubDer = publicKey.export({ type: 'spki', format: 'der' });
  const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });

  // NodeID = SHA-256 de la clave pública en formato hexadecimal corto (anonimizado)
  const nodeHash = crypto.createHash('sha256').update(pubDer).digest('hex');
  const nodeId = `node_${nodeHash.substring(0, 16)}`;

  return {
    nodeId,
    publicKey: pubDer.toString('hex'),
    privateKey: privDer.toString('hex')
  };
}

/**
 * Cifra la clave privada local usando AES-256-GCM con contraseña/entropía de máquina
 */
export function encryptPrivateKey(privateKeyHex, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(privateKeyHex, 'hex')), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    cipher: 'aes-256-gcm',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex')
  };
}

/**
 * Descifra la clave privada
 */
export function decryptPrivateKey(encryptedObj, passphrase) {
  const salt = Buffer.from(encryptedObj.salt, 'hex');
  const iv = Buffer.from(encryptedObj.iv, 'hex');
  const authTag = Buffer.from(encryptedObj.authTag, 'hex');
  const data = Buffer.from(encryptedObj.data, 'hex');

  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('hex');
}

/**
 * Firma digitalmente un buffer o un objeto JSON con Ed25519
 */
export function signPayload(payload, privateKeyHex) {
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKeyHex, 'hex'),
    format: 'der',
    type: 'pkcs8'
  });

  const dataBuffer = Buffer.isBuffer(payload)
    ? payload
    : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8');

  const signature = crypto.sign(null, dataBuffer, privateKey);
  return signature.toString('hex');
}

/**
 * Verifica una firma digital Ed25519
 */
export function verifySignature(payload, signatureHex, publicKeyHex) {
  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(publicKeyHex, 'hex'),
      format: 'der',
      type: 'spki'
    });

    const dataBuffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8');

    return crypto.verify(null, dataBuffer, publicKey, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Deriva entropía de máquina como passphrase de respaldo si no se provee una.
 * Combina: nombre del host + USERPROFILE + salt fijo del proyecto
 * NO es un secreto en sí misma, es un refuerzo de dureza contra keystores robados.
 */
function deriveMachineEntropy() {
  const host = os.hostname() || 'localhost';
  const profile = os.userInfo().username || 'user';
  const projectSalt = 'APOCALIPTO_PZ_SWARM_2026_SALT_V1';
  return crypto.createHash('sha256').update(`${host}:${profile}:${projectSalt}`).digest('hex');
}

/**
 * Carga o inicializa la identidad criptográfica en disco (en keystore seguro)
 * NUNCA usar passphrase hardcodeada en producción.
 * Si no se provee passphrase, se usa entropía de máquina como capa de dureza adicional.
 */
export function loadOrInitIdentity(storageDir, passphrase = null) {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Si no se provee passphrase explícita, derivar de la máquina (nunca string literal en código)
  const effectivePassphrase = passphrase || deriveMachineEntropy();

  const keystorePath = path.join(storageDir, 'keystore.json');

  if (fs.existsSync(keystorePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
      let privateKeyHex;
      try {
        privateKeyHex = decryptPrivateKey(raw.encryptedKey, effectivePassphrase);
      } catch {
        // Migración transparente: si fue cifrado con el seed legacy, descifrar y re-cifrar con entropía de máquina
        privateKeyHex = decryptPrivateKey(raw.encryptedKey, 'apocalipto-local-seed');
        const reEncrypted = encryptPrivateKey(privateKeyHex, effectivePassphrase);
        raw.encryptedKey = reEncrypted;
        raw.migratedAt = Date.now();
        fs.writeFileSync(keystorePath, JSON.stringify(raw, null, 2), 'utf8');
      }
      return {
        nodeId: raw.nodeId,
        publicKey: raw.publicKey,
        privateKey: privateKeyHex
      };
    } catch {
      // Si el archivo está dañado de forma irremediable, generar nueva identidad
    }
  }

  // Generar nueva identidad
  const identity = generateIdentityKeyPair();
  const encryptedKey = encryptPrivateKey(identity.privateKey, effectivePassphrase);

  const keystoreData = {
    nodeId: identity.nodeId,
    publicKey: identity.publicKey,
    encryptedKey,
    createdAt: Date.now()
  };

  fs.writeFileSync(keystorePath, JSON.stringify(keystoreData, null, 2), 'utf8');

  return identity;
}
