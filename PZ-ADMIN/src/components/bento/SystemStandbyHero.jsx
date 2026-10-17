import React from 'react';
import { Zap, Power, ShieldCheck, Cpu, HardDrive, Wifi, Sliders, Package, Users } from 'lucide-react';

export default function SystemStandbyHero({ 
  worldStatus, 
  worldProgress, 
  onStartWorld, 
  onOpenWorldConfig,
  onOpenRules,
  onOpenMods,
  onBypassToDashboard 
}) {
  const isStarting = worldStatus === 'STARTING';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 min-h-[440px] sm:min-h-[520px] relative overflow-hidden">
      {/* Luz ambiental de fondo */}
      <div className="absolute w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none -bottom-20 -right-20" />

      {/* Tarjeta Bento Hero Central */}
      <div className="relative z-10 w-full max-w-3xl bg-[#14161a]/95 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        
        {/* Isotipo con halo luminoso */}
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center p-2.5 sm:p-3 shadow-inner">
            <img 
              src="/isotipo.png" 
              alt="Apocalipto PZ" 
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.7)] select-none" 
            />
          </div>
        </div>

        {/* Badge de Estado */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-2 sm:mb-3 shadow-inner">
          <span className={`w-2 h-2 rounded-full ${isStarting ? 'bg-amber-400 animate-ping' : 'bg-zinc-500'}`} />
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest font-bold uppercase text-zinc-300">
            {isStarting ? 'INICIANDO PROTOCOLO...' : 'SISTEMA EN REPOSO // STANDBY'}
          </span>
        </div>

        {/* Títulos */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-zinc-100 uppercase mb-2">
          CENTRO DE CONTROL BENTO OS
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mb-6 sm:mb-8 font-mono">
          {isStarting 
            ? 'Cargando el mapa de Knox County, inicializando motor Java y sincronizando el Enjambre...'
            : 'El mundo está actualmente apagado para ahorrar recursos. Pulsa el botón principal para poner el servidor y la red en circulación.'}
        </p>

        {/* BOTÓN GIGANTE O BARRA DE CARGA */}
        {!isStarting ? (
          <div className="w-full max-w-md flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={onStartWorld}
              className="group relative w-full py-4 sm:py-5 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm md:text-base tracking-widest uppercase shadow-[0_0_35px_rgba(16,185,129,0.45)] hover:shadow-[0_0_50px_rgba(16,185,129,0.7)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 sm:gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-bounce shrink-0" />
              <span className="font-mono text-sm sm:text-base md:text-lg">ARRANCAR SISTEMA // MUNDO</span>
            </button>
            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono text-center">
              Inicia el proceso del servidor silenciosamente en segundo plano sin ventanas molestas.
            </span>
          </div>
        ) : (
          <div className="w-full max-w-lg mb-6 sm:mb-8 p-4 sm:p-5 bg-zinc-950/80 border border-amber-500/40 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
              <span className="text-amber-400 uppercase flex items-center gap-2">
                <div className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                {worldProgress?.phase || 'CARGANDO MUNDO...'}
              </span>
              <span className="text-amber-300 font-black text-sm">{worldProgress?.percent || 15}%</span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                style={{ width: `${Math.max(10, worldProgress?.percent || 15)}%` }}
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono text-center mt-3">
              Tiempo estimado de inicio: ~30 segundos. El panel se abrirá automáticamente al detectar RCON.
            </p>
          </div>
        )}

        {/* Indicadores de Salud del Sistema Bento */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4 sm:pt-6 border-t border-zinc-800/80 text-left">
          
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 sm:p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase">Bridge Local P2P</div>
              <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ACTIVO (19842)
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 sm:p-3.5 rounded-xl flex items-center gap-3">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${isStarting ? 'bg-amber-950/60 border border-amber-500/40' : 'bg-zinc-800/60 border border-zinc-700/40'} flex items-center justify-center shrink-0`}>
              <Cpu className={`w-4 h-4 ${isStarting ? 'text-amber-400' : 'text-zinc-500'}`} />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase">Servidor Java PZ</div>
              <div className={`text-xs font-bold font-mono ${isStarting ? 'text-amber-400' : 'text-zinc-400'} flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isStarting ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                {isStarting ? 'INICIANDO...' : 'EN REPOSO (0%)'}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 sm:p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase">Guardián de Red</div>
              <div className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                PREPARADO
              </div>
            </div>
          </div>

        </div>

        {/* Acceso Alternativo / Configuración */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={onOpenWorldConfig}
            className="text-[9px] sm:text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-red-400" />
            <span>Calibrar Sandbox</span>
          </button>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <button
            onClick={onOpenMods}
            className="text-[9px] sm:text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer"
          >
            <Package className="w-3 h-3 text-cyan-400" />
            <span>Taller de Mods</span>
          </button>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <button
            onClick={onBypassToDashboard}
            className="text-[9px] sm:text-[10px] font-mono text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer"
          >
            <span>Explorar Panel Offline →</span>
          </button>
        </div>

      </div>
    </div>
  );
}
