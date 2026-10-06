import { generateIdentityKeyPair } from '../crypto/keys.js';
import { generateSignedHardwareProof } from '../hardware/scanner.js';
import { FailoverEngine, FAILOVER_ROLES, FAILOVER_STATES } from '../network/failoverEngine.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * SIMULADOR DE NODO SOMBRA (Amigo remoto P2P)
 *
 * Simula a un amigo conectándose desde otra PC a través del túnel.
 * - Genera su propia identidad criptográfica Ed25519.
 * - Se postula a la facción elegida (ej: DOE).
 * - Espera que el Creador lo apruebe en Bento OS.
 * - Inicia monitoreo en tiempo real de los latidos del Alfa.
 * - Si el Alfa cae, asume el control del Enjambre en < 15s.
 */

// Leer túnel público si existe, sino usar localhost
let gatewayUrl = 'http://localhost:19842';
try {
  const tunnelConfigFile = path.join(process.cwd(), 'tunnel', 'tunnel_config.json');
  if (fs.existsSync(tunnelConfigFile)) {
    const cfg = JSON.parse(fs.readFileSync(tunnelConfigFile, 'utf8'));
    if (cfg.bridgeTunnel?.url) {
      gatewayUrl = cfg.bridgeTunnel.url;
    }
  }
} catch {}

// Permitir pasar URL por línea de comandos: node simulateShadowFriend.js http://localhost:19842
if (process.argv[2]) {
  gatewayUrl = process.argv[2];
}

console.log('\n=============================================================');
console.log('   APOCALIPTO PZ — SIMULADOR DE NODO SOMBRA (AMIGO REMOTO)   ');
console.log('=============================================================');
console.log(`🌐 Gateway del Enjambre: ${gatewayUrl}\n`);

async function main() {
  // 1. Generar identidad independiente
  const friendIdentity = generateIdentityKeyPair();
  const friendSteamId = '76561198' + Math.floor(100000000 + Math.random() * 900000000);
  const friendName = 'Superviviente_Carlos';

  console.log(`[1/4] 🔑 Identidad criptográfica generada:`);
  console.log(`      NodeID:   ${friendIdentity.nodeId}`);
  console.log(`      SteamID:  ${friendSteamId}`);
  console.log(`      Alias:    ${friendName}\n`);

  // 2. Generar prueba de hardware DPoH firmada (sin alterar el payload firmado)
  const signedHardwareProof = generateSignedHardwareProof(friendIdentity);

  // 3. Enviar postulación al Enjambre
  console.log(`[2/4] 📡 Transmitiendo postulación firmada al Gateway del Enjambre...`);
  try {
    const regRes = await fetch(`${gatewayUrl}/api/node/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steamId: friendSteamId,
        faction: 'DOE',
        factionId: 'doe',
        lore: `Nodo Sombra táctico de respaldo (${friendName}) listo para failover.`,
        signedHardwareProof
      })
    });

    const regData = await regRes.json();
    console.log(`      Respuesta: ${regData.status || 'OK'}`);
  } catch (err) {
    console.error(`❌ Error conectando al Gateway (${gatewayUrl}):`, err.message);
    process.exit(1);
  }

  // 4. Polling esperando aprobación en Bento OS
  console.log(`\n[3/4] ⏳ Esperando aprobación del Creador en Bento OS...`);
  console.log(`      👉 Abre tu Bento OS (http://localhost:5174) y haz clic en "Aprobar"`);
  console.log(`      NodeID a aprobar: ${friendIdentity.nodeId}\n`);

  let approvedTicket = null;
  while (!approvedTicket) {
    try {
      const statusRes = await fetch(`${gatewayUrl}/api/node/status/${friendIdentity.nodeId}`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.status === 'APPROVED' && data.ticket) {
          approvedTicket = data.ticket;
          break;
        } else if (data.status === 'REJECTED') {
          console.log('\n❌ La solicitud fue rechazada por el Creador.');
          process.exit(0);
        }
      }
    } catch {}
    process.stdout.write('·');
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n\n[4/4] ✅ ¡SOLICITUD APROBADA POR EL CREADOR!`);
  console.log(`      Ticket Ed25519 válido recibido.`);
  console.log(`      Facción asignada: ${approvedTicket.payload?.faction || 'DOE'}`);
  console.log(`      Rol en el Enjambre: NODO SOMBRA (Standby en caliente)\n`);

  // 5. Iniciar motor de failover en modo SOMBRA
  console.log('=============================================================');
  console.log('   MOTOR DE FAILOVER P2P INICIADO — MONITOREANDO NODO ALFA   ');
  console.log('   Si el Alfa cae (corte de luz o crash), tomaré el control  ');
  console.log('=============================================================\n');

  const engine = new FailoverEngine({
    role: FAILOVER_ROLES.SOMBRA,
    nodeId: friendIdentity.nodeId,
    identity: friendIdentity,
    bridgeUrl: gatewayUrl,
    heartbeatIntervalMs: 5000,
    maxMissedHeartbeats: 3,
    onStateChange: (ev) => {
      const time = new Date(ev.timestamp).toLocaleTimeString();
      if (ev.state === FAILOVER_STATES.ALERT) {
        console.log(`\n⚠️  [${time}] ALERTA: ${ev.detail}`);
      } else if (ev.state === FAILOVER_STATES.CRITICAL) {
        console.log(`\n🚨 [${time}] CRÍTICO: ${ev.detail}`);
      } else if (ev.state === FAILOVER_STATES.MONITORING) {
        console.log(`💚 [${time}] Latidos restaurados. Nodo Alfa respondiendo normalmente.`);
      }
    },
    onPromote: (ev) => {
      console.log('\n=============================================================');
      console.log('   🚨 PROTOCOLO DE RELEVO P2P EJECUTADO CON ÉXITO 🚨       ');
      console.log(`   El Alfa previo (${ev.previousAlfaNodeId}) dejó de responder.`);
      console.log(`   👑 NUEVO NODO ALFA: ${ev.newAlfaNodeId} (Carlos_Shadow)`);
      console.log('   Estado: Asumiendo el hosteo del mundo sin pérdida de datos.');
      console.log('=============================================================\n');
    }
  });

  engine.start();

  // Imprimir pulso visual cada 5s para que el usuario vea el monitoreo en vivo
  setInterval(async () => {
    if (engine.state === FAILOVER_STATES.MONITORING) {
      try {
        const res = await fetch(`${gatewayUrl}/api/failover/status`);
        if (res.ok) {
          const st = await res.json();
          const age = Math.round((Date.now() - (st.lastHeartbeatTimestamp || Date.now())) / 1000);
          console.log(`[MONITOR] Pulso del Alfa (${st.currentAlfaNodeId?.substring(0, 15)}...) OK hace ${age}s | Bloque #${st.blockHeight}`);
        }
      } catch {}
    }
  }, 5000);
}

main().catch(err => console.error(err));
