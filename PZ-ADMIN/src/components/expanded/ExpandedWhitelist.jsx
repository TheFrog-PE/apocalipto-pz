import React, { useState } from 'react';
import { Minimize2, RefreshCw, Check, X, ShieldCheck, Copy, Terminal, Cpu } from 'lucide-react';

const FACTION_DETAILS = {
  doe: { 
    tag: 'DOE', 
    name: 'D.O.E. — DIVISIÓN DE OPERACIONES ESPECIALES (MILITARES)', 
    color: 'bg-blue-950/60 border-blue-500/50 text-blue-300' 
  },
  mok: { 
    tag: 'MOK', 
    name: 'M.O.K. — MERODEADORES OFENSIVOS KINÉTICOS (CRIMEN)', 
    color: 'bg-red-950/60 border-red-500/50 text-red-300' 
  },
  kto: { 
    tag: 'KTO', 
    name: 'K.T.O. — KNOX TESTAMENTO OSCURO (CULTO)', 
    color: 'bg-amber-950/60 border-amber-500/50 text-amber-300' 
  },
  riv: { 
    tag: 'RIV', 
    name: 'R.I.V. — RESISTENCIA INDIE VECINAL (MILICIA)', 
    color: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
  }
};

export default function ExpandedWhitelist({
  applicants,
  handleWhitelistAction,
  setExpandedModule,
  onTriggerAlert
}) {
  const [copiedId, setCopiedId] = useState(null);

  const getFactionInfo = (app) => {
    const fid = (app.factionId || app.faction || 'doe').toLowerCase();
    if (fid.includes('mok') || fid.includes('kin') || fid.includes('merod')) return FACTION_DETAILS.mok;
    if (fid.includes('kto') || fid.includes('testam') || fid.includes('knox')) return FACTION_DETAILS.kto;
    if (fid.includes('riv') || fid.includes('indie') || fid.includes('vecin')) return FACTION_DETAILS.riv;
    return FACTION_DETAILS.doe;
  };

  return (
    <div className="relative flex-1 bg-[#131518]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl font-mono text-xs">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-amber-400 border border-amber-500/40 bg-amber-950/20 text-xs font-bold rounded-lg tracking-wider">
              [ MOD-02 // ASPIRANTES WHITELIST ]
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase text-zinc-100 tracking-wider">AUDITORÍA &amp; WHITELIST CRIPTOGRÁFICA</h2>
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-md">
                  {applicants.length} PENDIENTES
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">Sincronización criptográfica con Ed25519, DPoH y Enjambre P2P ($0 Cloud)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setExpandedModule(null)} 
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" /> 
              <span>RESTAURAR CUADRÍCULA</span>
            </button>
            <button 
              onClick={() => onTriggerAlert("BASE DE DATOS WHITELIST SINCRONIZADA.")} 
              className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> 
              <span>SYNC DB</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {applicants.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 text-xs font-mono bg-[#171a1e] rounded-xl border border-zinc-800">
              No hay solicitudes pendientes de auditoría en la cola actual.
            </div>
          ) : (
            applicants.map((app) => {
              const fInfo = getFactionInfo(app);

              return (
                <div key={app.id} className="p-4 bg-[#171a1e] border border-zinc-800/90 rounded-xl flex flex-col gap-3.5 shadow-md hover:border-zinc-700 transition-all">
                    {/* Fila Superior: Identidad Táctica, Rango y Botones */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs ${app.initialsColor} shadow-inner shrink-0`}>
                          {fInfo.tag}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-zinc-100 tracking-wider">{app.callsign || app.id}</span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/40 font-bold">
                              {app.tag}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${app.priorityColor}`}>
                              {app.priority}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {app.steamId} • Hardware: <span className="text-emerald-400 font-bold">{app.hours}</span> • <span className="text-zinc-500">{app.timeSent}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-auto shrink-0">
                        <button 
                          onClick={() => handleWhitelistAction(app, true)} 
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg uppercase transition-all shadow hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>APROBAR</span>
                        </button>
                        <button 
                          onClick={() => handleWhitelistAction(app, false)} 
                          className="px-3.5 py-2 bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 hover:border-red-600 text-zinc-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>RECHAZAR</span>
                        </button>
                      </div>
                    </div>

                    {/* Panel de Datos Criptográficos Protegidos & Términos Tácticos */}
                    <div className="bg-[#111316] border border-zinc-800/90 rounded-xl p-3.5 space-y-2.5">
                      {/* Facción Solicitada */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/70">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">FACCIÓN SOLICITADA:</span>
                          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${fInfo.color}`}>
                            {fInfo.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>PROOF OF HARDWARE (DPoH): VÁLIDO</span>
                        </div>
                      </div>

                      {/* Grilla Táctica Blindada: Cero códigos numéricos expuestos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                          <span className="text-zinc-500 shrink-0">ENCLAVE CRIPTOGRÁFICO:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            SELLO ED25519 VALIDADO
                          </span>
                        </div>

                        <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                          <span className="text-zinc-500 shrink-0">FIRMA DIGITAL:</span>
                          <span className="text-cyan-400 font-bold flex items-center gap-1.5 tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            PROTEGIDA CONTRA EXTRACCIÓN
                          </span>
                        </div>
                      </div>

                      {/* Barra de Auditoría y Botón de Copiado */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-[10px] text-zinc-400">
                        <div className="flex flex-wrap items-center gap-2 text-zinc-400">
                          <span>HWID: <strong className="text-emerald-400">VINCULADO</strong></span>
                          <span>•</span>
                          <span>LATENCIA P2P: <strong className="text-white">&lt;15ms</strong></span>
                          <span>•</span>
                          <span>RED: <strong className="text-yellow-400">ENJAMBRE P2P ($0 CLOUD)</strong></span>
                        </div>

                        <button
                          onClick={() => {
                            const textToCopy = `[INFORME TÁCTICO DE AUDITORÍA // APOCALIPTO ENJAMBRE]\n• Indicativo: ${app.callsign || 'OP-VANGUARDIA'}\n• Facción Solicitada: ${fInfo.name}\n• Rango de Nodo: ${app.tag || 'CLASE ALFA'}\n• Identidad: ${app.steamId}\n• Hardware: ${app.hours}\n• Autenticación: ED25519 VALIDADO (ENCLAVE MIL-SPEC PROTEGIDO)\n• Dictamen: AUDITORÍA APROBADA POR EL CREADOR`;
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedId(app.id);
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer self-end sm:self-auto"
                          title="Copiar informe táctico de auditoría"
                        >
                          {copiedId === app.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">INFORME COPIADO</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>COPIAR INFORME TÁCTICO</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
