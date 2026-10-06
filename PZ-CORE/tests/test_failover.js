import { FailoverEngine, FAILOVER_ROLES, FAILOVER_STATES } from '../network/failoverEngine.js';

const BRIDGE_URL = 'http://127.0.0.1:19842';

console.log('================================================================');
console.log('🛡️  TEST DE CONMUTACIÓN POR ERROR (FAILOVER P2P ALFA ➔ SOMBRA)');
console.log('================================================================\n');

async function runTest() {
  // 1. Simular Alfa emitiendo un latido inicial
  console.log('[1/4] Alfa emitiendo latido inicial (node_alfa_test)...');
  const hbRes = await fetch(`${BRIDGE_URL}/api/failover/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: {
        alfaNodeId: 'node_alfa_test_prime',
        timestamp: Date.now(),
        blockHeight: 3,
        blockHash: '00a60207e73665cf2aa2d1a77d6b2ed4ee0974fd13e984f43c39f294540dd5cb'
      }
    })
  });

  const hbData = await hbRes.json();
  console.log(`  ✓ Heartbeat recibido por el Bridge: ACK=${hbData.ack ? 'OK' : 'FAIL'}`);

  // 2. Verificar estado de Alfa en el Bridge
  const statusRes = await fetch(`${BRIDGE_URL}/api/failover/status`);
  const statusData = await statusRes.json();
  console.log(`  ✓ Estado del Bridge: Alfa=${statusData.currentAlfaNodeId}, Status=${statusData.status}, Vivo=${statusData.isAlfaAlive}`);

  if (!statusData.isAlfaAlive) {
    throw new Error('Alfa debería estar vivo tras enviar heartbeat');
  }

  // 3. Probar rechazo de intento de usurpación prematura
  console.log('\n[2/4] Probando rechazo de usurpación prematura (cuando Alfa sigue vivo)...');
  const hijackRes = await fetch(`${BRIDGE_URL}/api/failover/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claimPayload: {
        promotedNodeId: 'node_impostor_sombra',
        reason: 'UNAUTHORIZED_PREMATURE_TAKEOVER'
      }
    })
  });

  if (hijackRes.status === 403) {
    console.log('  ✓ Usurpación prematura BLOQUEADA con 403 (Regla de Consenso cumplida).');
  } else {
    throw new Error(`Usurpación prematura debería fallar con 403, obtuvo: ${hijackRes.status}`);
  }

  // 4. Simular paso del tiempo: Sombra detecta silencio de Alfa
  console.log('\n[3/4] Iniciando Nodo Sombra y simulando corte de luz en el Alfa (silencio)...');

  // Forzar que el Bridge registre el último latido hace 12 segundos para simular la caída del Alfa sin esperar 15s reales
  // (Inyectando un latido antiguo)
  const simulatedPastTime = Date.now() - 12000;
  await fetch(`${BRIDGE_URL}/api/failover/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: {
        alfaNodeId: 'node_alfa_test_prime',
        timestamp: simulatedPastTime,
        blockHeight: 3,
        blockHash: '00a60207e73665cf2aa2d1a77d6b2ed4ee0974fd13e984f43c39f294540dd5cb'
      }
    })
  });

  let promotionExecuted = false;

  const sombraEngine = new FailoverEngine({
    role: FAILOVER_ROLES.SOMBRA,
    nodeId: 'node_sombra_hero_02',
    bridgeUrl: BRIDGE_URL,
    heartbeatIntervalMs: 2000, // más rápido para el test
    maxMissedHeartbeats: 2,
    onStateChange: (e) => {
      console.log(`    ↳ [Transición Sombra] Estado: ${e.state} | Perdidos: ${e.missedCount} | ${e.detail}`);
    },
    onPromote: (e) => {
      promotionExecuted = true;
      console.log(`\n  🎉 [HOOK EJECUTADO] ¡Nodo Sombra promovido oficialmente a nuevo Alfa!`);
      console.log(`     Nuevo Alfa: ${e.newAlfaNodeId} (Anterior: ${e.previousAlfaNodeId})`);
    }
  });

  sombraEngine.start();

  // Esperar a que el motor Sombra complete la conmutación
  await new Promise((resolve) => setTimeout(resolve, 5000));
  sombraEngine.stop();

  if (!promotionExecuted) {
    throw new Error('El protocolo de failover no completó la promoción en el tiempo esperado');
  }

  // 5. Verificar que el Bridge reconozca al nuevo Alfa
  console.log('\n[4/4] Verificando nuevo estado en el Enjambre...');
  const finalStatusRes = await fetch(`${BRIDGE_URL}/api/failover/status`);
  const finalStatus = await finalStatusRes.json();
  console.log(`  ✓ Nuevo Alfa Oficial:  ${finalStatus.currentAlfaNodeId}`);
  console.log(`  ✓ Historial Failover:   ${finalStatus.historyCount} eventos registrados`);

  if (finalStatus.currentAlfaNodeId !== 'node_sombra_hero_02') {
    throw new Error(`El Alfa final no coincide con el Sombra promovido: ${finalStatus.currentAlfaNodeId}`);
  }

  console.log('\n================================================================');
  console.log('✅ TEST DE FAILOVER COMPLETADO CON ÉXITO: 100% FUNCIONAL');
  console.log('================================================================\n');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ ERROR EN EL TEST DE FAILOVER:', err.message);
  process.exit(1);
});
