import fs from 'node:fs';
import path from 'node:path';

const dir = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ProjectZomboid\\steamapps\\workshop\\content\\108600';
const items = fs.readdirSync(dir).filter(x => /^\d+$/.test(x));

const list = [];
for (const id of items) {
  const modDir = path.join(dir, id, 'mods');
  if (fs.existsSync(modDir)) {
    try {
      const sub = fs.readdirSync(modDir);
      for (const s of sub) {
        const info = path.join(modDir, s, 'mod.info');
        if (fs.existsSync(info)) {
          const c = fs.readFileSync(info, 'utf8');
          const name = c.match(/^name\s*=\s*(.+)$/m);
          list.push({ id, modId: s, name: name ? name[1].trim() : s });
          break;
        }
      }
    } catch {}
  }
}

console.log(JSON.stringify(list, null, 2));
