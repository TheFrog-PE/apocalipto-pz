/**
 * Despliega el Preset Maestro de Servidor de Apocalipto PZ en el directorio local de Zomboid.
 * Copia:
 *  - ApocaliptoPZ.ini
 *  - ApocaliptoPZ_SandboxVars.lua
 *  - ApocaliptoPZ_spawnregions.lua
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function deployServerPreset() {
  const userProfile = os.homedir();
  const targetServerDir = path.join(userProfile, 'Zomboid', 'Server');
  const sourceTemplatesDir = path.join(__dirname, '..', 'templates', 'server');

  console.log('[+] Desplegando Preset Maestro de Apocalipto PZ...');
  console.log(`    Origen:  ${sourceTemplatesDir}`);
  console.log(`    Destino: ${targetServerDir}`);

  if (!fs.existsSync(targetServerDir)) {
    fs.mkdirSync(targetServerDir, { recursive: true });
  }

  const files = [
    'ApocaliptoPZ.ini',
    'ApocaliptoPZ_SandboxVars.lua',
    'ApocaliptoPZ_spawnregions.lua'
  ];

  for (const file of files) {
    const srcFile = path.join(sourceTemplatesDir, file);
    const destFile = path.join(targetServerDir, file);

    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      const stats = fs.statSync(destFile);
      console.log(`    ✓ ${file} instalado (${stats.size} bytes)`);
    } else {
      console.warn(`    ⚠ Archivo no encontrado: ${srcFile}`);
    }
  }

  console.log('\n[✓] Preset Maestro "ApocaliptoPZ" instalado con éxito en Zomboid/Server.');
  console.log('    • Nombre de Servidor: ApocaliptoPZ');
  console.log('    • Facciones y Spawns: DOE, MOK, KTO, RIV');
  console.log('    • Reglas: 14 Días Post-Infección (Agua y Luz Cortadas, Zombies Horda)');
}

// Ejecución directa
deployServerPreset();
