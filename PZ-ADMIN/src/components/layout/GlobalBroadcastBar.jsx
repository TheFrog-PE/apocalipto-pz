import React from 'react';
import { Megaphone, Send, Pause, RotateCcw, ShieldAlert } from 'lucide-react';

export default function GlobalBroadcastBar({
  broadcastMessage,
  setBroadcastMessage,
  onTriggerAlert,
  totalOccupied = 0
}) {
  return (
    <section className="bg-[#14161a] border border-zinc-800/90 rounded-xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-md font-mono text-xs backdrop-blur-md">
      {/* Input de Transmisión */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 w-full min-w-0">
        <div className="flex items-center gap-2 text-zinc-300 shrink-0">
          <Megaphone className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <div>
            <span className="font-bold text-[10px] uppercase text-zinc-200 block">BROADCAST RCON GLOBAL</span>
            <span className="text-[9px] text-zinc-500">
              {totalOccupied > 0 
                ? `Aviso a los ${totalOccupied} supervivientes` 
                : 'Aviso a supervivientes en Knox County'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex gap-2 w-full min-w-0">
          <input
            type="text"
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            className="flex-1 bg-[#0f1113] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono transition-colors min-w-0"
          />
          <button 
            onClick={() => onTriggerAlert(`BROADCAST ENVIADO: "${broadcastMessage}"`)}
            className="px-3 sm:px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-1 transition-all shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer shrink-0"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">TRANSMITIR</span>
          </button>
        </div>
      </div>

      {/* Botones de Control de Emergencia */}
      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t border-zinc-800 lg:border-t-0">
        <button 
          onClick={() => onTriggerAlert("PROTOCOLO FREEZE MUNDO ACTIVADO.")}
          className="px-2 sm:px-3 py-1.5 bg-zinc-900 hover:bg-amber-950/40 border border-amber-600/70 text-amber-400 text-[9px] sm:text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow cursor-pointer hover:border-amber-500"
        >
          <Pause className="w-3 h-3 shrink-0" />
          <span className="truncate">FREEZE</span>
        </button>

        <button 
          onClick={() => onTriggerAlert("REINICIO EN 5 MINUTOS TRANSMITIDO AL ENJAMBRE.")}
          className="px-2 sm:px-3 py-1.5 bg-zinc-900 hover:bg-amber-950/40 border border-amber-500 text-amber-300 text-[9px] sm:text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow cursor-pointer hover:border-amber-400"
        >
          <RotateCcw className="w-3 h-3 shrink-0" />
          <span className="truncate">REINICIAR 5M</span>
        </button>

        <button 
          onClick={() => onTriggerAlert("ALERTA: PARADA FORZADA DEL NODO ALFA EJECUTADA.")}
          className="px-2 sm:px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 text-[9px] sm:text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow cursor-pointer hover:border-red-500"
        >
          <ShieldAlert className="w-3 h-3 shrink-0" />
          <span className="truncate">PARADA</span>
        </button>
      </div>
    </section>
  );
}
