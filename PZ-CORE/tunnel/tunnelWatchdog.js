import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLOUDFLARED_BIN = 'E:\\PZ-PROYECT\\PZ-CORE\\tunnel\\cloudflared.exe';
const LANDING_GATEWAY_FILE = 'E:\\PZ-PROYECT\\PZ-Landing\\public\\swarm-gateway.json';
const LAUNCHER_GATEWAY_FILE = 'E:\\PZ-PROYECT\\PZ-LAUNCHER\\public\\swarm-gateway.json';
const LANDING_REPO_DIR = 'E:\\PZ-PROYECT\\PZ-Landing';

let currentTunnelUrl = null;
let cloudflaredProc = null;

function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[TunnelWatchdog ${time}] ${msg}`);
}

function updateGatewayOnGitHub(newUrl) {
  try {
    if (!fs.existsSync(LANDING_GATEWAY_FILE)) return;
    const config = JSON.parse(fs.readFileSync(LANDING_GATEWAY_FILE, 'utf8'));
    if (config.gatewayUrl === newUrl) {
      log(`El gateway ya está actualizado con ${newUrl}`);
      return;
    }

    config.gatewayUrl = newUrl;
    config.updatedAt = new Date().toISOString();

    const jsonStr = JSON.stringify(config, null, 2);
    fs.writeFileSync(LANDING_GATEWAY_FILE, jsonStr, 'utf8');
    if (fs.existsSync(path.dirname(LAUNCHER_GATEWAY_FILE))) {
      fs.writeFileSync(LAUNCHER_GATEWAY_FILE, jsonStr, 'utf8');
    }

    log(`Actualizado swarm-gateway.json localmente con ${newUrl}`);

    // Commit y push a GitHub con las credenciales oficiales
    try {
      execSync('git add public/swarm-gateway.json', { cwd: LANDING_REPO_DIR, stdio: 'ignore' });
      execSync('git commit -m "chore(tunnel-watchdog): auto-actualizar URL de Cloudflare Tunnel"', { cwd: LANDING_REPO_DIR, stdio: 'ignore' });
      execSync('git push origin main', { cwd: LANDING_REPO_DIR, stdio: 'ignore' });
      log(`🚀 ¡URL de Gateway publicada con éxito en GitHub! ${newUrl}`);
    } catch (gitErr) {
      log(`Advertencia en git push: ${gitErr.message}`);
    }
  } catch (err) {
    log(`Error actualizando gateway: ${err.message}`);
  }
}

function startCloudflared() {
  log('Iniciando Cloudflare Tunnel...');
  cloudflaredProc = spawn(CLOUDFLARED_BIN, ['tunnel', '--url', 'http://127.0.0.1:19842'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(urlRegex);
    if (match && match[0]) {
      const detectedUrl = match[0];
      if (detectedUrl !== currentTunnelUrl) {
        currentTunnelUrl = detectedUrl;
        log(`🔗 Nuevo túnel público detectado: ${detectedUrl}`);
        updateGatewayOnGitHub(detectedUrl);
      }
    }
  };

  cloudflaredProc.stdout.on('data', handleOutput);
  cloudflaredProc.stderr.on('data', handleOutput);

  cloudflaredProc.on('exit', (code) => {
    log(`cloudflared se cerró con código ${code}. Reiniciando en 3s...`);
    currentTunnelUrl = null;
    setTimeout(startCloudflared, 3000);
  });
}

// Iniciar
startCloudflared();

// Guardián de salud cada 30 segundos
setInterval(async () => {
  if (!currentTunnelUrl) return;
  try {
    const res = await fetch(`${currentTunnelUrl}/api/health`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      log(`⚠️ Fallo en chequeo de salud HTTP ${res.status}`);
    }
  } catch (e) {
    log(`⚠️ Advertencia de conectividad en túnel: ${e.message}`);
  }
}, 30000);
