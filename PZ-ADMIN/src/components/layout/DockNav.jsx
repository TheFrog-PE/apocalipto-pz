import React from 'react';
import { LayoutGrid, Radio, User, Terminal, Layers, Package } from 'lucide-react';

export default function DockNav({ expandedModule, setExpandedModule, applicantsCount, totalOccupied = 0 }) {
  if (!expandedModule) return null;

  return (
    <nav className="flex items-center justify-between gap-2 bg-[#121417]/95 backdrop-blur-md border border-zinc-800/90 rounded-xl p-2 shadow-2xl overflow-x-auto font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase px-2 flex items-center gap-1.5">
          <LayoutGrid className="w-3 h-3 text-zinc-500" />
          <span>MÓDULOS DE COMANDO:</span>
        </span>

        {/* Radio Knox */}
        <button
          onClick={() => setExpandedModule('chat')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            expandedModule === 'chat'
              ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Radio Knox</span>
          <span className="text-[10px] text-emerald-400 font-mono">(91.4)</span>
        </button>

        {/* Whitelist (Con estilo ámbar táctico oscuro) */}
        <button
          onClick={() => setExpandedModule('whitelist')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            expandedModule === 'whitelist'
              ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>Whitelist</span>
          <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] rounded font-bold">
            ({applicantsCount} PENDIENTES)
          </span>
        </button>

        {/* Facciones */}
        <button
          onClick={() => setExpandedModule('factions')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            expandedModule === 'factions'
              ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Balanza 4 Facciones</span>
          <span className="px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] rounded font-bold">
            EN FOCO
          </span>
        </button>

        {/* RCON */}
        <button
          onClick={() => setExpandedModule('rcon')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            expandedModule === 'rcon'
              ? 'bg-red-700 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-red-500" />
          <span>Asistente RCON</span>
          <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-400 text-[9px] rounded font-bold">
            ({totalOccupied} JUGADORES)
          </span>
        </button>

        {/* Save-Chain Explorer */}
        <button
          onClick={() => setExpandedModule('blockchain')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            expandedModule === 'blockchain'
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Save-Chain</span>
          <span className="px-1.5 py-0.2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[9px] rounded font-bold">
            #1 [SYNC]
          </span>
        </button>

        {/* Arsenal de Mods (Steam Workshop) */}
        <button
          onClick={() => setExpandedModule('mods')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            expandedModule === 'mods'
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-cyan-400" />
          <span>Taller Mods</span>
        </button>
      </div>

      {/* Botón Restaurar Bento */}
      <button
        onClick={() => setExpandedModule(null)}
        className="px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 border bg-amber-500 hover:bg-amber-400 text-black border-amber-500 shadow transition-all cursor-pointer"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>VISTA BENTO</span>
      </button>
    </nav>
  );
}
