export const LAUNCHER_VERSION = '1.3.5';
export const BOOTSTRAP_REGISTRY_URL = 'https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/public/swarm-gateway.json';
export const FALLBACK_REGISTRY_URL = 'https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/PZ-LAUNCHER/public/swarm-gateway.json';
export const DEFAULT_DOWNLOAD_URL = 'https://github.com/TheFrog-PE/apocalipto-pz/raw/main/public/downloads/ApocaliptoPZ-Setup.exe';

/**
 * Compara dos versiones semver (ej: '1.0.0' vs '1.0.1')
 * Devuelve:
 *   -1 si a < b
 *    0 si a == b
 *    1 si a > b
 */
export function compareVersions(a, b) {
  const pa = (a || '1.0.0').split('.').map(n => parseInt(n, 10) || 0);
  const pb = (b || '1.0.0').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

/**
 * Consulta en GitHub el registro del enjambre para verificar si hay una nueva versión requerida
 */
export async function checkLauncherUpdate() {
  let activeVersion = LAUNCHER_VERSION;
  if (typeof window !== 'undefined' && window.__TAURI__ && window.__TAURI__.invoke) {
    try {
      const nativeVer = await window.__TAURI__.invoke('get_app_version');
      if (nativeVer) {
        // Usar la versión más alta entre la nativa y la embebida en UI para evitar bucles falsos por caché
        activeVersion = compareVersions(LAUNCHER_VERSION, nativeVer) >= 0 ? LAUNCHER_VERSION : nativeVer;
      }
    } catch {}
  }

  const cacheBuster = Date.now();
  const urls = [
    `${BOOTSTRAP_REGISTRY_URL}?t=${cacheBuster}`,
    `${FALLBACK_REGISTRY_URL}?t=${cacheBuster}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const latest = data.latestVersion || data.launcherVersion || '1.0.0';
      const minRequired = data.minRequiredVersion || latest;
      
      const isOutdated = compareVersions(activeVersion, latest) < 0;
      const isRequired = compareVersions(activeVersion, minRequired) < 0;

      return {
        currentVersion: activeVersion,
        latestVersion: latest,
        updateAvailable: isOutdated,
        updateRequired: isRequired,
        downloadUrl: data.downloadUrl || DEFAULT_DOWNLOAD_URL,
        sha256: data.sha256 || data.installerSha256 || '',
        changelog: data.changelog || data.notes || 'Actualización obligatoria para sincronizar con la red P2P del Enjambre.'
      };
    } catch {}
  }

  return { updateAvailable: false, updateRequired: false };
}
