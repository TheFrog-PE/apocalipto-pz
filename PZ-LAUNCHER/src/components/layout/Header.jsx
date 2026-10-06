import React from 'react';
import { Radio, Zap } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenRules, onlineCount = 0, gatewayUrl = 'http://localhost:19842', alfaStatus = {} }) {
  const tabs = [
    { id: 'facciones', label: 'Facciones' },
    { id: 'publicaciones', label: 'Publicaciones' },
    { id: 'contacto', label: 'Contacto' }
  ];

  const isAlfaActive = alfaStatus?.alfaEngineActive === true;

  return (
    <header className="relative z-20 flex items-center justify-between px-6 md:px-8 py-4 border-b border-zinc-800/80 bg-black/60 backdrop-blur-md">
      {/* BRANDING */}
      <div className="flex items-center gap-3">
        <img 
          src="/isotipo.png" 
          alt="Apocalipto PZ" 
          className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.6)] select-none" 
        />
        <div>
          <h1 className="text-base md:text-lg font-black tracking-widest uppercase text-zinc-100 leading-none">
            APOCALIPTO PZ
          </h1>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
            BUILD 42 MULTIPLAYER
          </span>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <nav className="flex items-center gap-2 md:gap-3 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`transition-all duration-200 uppercase px-3.5 py-1.5 rounded-lg font-mono text-xs cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ESTADO ONLINE Y BOTÓN DE REGLAS */}
      <div className="flex items-center gap-3 md:gap-4 text-xs font-mono">

        {/* ── INDICADOR MOTOR FAILOVER ALFA ── */}
        <div
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-inner transition-all duration-500 cursor-help ${
            isAlfaActive
              ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
              : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-500'
          }`}
          title={
            isAlfaActive
              ? `Nodo Alfa activo: ${alfaStatus.alfaNodeId || '—'} | Heartbeat P2P cada 5s`
              : 'Motor de Failover inactivo — lanza el juego para activarlo'
          }
        >
          <Zap className={`w-3 h-3 ${isAlfaActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'}`} />
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {isAlfaActive ? 'NODO ALFA ACTIVO' : 'FAILOVER STANDBY'}
          </span>
        </div>

        <div
          className="flex items-center gap-2 text-zinc-300 bg-zinc-950/70 border border-zinc-800/80 px-3 py-1.5 rounded-full shadow-inner cursor-help"
          title={`Enlace al Enjambre: ${gatewayUrl}`}
        >
          <span className="text-[11px] font-semibold">[ {onlineCount} ENJAMBRE ]</span>
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
        </div>
        <button
          onClick={onOpenRules}
          className="px-3.5 py-1.5 border border-zinc-700 hover:border-amber-500 hover:text-amber-400 text-zinc-300 text-[11px] uppercase tracking-wider transition-all bg-zinc-900/60 hover:bg-amber-950/30 rounded-xl cursor-pointer"
        >
          [ LEER REGLAS ]
        </button>
      </div>
    </header>
  );
}
