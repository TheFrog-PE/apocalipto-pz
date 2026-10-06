import fs from 'node:fs';

const iniPath = 'C:\\Users\\The Frog\\Zomboid\\Server\\ApocaliptoPZ.ini';
let content = fs.readFileSync(iniPath, 'utf8');

// 1. Open=false (Whitelist obligatoria)
content = content.replace(/^Open=.*$/m, 'Open=false');

// 2. Map (Expandir a los 4 territorios y ciudades principales)
content = content.replace(
  /^Map=.*$/m,
  'Map=Riverside, KY;Rosewood, KY;West Point, KY;March Ridge, KY;Fallas Lake, KY;Muldraugh, KY'
);

// 3. RCONPassword (Clave segura de consola remota para Bento OS)
content = content.replace(
  /^RCONPassword=.*$/m,
  'RCONPassword=ApocaliptoSwarm2026SecureRCON#Root!'
);

// 4. SaveWorldEveryMinutes (Autoguardado periódico cada 15 min)
content = content.replace(
  /^SaveWorldEveryMinutes=.*$/m,
  'SaveWorldEveryMinutes=15'
);

fs.writeFileSync(iniPath, content, 'utf8');

console.log('✅ ApocaliptoPZ.ini actualizado con éxito:');
console.log('  • Open:                 false (Whitelist estricta)');
console.log('  • Map:                  Riverside, Rosewood, West Point, March Ridge, Fallas Lake, Muldraugh');
console.log('  • RCONPassword:         Configurada (ApocaliptoSwarm2026SecureRCON#Root!)');
console.log('  • SaveWorldEveryMinutes: 15 min');
