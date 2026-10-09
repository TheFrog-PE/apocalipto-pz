export const LAUNCHER_VERSION = '1.0.9';
export const BOOTSTRAP_REGISTRY_URL = 'https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/public/swarm-gateway.json';
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
  try {
    const cacheBuster = Date.now();
    const res = await fetch(`${BOOTSTRAP_REGISTRY_URL}?t=${cacheBuster}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return { updateAvailable: false, updateRequired: false };
    const data = await res.json();
    const latest = data.latestVersion || data.launcherVersion || '1.0.0';
    const minRequired = data.minRequiredVersion || latest;
    
    const isOutdated = compareVersions(LAUNCHER_VERSION, latest) < 0;
    const isRequired = compareVersions(LAUNCHER_VERSION, minRequired) < 0;

    return {
      currentVersion: LAUNCHER_VERSION,
      latestVersion: latest,
      updateAvailable: isOutdated,
      updateRequired: isRequired,
      downloadUrl: data.downloadUrl || DEFAULT_DOWNLOAD_URL,
      sha256: data.sha256 || '',
      changelog: data.changelog || data.notes || 'Actualización obligatoria para sincronizar con la red P2P del Enjambre.'
    };
  } catch (e) {
    return { updateAvailable: false, updateRequired: false };
  }
}
