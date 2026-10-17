import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLOUDFLARED_BIN = 'E:\\PZ-PROYECT\\PZ-CORE\\tunnel\\cloudflared.exe';
const ROOT_REPO_DIR = 'E:\\PZ-PROYECT';
const ROOT_GATEWAY_FILE = 'E:\\PZ-PROYECT\\public\\swarm-gateway.json';
const LANDING_GATEWAY_FILE = 'E:\\PZ-PROYECT\\PZ-Landing\\public\\swarm-gateway.json';
const LANDING_DIST_GATEWAY_FILE = 'E:\\PZ-PROYECT\\PZ-Landing\\dist\\swarm-gateway.json';
const LAUNCHER_GATEWAY_FILE = 'E:\\PZ-PROYECT\\PZ-LAUNCHER\\public\\swarm-gateway.json';
const TUNNEL_CONFIG_FILE = 'E:\\PZ-PROYECT\\PZ-CORE\\tunnel\\tunnel_config.json';

let currentTunnelUrl = null;
let cloudflaredProc = null;

function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[TunnelWatchdog ${time}] ${msg}`);
}

function updateGatewayOnGitHub(newUrl) {
  try {
    const templateFile = fs.existsSync(LAUNCHER_GATEWAY_FILE) ? LAUNCHER_GATEWAY_FILE : LANDING_GATEWAY_FILE;
    if (!fs.existsSync(templateFile)) return;
    const config = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
    if (config.gatewayUrl === newUrl) {
      log(`El gateway ya está actualizado con ${newUrl}`);
      return;
    }

    config.gatewayUrl = newUrl;
    config.updatedAt = new Date().toISOString();

    const jsonStr = JSON.stringify(config, null, 2);

    // Escribir en todas las ubicaciones requeridas
    const targetFiles = [
      ROOT_GATEWAY_FILE,
      LANDING_GATEWAY_FILE,
      LAUNCHER_GATEWAY_FILE,
      LANDING_DIST_GATEWAY_FILE
    ];

    for (const f of targetFiles) {
      try {
        const dir = path.dirname(f);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(f, jsonStr, 'utf8');
      } catch {}
    }

    // Actualizar tunnel_config.json local
    try {
      if (fs.existsSync(TUNNEL_CONFIG_FILE)) {
        const tConf = JSON.parse(fs.readFileSync(TUNNEL_CONFIG_FILE, 'utf8'));
        if (tConf.bridgeTunnel) {
          tConf.bridgeTunnel.url = newUrl;
          tConf.configuredAt = new Date().toISOString();
          fs.writeFileSync(TUNNEL_CONFIG_FILE, JSON.stringify(tConf, null, 2), 'utf8');
        }
      }
    } catch {}

    log(`Actualizado swarm-gateway.json en todos los puntos locales con ${newUrl}`);

    // Commit y push a GitHub con las credenciales oficiales desde la raíz del repo
    try {
      execSync('git add public/swarm-gateway.json PZ-Landing/public/swarm-gateway.json PZ-LAUNCHER/public/swarm-gateway.json', { cwd: ROOT_REPO_DIR, stdio: 'ignore' });
      execSync('git commit -m "chore(tunnel-watchdog): auto-actualizar URL de Cloudflare Tunnel [skip ci]"', { cwd: ROOT_REPO_DIR, stdio: 'ignore' });
      execSync('git push origin main', { cwd: ROOT_REPO_DIR, stdio: 'ignore' });
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

let consecutiveFailures = 0;

// Guardián de salud cada 20 segundos
setInterval(async () => {
  if (!currentTunnelUrl) return;
  try {
    const res = await fetch(`${currentTunnelUrl}/api/health`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      consecutiveFailures++;
      log(`⚠️ Fallo en chequeo de salud HTTP ${res.status} (${consecutiveFailures}/2)`);
    } else {
      consecutiveFailures = 0;
    }
  } catch (e) {
    consecutiveFailures++;
    log(`⚠️ Advertencia de conectividad en túnel: ${e.message} (${consecutiveFailures}/2)`);
  }

  if (consecutiveFailures >= 2) {
    log('🚨 Túnel caído o inaccesible tras 2 intentos. Reiniciando cloudflared inmediatamente...');
    consecutiveFailures = 0;
    if (cloudflaredProc) {
      try {
        cloudflaredProc.kill('SIGKILL');
      } catch {}
    }
  }
}, 20000);
