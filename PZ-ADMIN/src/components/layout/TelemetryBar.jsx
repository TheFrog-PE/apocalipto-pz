import React from 'react';
import { Cpu, HardDrive, Zap, Wifi, Users } from 'lucide-react';

export default function TelemetryBar({ onOpenBlockchain, totalOccupied = 0 }) {
  return (
    <section className="bg-[#14161a] border border-zinc-800/90 rounded-xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono shadow-md backdrop-blur-md">
      <div className="flex items-center gap-2 text-zinc-400">
        <span className="text-emerald-400 font-bold">[ ENJAMBRE CRIPTOGRÁFICO ]</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-zinc-300">Save-Chain Bloque #1 • Merkle Root: a780...3e9</span>
        <button
          onClick={onOpenBlockchain}
          className="ml-2 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 hover:text-white rounded-lg text-[10px] font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer flex items-center gap-1.5"
        >
          <span>EXPLORAR SAVE-CHAIN</span>
          <span>→</span>
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400">CPU</span>
          <span className="text-emerald-400 font-bold">34% (8c)</span>
        </div>

        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400">RAM</span>
          <span className="text-cyan-400 font-bold">18.4 / 32G</span>
        </div>

        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400">TPS</span>
          <span className="text-emerald-400 font-bold">60.0 (0ms)</span>
        </div>

        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400">PING</span>
          <span className="text-emerald-400 font-bold">28ms <span className="text-[9px] text-zinc-500">0% Loss</span></span>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 text-emerald-400 font-bold rounded-lg shadow-inner">
          <Users className="w-3.5 h-3.5" />
          <span>{totalOccupied} / 40 FACCIONES</span>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-500/50 px-2.5 py-1 text-amber-300 font-bold rounded-lg shadow-inner" title="10 Cupos Fantasma reservados exclusivamente para el Creador, Moderadores y Cámaras OOC">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>10 CUPOS FANTASMA (ADMIN)</span>
          <span className="text-[9px] text-zinc-400 font-normal">[50 TOTAL]</span>
        </div>
      </div>
    </section>
  );
}
