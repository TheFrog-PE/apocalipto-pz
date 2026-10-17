import React from 'react';
import { 
  Minimize2, 
  Save, 
  RotateCcw, 
  Users, 
  Scale, 
  Shield, 
  Lock, 
  Unlock, 
  Sliders, 
  Download 
} from 'lucide-react';

export default function ExpandedFactions({
  factions,
  totalOccupied,
  totalSlots,
  freeSlots,
  autoLock,
  setAutoLock,
  globalLock,
  toggleGlobalLock,
  updateFactionSlots,
  toggleFactionLock,
  logs,
  handleSaveChanges,
  handleRevert,
  setExpandedModule,
  onTriggerAlert,
  onOpenFactionMembers
}) {
  return (
    <div className="flex-1 bg-[#131518]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl gap-4 font-mono text-xs">
      
      {/* Header del Módulo */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-1 text-emerald-400 border border-emerald-500/40 bg-emerald-950/20 text-xs font-bold rounded-lg tracking-wider">
              [ MOD-03 // GESTIÓN DE CUPOS &amp; BALANZA TÁCTICA ]
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>EN DIRECTO • ORACLE DB SYNC</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-md">
              MODO ENFOQUE ACTIVO
            </span>
          </div>
          <h2 className="text-base font-black uppercase text-zinc-100 tracking-wider">
            Control Operativo de Facciones Oficiales y Simetría de Reclutamiento
          </h2>
          <p className="text-[10px] text-zinc-500">
            Administración en tiempo real de slots por facción militar, insurgente y comunitaria para Knox County Roleplay.
          </p>
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
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs flex items-center gap-2 uppercase transition-all shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>GUARDAR CAMBIOS</span>
          </button>
          <button 
            onClick={handleRevert}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REVERTIR</span>
          </button>
        </div>
      </div>

      {/* Métricas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 bg-[#171a1e] border border-zinc-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">OCUPACIÓN GLOBAL DE CUPOS</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-100">{totalOccupied} / {totalSlots}</span>
              <span className="text-xs font-bold text-emerald-400">{Math.round((totalOccupied / totalSlots) * 100)}% Asignado</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">{freeSlots} slots libres para supervivientes sin facción</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-[#171a1e] border border-zinc-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">ESTADO DE BALANCE SIMÉTRICO</span>
            <div className="flex items-center gap-2 my-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">ESTADO: EQUILIBRADO</span>
            </div>
            <span className="text-[10px] text-zinc-500 block">Variación máxima entre bandos: 2 PJ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-[#171a1e] border border-zinc-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">AUTO-LOCK DINÁMICO</span>
              <span className="px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[9px] rounded font-bold">ACTIVO</span>
            </div>
            <span className="text-xs font-bold text-zinc-200 block">Bloqueo por Desventaja</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Frena creación en facciones saturadas automáticamente</span>
          </div>
          <div 
            onClick={() => setAutoLock(!autoLock)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              autoLock ? 'bg-emerald-600' : 'bg-zinc-800'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              autoLock ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
        </div>
      </div>

      {/* Título de desglose */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
        <div className="flex items-center gap-2 font-bold uppercase text-zinc-200">
          <Shield className="w-4 h-4 text-zinc-400" />
          <span>DESGLOSE DE 4 FACCIONES OFICIALES AUDITADAS</span>
        </div>
        <span className="text-zinc-500 text-[10px]">
          Haz clic en [ - / + ] para calibrar límite de reclutamiento o alterna el cerrojo táctico
        </span>
      </div>

      {/* Grid de las 4 Facciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {factions.map((f) => (
          <div 
            key={f.id}
            className="p-3.5 bg-[#171a1e] border border-zinc-800 rounded-xl flex flex-col justify-between shadow-md hover:border-zinc-700 transition-all gap-3"
          >
            <div>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <span className="text-[9px] text-amber-500 font-bold uppercase block">{f.sub}</span>
                  <h3 className="text-base font-black text-zinc-100">{f.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                  f.status === 'OPERATIVO'
                    ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20'
                    : 'border-amber-500/50 text-amber-400 bg-amber-950/20'
                }`}>
                  {f.status}
                </span>
              </div>

              <p className="text-[10px] text-zinc-400 line-clamp-1 leading-snug">{f.desc}</p>
              <p className="text-[9px] text-zinc-500 mt-1">
                Líder: <strong className="text-zinc-300">{f.leader}</strong> • <span className="text-zinc-400">{f.online} Online</span>
              </p>
            </div>

            <div className="bg-[#101214] p-2.5 rounded-lg border border-zinc-800/80">
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Ocupación: <strong className="text-zinc-100">{f.current} Jugadores</strong></span>
                <span className="font-mono text-zinc-500">{f.current}/{f.max}</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${f.barColor}`}
                  style={{ width: `${Math.min(100, (f.current / f.max) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 gap-2">
              <div className="flex items-center gap-1 bg-[#101214] border border-zinc-800 px-2 py-1 rounded-lg">
                <span className="text-zinc-500 font-bold uppercase text-[8px]">TOPE:</span>
                <button 
                  onClick={() => updateFactionSlots(f.id, -1)}
                  className="w-4 h-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-zinc-100 px-1 text-xs">{f.max}</span>
                <button 
                  onClick={() => updateFactionSlots(f.id, 1)}
                  className="w-4 h-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => toggleFactionLock(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  f.closed
                    ? 'bg-amber-950/50 border-amber-500/70 text-amber-400 shadow'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
                }`}
              >
                {f.closed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{f.closed ? '[ CERRADO ]' : '[ RECLUTANDO ]'}</span>
              </button>
            </div>

            {/* Botón Ver Miembros */}
            <button
              onClick={() => f.current > 0 && onOpenFactionMembers && onOpenFactionMembers(f.id)}
              disabled={f.current === 0}
              className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                f.current > 0
                  ? 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/60 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer'
                  : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title={f.current > 0 ? `Ver los ${f.current} miembros de ${f.name}` : 'Esta facción no tiene miembros registrados'}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{f.current > 0 ? `VER MIEMBROS (${f.current})` : 'SIN MIEMBROS'}</span>
            </button>

          </div>
        ))}
      </div>

      {/* Consola RCON y Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        <div className="lg:col-span-8 bg-[#171a1e] border border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-zinc-300 uppercase tracking-wider">
                CONSOLA DE AUDITORÍA RCON // LOGS EN TIEMPO REAL
              </span>
            </div>
            <span className="text-zinc-500">TABLA: pz_factions_quota • SYNC ORACLE DB</span>
          </div>

          <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1 text-[10px]">
            {logs.map((log) => (
              <div key={log.id} className="leading-relaxed hover:bg-zinc-900/40 p-1 rounded transition-colors">
                <span className="text-zinc-600 mr-2">[{log.time}]</span>
                <span className={`font-bold mr-2 ${log.color}`}>{log.tag}:</span>
                <span className="text-zinc-400">{log.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#171a1e] border border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-zinc-400" />
              <span className="font-bold text-zinc-300 uppercase tracking-wider">
                ACCIONES RÁPIDAS DE CONTROL
              </span>
            </div>
            <span className="text-zinc-500 text-[9px]">ESTADO LOCAL</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={toggleGlobalLock}
              className={`w-full py-2 px-3 rounded-xl border text-[10px] font-bold tracking-wider flex items-center justify-center gap-1 uppercase transition-all shadow cursor-pointer ${
                globalLock
                  ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                  : 'bg-red-950/40 hover:bg-red-900/60 border-red-700/80 text-red-400'
              }`}
            >
              <Lock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">[ BLOQUEO GLOBAL ]</span>
            </button>

            <button 
              onClick={() => onTriggerAlert("EXPORTANDO MATRIZ DE CUPOS (CSV)...")}
              className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold tracking-wider flex items-center justify-center gap-1 uppercase transition-all shadow cursor-pointer hover:text-white"
            >
              <Download className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">[ EXPORTAR DB ]</span>
            </button>
          </div>

          <span className="text-[9px] text-zinc-500 text-center block mt-1">
            Ajustes operan en borrador local hasta guardar
          </span>
        </div>
      </div>

    </div>
  );
}
