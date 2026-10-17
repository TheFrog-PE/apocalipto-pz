import React from 'react';
import { Cpu, HardDrive, Zap, Wifi, Users } from 'lucide-react';

export default function TelemetryBar({ onOpenBlockchain, totalOccupied = 0 }) {
  return (
    <section className="bg-[#14161a] border border-zinc-800/90 rounded-xl px-3.5 py-3 sm:px-5 sm:py-2.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-[11px] font-mono shadow-md backdrop-blur-md">
      {/* Información del Bloque Save-Chain */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-emerald-400 font-bold text-[10px] sm:text-[11px]">[ ENJAMBRE CRIPTOGRÁFICO ]</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
          <span className="text-zinc-300 text-[10px] sm:text-[11px] truncate max-w-[200px] sm:max-w-none">
            Save-Chain Bloque #1 • Merkle: a780...3e9
          </span>
        </div>
        <button
          onClick={onOpenBlockchain}
          className="ml-auto sm:ml-2 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 hover:text-white rounded-lg text-[9px] sm:text-[10px] font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span>EXPLORAR SAVE-CHAIN</span>
          <span>→</span>
        </button>
      </div>

      {/* Grid de Métricas de Rendimiento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:items-center gap-2 sm:gap-4 pt-2 xl:pt-0 border-t border-zinc-800/70 xl:border-t-0 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5 bg-zinc-900/60 xl:bg-transparent px-2.5 py-1 xl:p-0 rounded-lg border border-zinc-800/60 xl:border-0">
          <Cpu className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-400">CPU</span>
          <span className="text-emerald-400 font-bold ml-auto xl:ml-0">34% (8c)</span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/60 xl:bg-transparent px-2.5 py-1 xl:p-0 rounded-lg border border-zinc-800/60 xl:border-0">
          <HardDrive className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-400">RAM</span>
          <span className="text-cyan-400 font-bold ml-auto xl:ml-0">18.4 / 32G</span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/60 xl:bg-transparent px-2.5 py-1 xl:p-0 rounded-lg border border-zinc-800/60 xl:border-0">
          <Zap className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-400">TPS</span>
          <span className="text-emerald-400 font-bold ml-auto xl:ml-0">60.0 (0ms)</span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/60 xl:bg-transparent px-2.5 py-1 xl:p-0 rounded-lg border border-zinc-800/60 xl:border-0">
          <Wifi className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-400">PING</span>
          <span className="text-emerald-400 font-bold ml-auto xl:ml-0">28ms <span className="text-[8px] sm:text-[9px] text-zinc-500">0% Loss</span></span>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 text-emerald-400 font-bold rounded-lg shadow-inner">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>FACCIONES:</span>
          </div>
          <span>{totalOccupied}/40</span>
        </div>

        <div className="col-span-2 sm:col-span-2 xl:col-span-auto flex items-center justify-between sm:justify-start gap-1.5 bg-amber-950/50 border border-amber-500/50 px-2.5 py-1 text-amber-300 font-bold rounded-lg shadow-inner" title="10 Cupos Fantasma reservados exclusivamente para el Creador, Moderadores y Cámaras OOC">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>10 CUPOS ADMIN</span>
          </div>
          <span className="text-[9px] text-zinc-400 font-normal">[50 TOTAL]</span>
        </div>
      </div>
    </section>
  );
}
