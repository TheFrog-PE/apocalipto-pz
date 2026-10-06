import React from 'react';
import { RotateCcw, Power, FileEdit, Globe, Crown, Zap, Sliders, Package } from 'lucide-react';

export default function Header({ 
  onOpenRules, 
  onOpenGateway, 
  onOpenAdminAccess, 
  onOpenWorldConfig, 
  onOpenMods,
  onTriggerAlert, 
  totalOccupied = 0,
  worldStatus = 'CHECKING',
  worldProgress = { percent: 0, phase: 'Iniciando...' },
  onStartWorld,
  onStopWorld
}) {
  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-[#14161a] border border-zinc-800/90 rounded-xl shadow-lg backdrop-blur-md">
      {/* Logotipo y Título */}
      <div className="flex items-center gap-3">
        <img 
          src="/isotipo.png" 
          alt="Apocalipto PZ" 
          className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.6)] select-none" 
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-100 tracking-wider">APOCALIPTO PZ</span>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
              MANDO CENTRAL
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 font-mono font-semibold">HOST: ENJAMBRE P2P // SAVE-CHAIN DPoH</span>
        </div>
      </div>

      {/* Indicador de Jugadores Conectados */}
      <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
        <span className="text-zinc-300 font-bold tracking-wider text-[11px] font-mono">
          ONLINE — {totalOccupied} / 40 NODOS (10 MÁX/FACCIÓN)
        </span>
      </div>

      {/* Tag Central */}
      <div className="hidden lg:flex items-center gap-2 text-zinc-400 text-[11px] font-mono">
        <span>CENTRO DE MANDO UNIFICADO // APOCALIPTO PZ</span>
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
      </div>

      {/* Botones de Acción Rápida */}
      <div className="flex items-center gap-2">
        {/* CONTROL DE ARRANQUE / APAGADO DEL MUNDO */}
        {worldStatus === 'CHECKING' ? (
          <div 
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-700/80 text-zinc-400 font-bold text-[10px] tracking-wider uppercase rounded-lg flex items-center gap-1.5"
            title="Consultando telemetría del Nodo Alfa..."
          >
            <div className="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <span>VERIFICANDO...</span>
          </div>
        ) : worldStatus === 'OFFLINE' ? (
          <button 
            onClick={onStartWorld}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5 animate-pulse"
            title="Encender simulación del Nodo Alfa en este equipo"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>ARRANCAR MUNDO</span>
          </button>
        ) : worldStatus === 'STARTING' ? (
          <div 
            className="relative px-3 py-1.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-[10px] tracking-wider uppercase rounded-lg flex items-center gap-2 overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.2)] select-none"
            title={`Fase: ${worldProgress?.phase || 'Iniciando'} (${worldProgress?.percent || 15}%)`}
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-amber-500/20 transition-all duration-500 ease-out" 
              style={{ width: `${Math.max(12, worldProgress?.percent || 15)}%` }}
            />
            <div className="relative z-10 w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="relative z-10 flex items-center gap-1.5">
              <span className="font-mono text-amber-400 font-black">{worldProgress?.percent || 15}%</span>
              <span className="text-[9px] text-zinc-300 max-w-[130px] truncate">{worldProgress?.phase || 'INICIANDO...'}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              onClick={onOpenWorldConfig}
              className="px-2.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] tracking-wider uppercase rounded-l-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-1.5"
              title="Mundo en línea y sincronizado. Clic para calibrar."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MUNDO ONLINE</span>
            </button>
            <button
              onClick={onStopWorld}
              className="px-2 py-1.5 bg-red-950/80 hover:bg-red-800 border-y border-r border-red-500/60 text-red-300 hover:text-white font-bold text-[10px] uppercase rounded-r-lg transition-all cursor-pointer"
              title="Guardar y apagar simulación del mundo"
            >
              <Power className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* CALIBRAR MUNDO */}
        <button 
          onClick={onOpenWorldConfig}
          className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600/60 text-red-300 hover:text-white font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] cursor-pointer flex items-center gap-1.5"
          title="Configuración de Zombies, Sprinters, Dificultad, Luz y Agua"
        >
          <Sliders className="w-3.5 h-3.5 text-red-400" />
          <span>CALIBRAR</span>
        </button>

        {/* ARSENAL DE MODS (STEAM WORKSHOP) */}
        <button 
          onClick={onOpenMods}
          className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 hover:text-white font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer flex items-center gap-1.5"
          title="Gestión de mods de Steam Workshop, fichas en tiempo real y activación"
        >
          <Package className="w-3.5 h-3.5 text-cyan-400" />
          <span>TALLER DE MODS</span>
        </button>

        <button 
          onClick={onOpenAdminAccess}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-400 hover:text-amber-300 font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer flex items-center gap-1.5"
          title="Gestión de rango Administrador in-game y lanzamiento directo"
        >
          <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span>MANDO ADMIN</span>
        </button>

        <button 
          onClick={onOpenGateway}
          className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 hover:text-white font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer flex items-center gap-1.5"
          title="Compartir enlace de conexión para jugadores externos"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>INVITAR JUGADORES</span>
        </button>

        <button 
          onClick={onOpenRules}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer flex items-center gap-1.5"
        >
          <FileEdit className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>EDITAR REGLAS</span>
        </button>
        <button
          onClick={() => onTriggerAlert("MATRIZ DE TELEMETRÍA REINICIADA.")}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Reiniciar telemetría"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onTriggerAlert("ALERTA: PANEL ADMINISTRADOR EN MODO RESTRICCIÓN.")}
          className="p-1.5 hover:bg-red-950/40 rounded-lg text-red-500 hover:text-red-400 transition-colors cursor-pointer"
          title="Desconectar consola"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
