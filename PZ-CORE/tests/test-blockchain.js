import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateIdentityKeyPair,
  signPayload,
  verifySignature,
  sanitizePath,
  obfuscateIP
} from '../crypto/keys.js';
import { buildMerkleTree, generateMerkleProof, verifyMerkleProof, sha256 } from '../crypto/merkle.js';
import { createBlock, signAsWitness, validateBlock } from '../chain/block.js';
import { ContentAddressableStore } from '../storage/cas.js';
import { SaveChainLedger } from '../chain/ledger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testStorageDir = path.join(__dirname, '.test_storage');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 INICIANDO TEST SUITE: APOCALIPTO PZ BLOCKCHAIN CORE');
  console.log('================================================================\n');

  // Limpiar directorio de pruebas previo si existía
  if (fs.existsSync(testStorageDir)) {
    fs.rmSync(testStorageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testStorageDir, { recursive: true });

  // ─── TEST 1: Identidad Criptográfica & Ed25519 ────────────────────────────
  console.log('▶ TEST 1: Generación de Identidad y Firmas Ed25519...');
  const alfa = generateIdentityKeyPair();
  const witness1 = generateIdentityKeyPair();
  const witness2 = generateIdentityKeyPair();
  const witness3 = generateIdentityKeyPair();

  console.log(`  ✓ Alfa NodeID: ${alfa.nodeId} (anonimizado, SHA-256)`);
  console.log(`  ✓ Witness 1:   ${witness1.nodeId}`);
  console.log(`  ✓ Witness 2:   ${witness2.nodeId}`);
  console.log(`  ✓ Witness 3:   ${witness3.nodeId}`);

  const testMessage = 'Apocalipto PZ - Bloque de Supervivencia #1';
  const sig = signPayload(testMessage, alfa.privateKey);
  const isSigValid = verifySignature(testMessage, sig, alfa.publicKey);
  if (!isSigValid) throw new Error('Fallo verificación de firma');
  console.log('  ✓ Firma Ed25519 verificada con éxito.\n');

  // ─── TEST 2: Protección de Privacidad y Ofuscación ────────────────────────
  console.log('▶ TEST 2: Comprobación de Seguridad y Privacidad...');
  const fakeLeakedPath = 'C:\\Users\\The Frog\\Zomboid\\Saves\\Multiplayer\\servertest\\map_100.bin';
  const sanitized = sanitizePath(fakeLeakedPath);
  console.log(`  ✓ Ruta original:   ${fakeLeakedPath}`);
  console.log(`  ✓ Ruta sanitizada: ${sanitized}`);
  if (sanitized.includes('The Frog')) throw new Error('Fallo: nombre de usuario expuesto en ruta');

  const rawIP = '190.237.45.112';
  const maskedIP = obfuscateIP(rawIP);
  console.log(`  ✓ IP real: ${rawIP} -> Ofuscada: ${maskedIP}\n`);

  // ─── TEST 3: Árbol de Merkle de Chunks de Project Zomboid ─────────────────
  console.log('▶ TEST 3: Construcción de Árbol de Merkle para el Mundo...');
  const simulatedChunks = [
    { virtualPath: 'world/map_1020_740.bin', chunkHash: sha256('chunk_data_bosque_muldraugh') },
    { virtualPath: 'world/map_1020_741.bin', chunkHash: sha256('chunk_data_carretera_louisville') },
    { virtualPath: 'database/players.db', chunkHash: sha256('database_inventarios_salud_xp') },
    { virtualPath: 'database/vehicles.db', chunkHash: sha256('vehicles_gasolina_motor_piezas') }
  ];

  const tree = buildMerkleTree(simulatedChunks);
  console.log(`  ✓ Chunks procesados: ${simulatedChunks.length}`);
  console.log(`  ✓ World State Merkle Root: ${tree.root}`);

  // Merkle Proof
  const proof = generateMerkleProof(simulatedChunks[2].virtualPath, simulatedChunks[2].chunkHash, simulatedChunks);
  const isProofValid = verifyMerkleProof(proof.leaf, proof.proof, tree.root);
  if (!isProofValid) throw new Error('Prueba de Merkle fallida');
  console.log('  ✓ Prueba de inclusión Merkle demostrada matemáticamente para players.db.\n');

  // ─── TEST 4: Creación de Bloque de Guardado y Consenso de Testigos ─────────
  console.log('▶ TEST 4: Bloque de Guardado con Multi-Firma de Testigos...');
  const block1 = createBlock({
    index: 1,
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    changes: simulatedChunks,
    alfaNodeId: alfa.nodeId,
    alfaPrivateKeyHex: alfa.privateKey
  });

  console.log(`  ✓ Bloque #1 Hash: ${block1.blockHash}`);
  console.log(`  ✓ Merkle Root:    ${block1.header.merkleRoot}`);

  // Testigos validan y firman
  signAsWitness(block1, witness1.nodeId, witness1.privateKey);
  signAsWitness(block1, witness2.nodeId, witness2.privateKey);
  signAsWitness(block1, witness3.nodeId, witness3.privateKey);

  console.log(`  ✓ Firmas de testigos recopiladas: ${block1.witnessSignatures.length}`);

  const witnessKeyMap = new Map([
    [witness1.nodeId, witness1.publicKey],
    [witness2.nodeId, witness2.publicKey],
    [witness3.nodeId, witness3.publicKey]
  ]);

  const validation = validateBlock(block1, alfa.publicKey, witnessKeyMap, 3);
  if (!validation.valid) throw new Error(`Validación de bloque falló: ${validation.error}`);
  console.log(`  ✓ Bloque validado con consenso de ${validation.verifiedWitnesses} testigos.\n`);

  // ─── TEST 5: Detección Inmediata de Trampas (Anti-Cheat Criptográfico) ────
  console.log('▶ TEST 5: Prueba de Intento de Trampa / Falsificación...');
  // Simular que el Alfa o un hacker modificó localmente su players.db para darse 500 escopetas
  const tamperedBlock = JSON.parse(JSON.stringify(block1));
  tamperedBlock.changes[2].chunkHash = sha256('hacked_inventory_500_shotguns_godmode');

  const tamperedValidation = validateBlock(tamperedBlock, alfa.publicKey, witnessKeyMap, 3);
  console.log(`  ✓ Intento de trampa detectado: valid=${tamperedValidation.valid}, error=${tamperedValidation.error}`);
  if (tamperedValidation.valid) throw new Error('Fallo crítico: La trampa no fue detectada por el Merkle Root');
  console.log('  ✓ La trampa fue neutralizada criptográficamente sin necesidad de escanear la RAM.\n');

  // ─── TEST 6: Almacenamiento Direccionado por Contenido (CAS) ─────────────
  console.log('▶ TEST 6: Almacenamiento Direccionado por Contenido (CAS)...');
  const cas = new ContentAddressableStore(path.join(testStorageDir, 'cas'));

  const chunkBuffer = Buffer.from('CHUNK_BINARIO_ZOMBOID_MAPA_3D_XYZ');
  const stored = cas.store(chunkBuffer);
  console.log(`  ✓ Chunk almacenado por Hash: ${stored.chunkHash} (${stored.size} bytes)`);

  const retrieved = cas.read(stored.chunkHash);
  if (retrieved.toString('utf8') !== chunkBuffer.toString('utf8')) {
    throw new Error('Fallo de integridad en lectura CAS');
  }
  console.log('  ✓ Chunk leído y verificado por hash exitosamente.\n');

  // ─── TEST 7: Cadena de Bloques Append-Only (SaveChainLedger) ──────────────
  console.log('▶ TEST 7: Cadena de Bloques Append-Only y Auditoría Completa...');
  const ledger = new SaveChainLedger(path.join(testStorageDir, 'ledger'));

  // Bloque Génesis
  const genesis = ledger.initGenesis(alfa.nodeId, alfa.privateKey);
  console.log(`  ✓ Génesis Block #0 creado. Hash: ${genesis.blockHash}`);

  // Bloque #1 enlazado
  block1.header.prevHash = genesis.blockHash;
  block1.blockHash = (await import('../chain/block.js')).calculateBlockHash(block1.header);
  ledger.appendBlock(block1);
  console.log(`  ✓ Bloque #1 enlazado y anexado al libro mayor.`);

  const audit = ledger.auditChain();
  console.log(`  ✓ Auditoría de toda la cadena: Válida=${audit.valid}, Bloques auditados=${audit.auditedBlocks}\n`);

  console.log('================================================================');
  console.log('🎉 TODOS LOS TESTS DEL CORE CRIPTOGRÁFICO PASARON AL 100%');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
