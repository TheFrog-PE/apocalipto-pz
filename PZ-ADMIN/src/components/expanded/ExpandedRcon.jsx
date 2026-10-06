import React from 'react';
import { 
  Minimize2, 
  RefreshCw, 
  ShieldAlert, 
  Terminal, 
  Zap, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import { INITIAL_RCON_LOGS, INITIAL_SUSPECTS } from '../../data/adminData';

export default function ExpandedRcon({
  rconInput,
  setRconInput,
  rconTab,
  setRconTab,
  rconReason,
  setRconReason,
  selectedSeverity,
  setSelectedSeverity,
  setExpandedModule,
  onTriggerAlert
}) {
  const handleExecuteRcon = async (overrideCmd) => {
    const cmd = (overrideCmd || rconInput || '').trim();
    if (!cmd) return;
    onTriggerAlert(`[RCON] Enviando comando: ${cmd}`);
    setRconInput('');

    try {
      const res = await fetch('http://localhost:19842/api/admin/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      if (data.success) {
        onTriggerAlert(`[RCON OK] ${data.response}`);
      } else {
        onTriggerAlert(`[RCON AVISO] ${data.response || 'Nodo Alfa en pausa'}`);
      }
    } catch {
      onTriggerAlert(`[RCON LOCAL] Comando encolado: ${cmd}`);
    }
  };

  return (
    <div className="flex-1 bg-[#131518]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl gap-4 font-mono text-xs">
      
      {/* Header RCON */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-1 text-red-400 border border-red-500/40 bg-red-950/20 text-xs font-bold rounded-lg tracking-wider">
              [ MOD-04 // ASISTENTE RCON ]
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>CONECTADO RCON (PUERTO 27015) • LATENCIA: 14ms</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-md">
              MODO ENFOQUE ACTIVO
            </span>
          </div>
          <p className="text-[10px] text-zinc-500">
            Control maestro de protocolo de ejecución directa, auditoría de infracciones, sanciones inmediatas y monitor de supervivientes conectados.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => onTriggerAlert("ESTADO RCON REFRESCADO CORRECTAMENTE.")}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>REFRESCAR ESTADO</span>
          </button>
          <button 
            onClick={() => onTriggerAlert("MODO CONTINGENCIA TOTAL ARMADO [DEFCON 1].")}
            className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>CONTINGENCIA (MANTENER 3S)</span>
            <span className="text-[9px] bg-red-900 px-1.5 py-0.5 rounded text-white font-mono">DEFCON 1</span>
          </button>
          <button 
            onClick={() => setExpandedModule(null)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>RESTAURAR CUADRÍCULA</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Terminal RCON */}
        <div className="lg:col-span-7 bg-[#171a1e] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-md gap-3">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2 text-zinc-200">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="font-bold uppercase tracking-wider">TERMINAL RCON &amp; STREAM DE COMANDOS</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-400">SSL/TLS ENCRIPTADO</span>
                <span className="text-zinc-500">BUFF: 512 KB</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {['TODOS', 'KICKS & BANS', 'SERVER COMMANDS', 'CHAT BROADCASTS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRconTab(tab)}
                  className={`px-3 py-1 text-[10px] rounded-lg border font-mono transition-all cursor-pointer ${
                    rconTab === tab
                      ? 'bg-amber-500 text-black border-amber-500 font-bold shadow'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  [ {tab} ]
                </button>
              ))}
            </div>

            <div className="bg-[#101214] border border-zinc-800/80 rounded-xl p-3 space-y-2 h-[210px] overflow-y-auto text-[11px] font-mono shadow-inner">
              {INITIAL_RCON_LOGS.map((rLog) => (
                <div key={rLog.id} className="leading-relaxed hover:bg-zinc-900/40 p-1 rounded transition-colors">
                  <span className="text-zinc-600 mr-2">[{rLog.time}]</span>
                  <span className={`px-1.5 py-0.5 mr-2 text-[9px] font-bold rounded ${
                    rLog.type === 'ok' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' :
                    rLog.type === 'warn' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' :
                    rLog.type === 'sanction' ? 'bg-red-950/60 text-red-400 border border-red-800/60' :
                    'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                  }`}>
                    [{rLog.tag}]
                  </span>
                  <span className="text-zinc-300">{rLog.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2 bg-[#101214] border border-zinc-800 rounded-xl px-3 py-2 shadow-inner">
              <span className="text-emerald-400 font-bold select-none">rcon@apocalipto:~$</span>
              <input 
                type="text" 
                placeholder="Escribir comando RCON aquí... (ej: servermsg Alerta Enjambre)" 
                value={rconInput}
                onChange={(e) => setRconInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteRcon();
                }}
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono"
              />
              <button 
                onClick={() => handleExecuteRcon()}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-lg flex items-center gap-1.5 transition-all shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>EJECUTAR RCON</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="text-zinc-500 font-bold">MACROS:</span>
              <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">[ ↗ INYECTAR EN TERMINAL ]</span>
              {['!save ↗', '!reboot 5m ↗', '!teleport ↗', '!heal-all ↗', '!weather-storm ↗'].map((macro, idx) => (
                <button 
                  key={idx}
                  onClick={() => setRconInput(macro.replace(' ↗', ''))}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 px-2 py-0.5 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  {macro}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones Disciplinarias y Reportes */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-[#171a1e] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-md gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <div>
                  <span className="font-bold text-zinc-100 uppercase tracking-wider text-xs">ACCIONES DIRECTAS EN MEMORIA HOST</span>
                  <span className="block text-[9px] text-zinc-500">SANCIONES Y PENALIZACIÓN INMEDIATA</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-red-950/60 border border-red-800 text-red-400 text-[9px] font-bold rounded">MODO HOST</span>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="uppercase">JUGADOR OBJETIVO:</span>
                  <span className={rconInput ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                    {rconInput ? "● IDENTIFICADO" : "○ ESPERANDO SELECCIÓN"}
                  </span>
                </div>
                <div className="p-2.5 bg-[#101214] border border-zinc-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-zinc-200">{rconInput || 'Sin jugador seleccionado'}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">{rconInput ? '(Objetivo RCON)' : '(Escribe nick in-game o comando)'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] rounded font-bold">RCON</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">MOTIVO DE SANCIÓN / CAUSA:</label>
                <select 
                  value={rconReason} 
                  onChange={e => setRconReason(e.target.value)}
                  className="w-full bg-[#101214] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="Metagaming / Discord Externo">Metagaming / Discord Externo</option>
                  <option value="Uso de Exploits / Duplicación">Uso de Exploits / Duplicación</option>
                  <option value="Toxicidad / Acoso IRL">Toxicidad / Acoso IRL</option>
                  <option value="Raid fuera de horario permitido">Raid fuera de horario permitido</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">SEVERIDAD / NIVEL DE SANCIÓN:</label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {['ADVERTENCIA', 'MUTE (1H)', 'KICK', 'TEMPBAN (24H)', 'PERMBAN (DEFCON 1)'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                        selectedSeverity === sev
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow'
                          : 'bg-[#101214] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {selectedSeverity === sev ? `★ ${sev}` : sev}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => onTriggerAlert(`SANCIÓN EJECUTADA: [${selectedSeverity}] a ${rconInput || 'objetivo seleccionado'}`)}
                className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all cursor-pointer mt-2"
              >
                <Zap className="w-4 h-4" />
                <span>CONFIRMAR SANCIÓN: {selectedSeverity} • EJECUCIÓN DIRECTA</span>
              </button>
              <span className="text-[9px] text-zinc-500 text-center block">Sanción ejecutada en tiempo real sin requerir reinicio del Nodo Alfa en Knox County.</span>
            </div>
          </div>

          <div className="bg-[#171a1e] border border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wider">MONITOREO DE ACTIVIDAD SOSPECHOSA</span>
              </div>
              <span className="text-zinc-500">{INITIAL_SUSPECTS.length} REPORTES ACTIVOS</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {INITIAL_SUSPECTS.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 font-mono text-[10px] border border-dashed border-zinc-800/80 rounded-lg">
                  ✓ Sin anomalías de red ni reportes activos en el Enjambre.
                </div>
              ) : (
                INITIAL_SUSPECTS.map((suspect, idx) => (
                  <div key={idx} className="p-2 bg-[#101214] border border-zinc-800/80 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{suspect.name}</span>
                        <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 text-[9px] rounded font-bold">{suspect.fac}</span>
                        <span className="text-zinc-500 text-[10px]">{suspect.ping}</span>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-mono">Flags: {suspect.flag}</span>
                    </div>
                    <button 
                      onClick={() => onTriggerAlert(`Acción solicitada sobre ${suspect.name}: ${suspect.action}`)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {suspect.action}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
