import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function wipeAndReset() {
  const userProfile = os.homedir();
  const zomboidDir = path.join(userProfile, 'Zomboid');
  const saveDir = path.join(zomboidDir, 'Saves', 'Multiplayer', 'ApocaliptoPZ');
  const dbDir = path.join(zomboidDir, 'db');
  const serverDb = path.join(dbDir, 'ApocaliptoPZ.db');

  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(zomboidDir, 'backups', `ApocaliptoPZ_PreWipe_${now}`);
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`[WIPE] Carpeta de backup creada: ${backupDir}`);

  // 1. Respaldar y eliminar el guardado del mundo
  if (fs.existsSync(saveDir)) {
    try {
      fs.cpSync(saveDir, path.join(backupDir, 'ApocaliptoPZ_Save'), { recursive: true });
      console.log('[WIPE] Mundo anterior respaldado con éxito.');
    } catch (e) {
      console.warn('[WIPE] Warning respaldando mundo:', e.message);
    }

    try {
      fs.rmSync(saveDir, { recursive: true, force: true });
      console.log('[WIPE] Guardado del mundo eliminado completamente.');
    } catch (e) {
      console.warn('[WIPE] Error eliminando guardado:', e.message);
    }
  }

  // Recrear directorio de guardado vacío para que el servidor lo inicialice en el Día 1
  fs.mkdirSync(saveDir, { recursive: true });
  console.log('[WIPE] Directorio de guardado recreado en blanco.');

  // 2. Respaldar y eliminar ApocaliptoPZ.db
  if (fs.existsSync(serverDb)) {
    try {
      fs.copyFileSync(serverDb, path.join(backupDir, 'ApocaliptoPZ.db'));
      fs.unlinkSync(serverDb);
      console.log('[WIPE] Base de datos del servidor eliminada (reseteando whitelist y jugadores).');
    } catch (e) {
      console.warn('[WIPE] Error con ApocaliptoPZ.db:', e.message);
    }
  }

  // 3. Limpiar guardados locales de clientes (evita chunks o personajes corruptos)
  const mpDir = path.join(zomboidDir, 'Saves', 'Multiplayer');
  if (fs.existsSync(mpDir)) {
    const entries = fs.readdirSync(mpDir);
    for (const entry of entries) {
      if (entry.includes('16261') || entry.includes('rails-switching') || entry.includes('ply.gg')) {
        try {
          fs.rmSync(path.join(mpDir, entry), { recursive: true, force: true });
          console.log(`[WIPE] Limpiado cache de cliente local: ${entry}`);
        } catch {}
      }
    }
  }

  // 4. Reiniciar identidades y accesos del enjambre (Bento OS)
  const chainBridge = path.join(process.cwd(), '.apocalipto_chain', 'bridge');
  if (fs.existsSync(chainBridge)) {
    fs.writeFileSync(path.join(chainBridge, 'applicants.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(chainBridge, 'approved_nodes.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(chainBridge, 'rejected_nodes.json'), '{}', 'utf8');
    console.log('[WIPE] Accesos del Enjambre (Bento OS) reiniciados a CERO (applicants=[], approved={}, rejected={}).');
  }

  // 5. Limpiar tickets e inis temporales
  for (const dir of [zomboidDir, path.join(zomboidDir, 'Lua')]) {
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith('apocalipto_')) {
          try {
            fs.unlinkSync(path.join(dir, f));
            console.log(`[WIPE] Ticket eliminado: ${f}`);
          } catch {}
        }
      }
    }
  }

  console.log('[WIPE] Saneamiento y reseteo completo culminado con éxito.');
}

wipeAndReset();
