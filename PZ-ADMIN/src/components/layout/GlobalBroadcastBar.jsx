import React from 'react';
import { Megaphone, Send, Pause, RotateCcw, ShieldAlert } from 'lucide-react';

export default function GlobalBroadcastBar({
  broadcastMessage,
  setBroadcastMessage,
  onTriggerAlert,
  totalOccupied = 0
}) {
  return (
    <section className="bg-[#14161a] border border-zinc-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-md font-mono text-xs backdrop-blur-md">
      {/* Input de Transmisión */}
      <div className="flex items-center gap-3 flex-1 min-w-[300px]">
        <div className="flex items-center gap-2 text-zinc-300">
          <Megaphone className="w-4 h-4 text-amber-400 animate-pulse" />
          <div>
            <span className="font-bold text-[10px] uppercase text-zinc-200 block">BROADCAST RCON GLOBAL</span>
            <span className="text-[9px] text-zinc-500">
              {totalOccupied > 0 
                ? `Aviso visual a los ${totalOccupied} supervivientes conectados` 
                : 'Aviso visual a los supervivientes en Knox County'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            className="flex-1 bg-[#0f1113] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono transition-colors"
          />
          <button 
            onClick={() => onTriggerAlert(`BROADCAST ENVIADO: "${broadcastMessage}"`)}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-lg flex items-center gap-1 transition-all shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>TRANSMITIR</span>
          </button>
        </div>
      </div>

      {/* Botones de Control de Emergencia */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onTriggerAlert("PROTOCOLO FREEZE MUNDO ACTIVADO.")}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-amber-950/40 border border-amber-600/70 text-amber-400 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer hover:border-amber-500"
        >
          <Pause className="w-3 h-3" />
          <span>FREEZE MUNDO</span>
        </button>

        <button 
          onClick={() => onTriggerAlert("REINICIO EN 5 MINUTOS TRANSMITIDO AL ENJAMBRE.")}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-amber-950/40 border border-amber-500 text-amber-300 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer hover:border-amber-400"
        >
          <RotateCcw className="w-3 h-3" />
          <span>REINICIAR 5M</span>
        </button>

        <button 
          onClick={() => onTriggerAlert("ALERTA: PARADA FORZADA DEL NODO ALFA EJECUTADA.")}
          className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer hover:border-red-500"
        >
          <ShieldAlert className="w-3 h-3" />
          <span>PARADA FORZADA</span>
        </button>
      </div>
    </section>
  );
}
