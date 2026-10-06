// =========================================================================
// DATOS ESTÁTICOS INICIALES PARA EL PANEL CENTRAL // APOCALIPTO PZ ADMIN
// =========================================================================

// COMANDOS RÁPIDOS MACROS (!)
export const MACROS = [
  { id: 1, cmd: '!ALERTA HORDA', param: 'Horda masiva', desc: 'Alerta sonora y radial masiva' },
  { id: 2, cmd: '!Pausa Evento', param: 'Mantenimiento', desc: 'Mantenimiento preventivo de emergencia' },
  { id: 3, cmd: '!Protocolos Enjambre', param: 'Protocolos OOC', desc: 'Broadcast OOC de advertencia punitiva' },
  { id: 4, cmd: '!Frecuencia 91.4', param: 'Canal socorro', desc: 'Sintonizar canal de socorro' },
  { id: 5, cmd: '!Clima Lluvia Acida', param: 'Alerta Lluvia', desc: 'Trigger de evento meteorológico' },
];

// DATOS DEL CHAT INICIAL (LIMPIO PARA DATOS REALES)
export const INITIAL_MESSAGES = [
  { 
    id: 1, 
    time: '12:00', 
    channel: 'SISTEMA', 
    author: 'ENJAMBRE P2P', 
    text: 'Centro de Mando inicializado. Esperando telemetría de los Nodos del Enjambre.', 
    type: 'system' 
  }
];

// DATOS DE WHITELIST (LIMPIO: SOLO ENTRAN SOLICITUDES REALES DEL LAUNCHER)
export const INITIAL_APPLICANTS = [];

// DATOS DE FACCIONES
export const INITIAL_FACTIONS = [
  { 
    id: 'doe', 
    name: 'D.O.E.', 
    sub: 'MIL-SPEC ALPHA', 
    status: 'OPERATIVO', 
    desc: 'Dept. of Emergency (Militar Alfa)',
    leader: 'Sgt. Miller',
    online: 0,
    current: 0, 
    max: 10, 
    closed: false, 
    barColor: 'bg-emerald-500' 
  },
  { 
    id: 'mok', 
    name: 'MOK', 
    sub: 'BANDIT NOMAD', 
    status: 'OPERATIVO', 
    desc: 'Mercenarios de Knox (Forajidos)',
    leader: 'Viper_09',
    online: 0,
    current: 0, 
    max: 10, 
    closed: false, 
    barColor: 'bg-amber-500' 
  },
  { 
    id: 'kto', 
    name: 'KTO', 
    sub: 'CULT OCCULT', 
    status: 'OPERATIVO', 
    desc: 'Cult of the Eclipse (Ocultistas)',
    leader: 'Heraldo Vane',
    online: 0,
    current: 0, 
    max: 10, 
    closed: false, 
    barColor: 'bg-emerald-500' 
  },
  { 
    id: 'riv', 
    name: 'RIV', 
    sub: 'CIVILIAN MILITIA', 
    status: 'OPERATIVO', 
    desc: 'Riverside Civilian Militia (Civiles)',
    leader: 'Cap. Bradley',
    online: 0,
    current: 0, 
    max: 10, 
    closed: false, 
    barColor: 'bg-emerald-500' 
  }
];

// LOGS DEL SISTEMA EN TIEMPO REAL (LIMPIO: REGISTRA EVENTOS REALES)
export const INITIAL_LOGS = [
  { id: 1, time: '12:00:00', tag: 'SISTEMA_OK', text: 'Centro de Mando inicializado. Esperando telemetría de los Nodos del Enjambre.', color: 'text-emerald-400' }
];

// PROTOCOLOS DE SUPERVIVENCIA OFICIALES (SINCRONIZADOS CON EL LAUNCHER)
export const INITIAL_PROTOCOLS = [
  {
    id: 'alpha',
    number: '01',
    code: '01 // CONDUCTA',
    name: 'PROTOCOLO ALFA',
    category: 'CONDUCTA',
    title: 'PROTOCOLO ALFA: TOLERANCIA CERO & CHEATING',
    titleColor: 'text-zinc-100',
    clause: 'Tolerancia cero para el uso de programas de terceros, exploits de duplicación o manipulación del juego. La infracción resulta en un PERMABAN DIRECTO sin posibilidad de apelación. Mantén el rol en todo momento.',
    status: 'VIGENTE',
    critical: false
  },
  {
    id: 'beta',
    number: '02',
    code: '02 // ZONIFICACIÓN',
    name: 'PROTOCOLO BETA',
    category: 'ZONIFICACIÓN',
    title: 'PROTOCOLO BETA: ZONAS SEGURAS & VENTANAS DE RAIDEO',
    titleColor: 'text-amber-500',
    clause: 'Cualquier edificio del mapa puede ser reclamado como refugio legítimo. Los asaltos, incursiones o ataques a refugios solo están permitidos exclusivamente desde el Viernes a las 18:00 hasta el Domingo a las 23:59 (Hora del Enjambre).',
    status: 'VIGENTE',
    critical: false
  },
  {
    id: 'gamma',
    number: '03',
    code: '03 // COMUNICACIONES',
    name: 'PROTOCOLO GAMMA',
    category: 'COMUNICACIONES',
    title: 'PROTOCOLO GAMMA: FRECUENCIAS DE RADIO & METAGAMING',
    titleColor: 'text-cyan-400',
    clause: 'El uso de canales externos, mapas y grupos de WhatsApp está permitido como apoyo logístico táctico, pero no deben reemplazar por completo la interacción u ambientación dentro del Enjambre.',
    status: 'VIGENTE',
    critical: false
  },
  {
    id: 'omega',
    number: '04',
    code: '04 // DEFCON 1',
    name: 'PROTOCOLO OMEGA',
    category: 'LA PURGA',
    title: 'PROTOCOLO OMEGA [NOCHE DE PURGA TOTAL]',
    titleColor: 'text-amber-400',
    clause: 'El último fin de semana de cada mes (In-game), todos los protocolos y zonas seguras quedan anulados. Sin leyes, sin refugios y con muerte permanente (Permadeath) activada, sobrevivir por cualquier medio es la única ley.',
    status: 'DEFCON 1 ACTIVO',
    critical: true
  }
];

// CLÁUSULA DE ROL (SOBRE EL ROL)
export const INITIAL_ROLE_DISCLAIMER = {
  title: 'SOBRE EL ROL',
  text: 'Los jugadores tienen total libertad para hacer alianzas, gankear, traicionar o firmar tratados. Sin embargo, hacer metagaming o trasladar conflictos del juego al entorno IRL (en la vida real) está completamente prohibido. Lo que pasa en el Enjambre, se queda en el Enjambre. Cualquier conducta de toxicidad, acoso o intimidación resultará en un permaban inmediato.'
};

// LOGS RCON DE EJECUCIÓN DIRECTA (LIMPIO: REGISTRA COMANDOS REALES)
export const INITIAL_RCON_LOGS = [
  { id: 1, time: '12:00:00', tag: 'RCON:INFO', text: 'Enlace RCON activo en puerto 27015. Esperando conexiones de supervivientes.', type: 'info' }
];

// REPORTES DE JUGADORES SOSPECHOSOS (LIMPIO: SE REGISTRAN AUTOMÁTICAMENTE SEGÚN TELEMETRÍA)
export const INITIAL_SUSPECTS = [];
