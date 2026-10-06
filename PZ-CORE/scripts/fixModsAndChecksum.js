import fs from 'node:fs';

console.log('=== APLICANDO CORRECCIÓN DE MODS Y CHECKSUM ===\n');

// 1. Corregir servertest.ini
const servertestPath = 'C:\\Users\\The Frog\\Zomboid\\Server\\servertest.ini';
if (fs.existsSync(servertestPath)) {
  let content = fs.readFileSync(servertestPath, 'utf8');

  // a) DoLuaChecksum=false
  content = content.replace(/^DoLuaChecksum=.*$/m, 'DoLuaChecksum=false');

  // b) ST_PryOpen -> STA_PryOpen
  content = content.replace(/\bST_PryOpen\b/g, 'STA_PryOpen');

  fs.writeFileSync(servertestPath, content, 'utf8');
  console.log('✓ servertest.ini actualizado:');
  console.log('  • DoLuaChecksum: false (evita expulsión por CleanHotBar)');
  console.log('  • ST_PryOpen corregido a STA_PryOpen');
}

// 2. Corregir default.txt
const defaultTxtPath = 'C:\\Users\\The Frog\\Zomboid\\mods\\default.txt';
if (fs.existsSync(defaultTxtPath)) {
  let content = fs.readFileSync(defaultTxtPath, 'utf8');
  content = content.replace(/\bST_PryOpen\b/g, 'STA_PryOpen');
  fs.writeFileSync(defaultTxtPath, content, 'utf8');
  console.log('✓ default.txt actualizado (STA_PryOpen activado).');
}

// 3. Sincronizar en ApocaliptoPZ.ini
const apocaliptoPaths = [
  'C:\\Users\\The Frog\\Zomboid\\Server\\ApocaliptoPZ.ini',
  'E:\\PZ-PROYECT\\PZ-CORE\\templates\\server\\ApocaliptoPZ.ini',
  'E:\\PZ-PROYECT\\PZ-CORE\\server_configs\\ApocaliptoPZ.ini'
];

for (const apPath of apocaliptoPaths) {
  if (fs.existsSync(apPath)) {
    let content = fs.readFileSync(apPath, 'utf8');
    content = content.replace(/^DoLuaChecksum=.*$/m, 'DoLuaChecksum=false');
    content = content.replace(/\bST_PryOpen\b/g, 'STA_PryOpen');
    fs.writeFileSync(apPath, content, 'utf8');
    console.log(`✓ ${apPath} sincronizado con DoLuaChecksum=false y STA_PryOpen.`);
  }
}

console.log('\n✅ TODAS LAS CONFIGURACIONES FUERON ACTUALIZADAS Y CORREGIDAS.');
