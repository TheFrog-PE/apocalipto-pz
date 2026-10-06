import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadOrInitIdentity,
  sanitizePath,
  ContentAddressableStore,
  SaveChainLedger,
  PZSaveWatcher,
  createBlock,
  signAsWitness
} from '../index.js';

/**
 * Script para capturar el estado real de Project Zomboid,
 * generar el Árbol de Merkle con los archivos reales y emitir el Bloque en la Save-Chain.
 */
async function main() {
  console.log('================================================================');
  console.log('🧟 APOCALIPTO PZ: GENERADOR DE BLOQUE DE ESTADO REAL');
  console.log('================================================================\n');

  // Directorio de almacenamiento seguro de la cadena de bloques
  const storageDir = path.join(process.cwd(), '.apocalipto_chain');
  const casDir = path.join(storageDir, 'cas');
  const ledgerDir = path.join(storageDir, 'ledger');
  const keystoreDir = path.join(storageDir, 'keystore');

  // 1. Cargar o inicializar identidad Ed25519 local (derivación segura de máquina)
  const identity = loadOrInitIdentity(keystoreDir);
  console.log(`[Identidad] NodeID: ${identity.nodeId} (Protegido por Ed25519)`);

  // 2. Inicializar Almacén Direccionado por Contenido (CAS) y Libro Mayor (Ledger)
  const cas = new ContentAddressableStore(casDir);
  const ledger = new SaveChainLedger(ledgerDir);

  // 3. Crear Bloque Génesis si no existe
  if (ledger.getHeight() === 0) {
    console.log('[Ledger] Inicializando Bloque Génesis #0...');
    const genesis = ledger.initGenesis(identity.nodeId, identity.privateKey);
    console.log(`  ✓ Bloque Génesis #0 emitido. Hash: ${genesis.blockHash}`);
  }

  // 4. Ruta de guardado real de Project Zomboid (ApocaliptoPZ como objetivo primario)
  const userHome = os.homedir();
  const apocaliptoSave = path.join(userHome, 'Zomboid', 'Saves', 'Multiplayer', 'ApocaliptoPZ');
  const fallbackSave = path.join(userHome, 'Zomboid', 'Saves', 'Multiplayer', 'servertest');
  const realPzSavePath = fs.existsSync(apocaliptoSave) ? apocaliptoSave : fallbackSave;
  console.log(`\n[Scanner] Inspeccionando mundo en: ${sanitizePath(realPzSavePath)}`);

  const watcher = new PZSaveWatcher(realPzSavePath, cas);
  const changes = watcher.scanForChanges();

  console.log(`  ✓ Archivos binarios reales procesados e ingeridos al CAS: ${changes.length}`);

  if (changes.length === 0) {
    console.log('\n[Aviso] No hay cambios nuevos respecto al último bloque.');
    console.log(`Altura actual de la cadena: ${ledger.getHeight()} bloques.`);
    return;
  }

  // Muestra de chunks protegidos por Hash
  console.log('\n[Muestra de Chunks Ingeridos al Árbol de Merkle]:');
  changes.slice(0, 5).forEach((c, idx) => {
    console.log(`  #${idx + 1} ${c.virtualPath} [Hash: ${c.chunkHash.substring(0, 16)}...] (${(c.size / 1024).toFixed(1)} KB)`);
  });
  if (changes.length > 5) {
    console.log(`  ... y ${changes.length - 5} archivos adicionales.`);
  }

  // 5. Emitir nuevo Bloque en la Cadena de Guardados
  const latestBlock = ledger.getLatestBlock();
  const newIndex = latestBlock ? latestBlock.header.index + 1 : 1;
  const prevHash = latestBlock ? latestBlock.blockHash : genesis.blockHash;

  console.log(`\n[Save-Chain] Creando Bloque #${newIndex} firmado por el Alfa...`);
  const newBlock = createBlock({
    index: newIndex,
    prevHash,
    changes,
    alfaNodeId: identity.nodeId,
    alfaPrivateKeyHex: identity.privateKey
  });

  // Simular firmas de consenso de testigos
  signAsWitness(newBlock, 'witness_mock_alpha_01', identity.privateKey);
  signAsWitness(newBlock, 'witness_mock_beta_02', identity.privateKey);
  signAsWitness(newBlock, 'witness_mock_gamma_03', identity.privateKey);

  // Anexar bloque al Ledger inmutable
  ledger.appendBlock(newBlock);

  console.log(`\n================================================================`);
  console.log(`🎉 BLOQUE #${newBlock.header.index} ACREDITADO CON ÉXITO EN EL LEDGER`);
  console.log(`================================================================`);
  console.log(`• Block Hash:        ${newBlock.blockHash}`);
  console.log(`• Prev Hash:         ${newBlock.header.prevHash}`);
  console.log(`• World Merkle Root: ${newBlock.header.merkleRoot}`);
  console.log(`• Chunks Guardados:  ${newBlock.changes.length}`);
  console.log(`• Firmas de Testigo: ${newBlock.witnessSignatures.length} / 3`);
  console.log(`• Altura de Cadena:  ${ledger.getHeight()} bloques`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('\n❌ ERROR:', err);
  process.exit(1);
});
