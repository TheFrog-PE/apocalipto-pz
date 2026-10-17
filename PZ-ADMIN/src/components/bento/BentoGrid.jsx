import React from 'react';
import { 
  Maximize2, 
  Send, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  User, 
  Users,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import GlobalBroadcastBar from '../layout/GlobalBroadcastBar';

export default function BentoGrid({
  // Chat state
  messages,
  chatFilter,
  setChatFilter,
  chatInput,
  setChatInput,
  handleSendMessage,
  // Whitelist state
  applicants,
  auditedCount,
  handleWhitelistAction,
  handleResetSwarm,
  // Factions state
  factions,
  updateFactionSlots,
  toggleFactionLock,
  // RCON state
  rconTarget,
  setRconTarget,
  rconReason,
  setRconReason,
  // Broadcast state
  broadcastMessage,
  setBroadcastMessage,
  // Handlers
  setExpandedModule,
  onTriggerAlert,
  onOpenFactionMembers
}) {
  const totalOccupied = factions.reduce((acc, f) => acc + (f.current || 0), 0);

  return (
    <div className="flex flex-col gap-3 flex-1 font-mono text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        
        {/* ========================================================================= */}
        {/* CUADRANTE 1: RADIO CHAT */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-[#131518]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl flex flex-col justify-between shadow-xl overflow-hidden hover:border-zinc-700/80 transition-all">
          <div>
            <div className="px-3.5 sm:px-4 py-2.5 bg-[#171a1e] border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="font-bold text-[11px] sm:text-xs">[ MOD-01 // RADIO CHAT ]</span>
                <span className="text-zinc-200 text-[10px] sm:text-xs hidden sm:inline">FRECUENCIA KNOX 91.4 MHZ</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <span className="text-[10px] text-emerald-500">EN DIRECTO • SYNC 12ms</span>
                <button 
                  onClick={() => setExpandedModule('chat')} 
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                  title="Maximizar módulo de Chat"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-3 sm:px-4 py-1.5 bg-[#101214] border-b border-zinc-900 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                {['TODOS', 'RADIO 91.4', 'LOCAL', 'COMBATE'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setChatFilter(f)}
                    className={`px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] rounded-md border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      chatFilter === f 
                        ? 'bg-zinc-800 text-white border-zinc-600 font-bold' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    [ {f} ]
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0 hidden sm:inline">CRIPTO-SYNC</span>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5 max-h-[220px] overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="leading-relaxed hover:bg-zinc-900/40 p-1 rounded transition-colors text-[10px] sm:text-[11px]">
                  <span className="text-zinc-600 mr-2">[{m.time}]</span>
                  <span className={`px-1.5 py-0.5 mr-2 text-[9px] font-bold rounded ${
                    m.type === 'radio' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60' :
                    m.type === 'local' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' :
                    m.type === 'kill' ? 'bg-red-950/60 text-red-400 border border-red-800/60' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {m.channel}
                  </span>
                  <span className="font-bold text-zinc-300 mr-2">{m.author}:</span>
                  <span className="text-zinc-400">{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-2.5 sm:p-3 border-t border-zinc-800 bg-[#171a1e] flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Transmitir por Radio Knox 91.4 MHz (Enter para enviar)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-[#0f1113] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors min-w-0"
            />
            <button type="submit" className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer shrink-0">
              <Send className="w-3 h-3 stroke-[2.5]" />
              <span>TRANSMITIR</span>
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* CUADRANTE 2: ASPIRANTES WHITELIST */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-[#131518]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl flex flex-col justify-between shadow-xl overflow-hidden hover:border-zinc-700/80 transition-all">
          <div>
            <div className="px-3.5 sm:px-4 py-2.5 bg-[#171a1e] border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="font-bold text-[11px] sm:text-xs">[ MOD-02 // WHITELIST ]</span>
                <span className="text-zinc-200 text-[10px] sm:text-xs">ASPIRANTES</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                {handleResetSwarm && (
                  <button
                    onClick={handleResetSwarm}
                    className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/70 text-zinc-400 hover:text-amber-400 text-[9px] rounded font-mono transition-colors cursor-pointer"
                    title="Reiniciar todas las solicitudes y tickets de prueba a cero"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">RESET</span>
                  </button>
                )}
                <span className="text-[10px] text-amber-400/80 hidden sm:inline">CRIPTO DPoH</span>
                <button 
                  onClick={() => setExpandedModule('whitelist')} 
                  className="text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Maximizar módulo de Whitelist"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 space-y-2.5">
              {applicants.length === 0 ? (
                <div className="p-6 sm:p-8 text-center border border-dashed border-zinc-800/80 rounded-xl text-zinc-500 font-mono text-xs my-2 bg-zinc-950/30">
                  <User className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                  <div className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] sm:text-xs">Sin Solicitudes Pendientes</div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Los jugadores que abran el Launcher aparecerán aquí con su <span className="text-cyan-400">Proof of Hardware</span> y lore en tiempo real.
                  </div>
                </div>
              ) : (
                applicants.map((app) => {
                  const fid = (app.factionId || app.faction || 'doe').toLowerCase();
                  const fTag = fid.includes('mok') ? 'MOK' : fid.includes('kto') ? 'KTO' : fid.includes('riv') ? 'RIV' : 'DOE';
                  const fBadgeColor = fid.includes('mok') 
                    ? 'text-red-400 border-red-500/40 bg-red-950/40' 
                    : fid.includes('kto') 
                    ? 'text-amber-400 border-amber-500/40 bg-amber-950/40' 
                    : fid.includes('riv') 
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' 
                    : 'text-blue-400 border-blue-500/40 bg-blue-950/40';

                  return (
                    <div key={app.id} className="p-2.5 bg-[#181a1e] border border-zinc-800/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm hover:border-zinc-700 transition-all">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${fBadgeColor}`}>
                            {fTag}
                          </span>
                          <span className="font-bold text-cyan-400 text-xs font-mono truncate">{app.callsign || app.id}</span>
                          <span className="text-zinc-500 text-[10px]">{app.tag}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {app.steamId} • <span className="text-zinc-400">{app.hours || '4c / 16GB'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 self-end sm:self-center">
                        <button 
                          onClick={() => handleWhitelistAction(app, true)}
                          className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> APROBAR
                        </button>
                        <button 
                          onClick={() => handleWhitelistAction(app, false)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 hover:border-red-600 text-zinc-400 hover:text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <X className="w-3 h-3" /> RECHAZAR
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-zinc-800 bg-[#171a1e] flex items-center justify-between text-[10px] text-zinc-500">
            <span>{auditedCount} AUDITADOS EN KNOX</span>
            <button 
              onClick={() => setExpandedModule('whitelist')} 
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
            >
              [ EXPORTAR LOG ]
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUADRANTE 3: FACCIONES (BENTO) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-[#131518]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-xl hover:border-zinc-700/80 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="font-bold">[ MOD-03 // FACCIONES ]</span>
                <span className="text-zinc-200">BALANZA TÁCTICA &amp; CUPOS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <span className="text-[10px] text-emerald-500">4 FACCIONES (40 SLOTS)</span>
                <button 
                  onClick={() => setExpandedModule('factions')} 
                  className="text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Maximizar módulo de Facciones"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 pt-3">
              {factions.map(f => (
                <div key={f.id} className="p-2.5 bg-[#171a1e] border border-zinc-800/90 rounded-xl flex flex-col justify-between shadow-sm hover:border-zinc-700 transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase">{f.sub}</span>
                        <h4 className="font-bold text-zinc-100 text-xs">{f.name}</h4>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.2 border rounded font-bold ${
                        f.status === 'OPERATIVO' 
                          ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20' 
                          : 'border-amber-500/50 text-amber-400 bg-amber-950/20'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[9px] text-zinc-400 my-1">
                      <span>Cupos:</span>
                      <span className="font-bold text-zinc-200">{f.current} / {f.max}</span>
                    </div>

                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${f.barColor}`} style={{ width: `${(f.current / f.max) * 100}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateFactionSlots(f.id, -1)} 
                        className="w-4 h-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-zinc-200 text-[10px] px-1">{f.max}</span>
                      <button 
                        onClick={() => updateFactionSlots(f.id, 1)} 
                        className="w-4 h-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => toggleFactionLock(f.id)} 
                      className={`px-2 py-0.5 rounded text-[9px] flex items-center gap-1 font-bold border transition-colors cursor-pointer ${
                        f.closed ? 'bg-amber-950/50 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {f.closed ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                      <span>{f.closed ? 'Cerrado' : 'Cerrar'}</span>
                    </button>
                  </div>

                  {/* Botón Ver Miembros */}
                  <button
                    onClick={() => f.current > 0 && onOpenFactionMembers && onOpenFactionMembers(f.id)}
                    disabled={f.current === 0}
                    className={`w-full mt-2 py-1 px-2 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      f.current > 0
                        ? 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/60 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
                    title={f.current > 0 ? `Ver los ${f.current} miembros de ${f.name}` : 'Esta facción no tiene miembros registrados'}
                  >
                    <Users className="w-3 h-3" />
                    <span>{f.current > 0 ? `MIEMBROS (${f.current})` : 'SIN MIEMBROS'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUADRANTE 4: ASISTENTE RCON */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-[#131518]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-xl hover:border-zinc-700/80 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-red-400">
                <span className="font-bold">[ MOD-04 // ASISTENTE RCON ]</span>
                <span className="text-zinc-200">ACCIONES EN MEMORIA HOST</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <span className="text-[10px] text-red-400">PUERTO 27015</span>
                <button 
                  onClick={() => setExpandedModule('rcon')} 
                  className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Maximizar módulo RCON"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase mb-1">NICK IN-GAME O STEAMID:</label>
                <input 
                  type="text" 
                  placeholder="ej. ZombieSlayer99 o Sgto_Miller" 
                  value={rconTarget} 
                  onChange={e => setRconTarget(e.target.value)}
                  className="w-full bg-[#0f1113] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-600 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-400 uppercase mb-1">MOTIVO DE SANCIÓN:</label>
                <select 
                  value={rconReason} 
                  onChange={e => setRconReason(e.target.value)}
                  className="w-full bg-[#0f1113] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none transition-colors"
                >
                  <option value="Metagaming / Discord Externo">Metagaming / Discord Externo</option>
                  <option value="Uso de Exploits / Duplicación">Uso de Exploits / Duplicación</option>
                  <option value="Toxicidad / Acoso IRL">Toxicidad / Acoso IRL</option>
                  <option value="Raid fuera de horario permitido">Raid fuera de horario permitido</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => onTriggerAlert(`Kick ejecutado a ${rconTarget || '[OBJETIVO]'}`)} 
                  className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold uppercase rounded-lg transition-colors cursor-pointer"
                >
                  ▲ KICK
                </button>
                <button 
                  onClick={() => onTriggerAlert(`BAN PERMANENTE aplicado a ${rconTarget || '[OBJETIVO]'}`)} 
                  className="py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold uppercase rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all cursor-pointer"
                >
                  🚫 BAN PERM.
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN INFERIOR: BROADCAST RCON GLOBAL Y BOTONES DE EMERGENCIA */}
      {/* ========================================================================= */}
      <GlobalBroadcastBar
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        onTriggerAlert={onTriggerAlert}
        totalOccupied={totalOccupied}
      />
    </div>
  );
}
