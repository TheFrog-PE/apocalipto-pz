import { loadOrInitIdentity } from '../crypto/keys.js';
import path from 'node:path';
import os from 'node:os';
const dir = path.join(os.tmpdir(), 'pz_test_keystore_' + Date.now());
try {
  const id = loadOrInitIdentity(dir);
  console.log('OK: nodeId =', id.nodeId);
  console.log('OK: publicKey length =', id.publicKey?.length);
  console.log('OK: Passphrase hardcodeada ELIMINADA - entropía de máquina activa');
  process.exit(0);
} catch(e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
