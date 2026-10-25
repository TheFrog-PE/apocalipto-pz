import path from 'node:path';
import { loadOrInitIdentity } from '../crypto/keys.js';
import { SwarmBridgeServer } from '../network/swarmBridge.js';

/**
 * Inicia el Servidor de Señalización del Enjambre (Swarm Bridge Daemon)
 * El tráfico de juego de Playit.gg viaja directamente a Project Zomboid (16261).
 */
async function main() {
  const storageDir = path.join(process.cwd(), '.apocalipto_chain');
  const keystoreDir = path.join(storageDir, 'keystore');
  const bridgeDir = path.join(storageDir, 'bridge');

  // Identidad del creador/admin
  const creatorAdmin = loadOrInitIdentity(keystoreDir, 'apocalipto-local-seed');
  console.log('================================================================');
  console.log('📡 APOCALIPTO PZ: SWARM BRIDGE DAEMON EN LÍNEA');
  console.log('================================================================');
  console.log(`• Creador Root NodeID: ${creatorAdmin.nodeId}`);
  console.log(`• Almacenamiento:      ${bridgeDir}`);
  console.log('• Tráfico de Juego:    DIRECTO A PROJECT ZOBOID NATIVO (16261)');

  const bridge = new SwarmBridgeServer({
    port: 19842,
    storageDir: bridgeDir,
    adminIdentity: creatorAdmin
  });

  const port = await bridge.start();
  console.log(`• Puerto Activo:       http://localhost:${port}`);
  console.log('• Estado:              ESCUCHANDO REGISTROS DE JUGADORES');
  console.log('================================================================\n');

  // Mantener proceso vivo
  process.on('SIGINT', () => {
    console.log('\n[Bridge] Deteniendo servidor de señalización...');
    bridge.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[Bridge] Error fatal:', err);
  process.exit(1);
});
