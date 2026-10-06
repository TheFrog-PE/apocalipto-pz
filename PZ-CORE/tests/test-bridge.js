import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateIdentityKeyPair, verifySignature } from '../crypto/keys.js';
import { generateSignedHardwareProof } from '../hardware/scanner.js';
import { SwarmBridgeServer } from '../network/swarmBridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bridgeStorageDir = path.join(__dirname, '.bridge_test_storage');

async function testBridge() {
  console.log('================================================================');
  console.log('🧪 TEST: PUENTE DE SEÑALIZACIÓN Y WHITELIST CRIPTOGRÁFICA');
  console.log('================================================================\n');

  // Identidad del Creador / Admin (Bento OS)
  const creatorAdmin = generateIdentityKeyPair();
  console.log(`[Admin / Creador] NodeID: ${creatorAdmin.nodeId}`);

  // Iniciar servidor del puente
  const bridge = new SwarmBridgeServer({
    port: 19842,
    storageDir: bridgeStorageDir,
    adminIdentity: creatorAdmin
  });

  const port = await bridge.start();
  console.log(`[Bridge Server] Escuchando en puerto seguro: ${port}\n`);

  try {
    // ─── 1. SIMULACIÓN: JUGADOR EXTERNO ABRE EL LAUNCHER EN SU PC ─────────
    console.log('▶ PASO 1: Jugador foráneo abre Launcher, genera identidad y firma DPoH...');
    const playerNode = generateIdentityKeyPair();
    const signedProof = generateSignedHardwareProof(playerNode);
    console.log(`  ✓ Jugador NodeID: ${playerNode.nodeId}`);
    console.log(`  ✓ Hardware Score: ${signedProof.proofPayload.hardwareScore} pts`);
    console.log(`  ✓ Rol reclamado:  ${signedProof.proofPayload.roleClaimed}`);

    // Enviar solicitud de Whitelist al puente
    console.log('\n▶ PASO 2: Jugador envía solicitud de Whitelist al servidor del enjambre...');
    const registerResponse = await fetch(`http://localhost:${port}/api/node/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steamId: '76561198451239801',
        faction: 'DOE',
        lore: 'Ex-ingeniero eléctrico de Louisville. Especialista en telecomunicaciones y drones de reconocimiento.',
        signedHardwareProof: signedProof
      })
    }).then(r => r.json());

    console.log(`  ✓ Respuesta del enjambre: status=${registerResponse.status}, msg="${registerResponse.message}"`);

    // ─── 2. SIMULACIÓN: EL LAUNCHER CONSULTA SU ESTADO (ANTES DE APROBAR) ──
    const statusBefore = await fetch(`http://localhost:${port}/api/node/status/${playerNode.nodeId}`).then(r => r.json());
    console.log(`  ✓ Estado actual en el Launcher: ${statusBefore.status} (Bloqueado esperando al admin)\n`);

    // ─── 3. SIMULACIÓN: TÚ EN TU BENTO OS (PZ-ADMIN) ──────────────────────
    console.log('▶ PASO 3: Tú en Bento OS recibes la lista de aspirantes con hardware verificado...');
    const applicants = await fetch(`http://localhost:${port}/api/admin/applicants`).then(r => r.json());
    console.log(`  ✓ Aspirantes pendientes: ${applicants.length}`);
    console.log(`  ✓ Aspirante #1: SteamID=${applicants[0].steamId}, NodeID=${applicants[0].nodeId}, Score=${applicants[0].score}`);

    // Tú haces clic en [ APROBAR ]
    console.log('\n▶ PASO 4: Tú haces clic en [ APROBAR ] en tu dashboard Bento OS...');
    const approveResponse = await fetch(`http://localhost:${port}/api/admin/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: playerNode.nodeId,
        assignedRole: 'SOMBRA'
      })
    }).then(r => r.json());

    console.log(`  ✓ Ticket criptográfico emitido por el creador: éxito=${approveResponse.success}`);
    console.log(`  ✓ Firma digital del creador adjunta al ticket: ${approveResponse.ticket.creatorSignature.substring(0, 32)}...`);

    // ─── 4. SIMULACIÓN: EL LAUNCHER DEL JUGADOR RECIBE LA APROBACIÓN ───────
    console.log('\n▶ PASO 5: El Launcher del jugador detecta la aprobación y valida la firma del Creador...');
    const statusAfter = await fetch(`http://localhost:${port}/api/node/status/${playerNode.nodeId}`).then(r => r.json());
    console.log(`  ✓ Estado en el Launcher: ${statusAfter.status}!`);

    // El Launcher verifica matemáticamente que la firma provenga de tu clave pública
    const ticketCanonical = JSON.stringify(statusAfter.ticket.payload);
    const isTicketAuthentic = verifySignature(
      ticketCanonical,
      statusAfter.ticket.creatorSignature,
      creatorAdmin.publicKey
    );

    console.log(`  ✓ Autenticidad de la firma del Creador verificada por el Launcher: ${isTicketAuthentic}`);
    if (!isTicketAuthentic) throw new Error('Fallo: Ticket de admisión inválido o falsificado');

    console.log('\n================================================================');
    console.log('🎉 FLUJO COMPLETO LAUNCHER <-> ADMIN VERIFICADO AL 100%');
    console.log('================================================================');
  } finally {
    bridge.stop();
  }
}

testBridge().catch(err => {
  console.error('\n❌ ERROR:', err);
  process.exit(1);
});
