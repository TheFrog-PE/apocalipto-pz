import React, { useState } from 'react';
import { ShieldCheck, Server, Activity, CheckCircle, RotateCw, Users, Shield, Zap } from 'lucide-react';
import { AWARDS_DATA } from '../../data/landingData';

export default function AwardsSection({ onCursorEnter, onCursorLeave }) {
  const [flippedCards, setFlippedCards] = useState({});

  const toggleFlip = (index, state) => {
    setFlippedCards(prev => ({ ...prev, [index]: state }));
  };

  const getBigIcon = (iconName, accentColor) => {
    const iconClass = "w-8 h-8 sm:w-10 sm:h-10";
    switch (iconName) {
      case 'Server':
        return <Server className={`${iconClass} text-[#e6fb04] drop-shadow-[0_0_15px_rgba(230,251,4,0.6)]`} />;
      case 'ShieldCheck':
        return <ShieldCheck className={`${iconClass} text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]`} />;
      case 'Activity':
        return <Activity className={`${iconClass} text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]`} />;
      case 'Users':
        return <Users className={`${iconClass} text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]`} />;
      default:
        return <ShieldCheck className={`${iconClass} text-[#e6fb04]`} />;
    }
  };

  return (
    <section id="awards" className="py-24 md:py-32 bg-[#07080a] relative select-none overflow-hidden">
      {/* ─── DIFUMINADO SUPERIOR SUAVE ─── */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07080a] to-transparent pointer-events-none z-10" />

      {/* ─── DIFUMINADO INFERIOR SUAVE ─── */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07080a] to-transparent pointer-events-none z-10" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* ── HEADER DE SECCIÓN LIMPIO Y DIRECTO ── */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-syne leading-[1.08]">
            SELLOS DE OPERATIVIDAD &amp; INFRAESTRUCTURA
          </h2>
        </div>

        {/* ── GRID TÁCTICO DE 4 TARJETAS CON EFECTO 3D FLIP CARD (ROTACIÓN EN HOVER) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AWARDS_DATA.map((seal, index) => {
            const isFlipped = flippedCards[index];

            return (
              <div
                key={seal.id || index}
                onMouseEnter={() => {
                  toggleFlip(index, true);
                  onCursorEnter?.('AUDITORÍA');
                }}
                onMouseLeave={() => {
                  toggleFlip(index, false);
                  onCursorLeave?.();
                }}
                className="group relative h-[380px] w-full cursor-pointer [perspective:1200px]"
              >
                {/* Contenedor 3D Flip */}
                <div 
                  className={`w-full h-full relative transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] [transform-style:preserve-3d] ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  
                  {/* ═════════ CARA FRONTAL (FRONT FACE: ULTRA LIMPIO, ICONO GRANDE Y TÍTULO) ═════════ */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] p-7 bg-[#0d0f14] border border-zinc-800/90 rounded-xl group-hover:border-[#e6fb04]/70 group-hover:shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_35px_rgba(230,251,4,0.15)] transition-all duration-300 flex flex-col items-center text-center justify-between overflow-hidden">
                    
                    {/* Glow ambiental táctico */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-[#e6fb04]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* 1. Iconografía visual grande y llamativa */}
                    <div className="relative z-10 mt-3">
                      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-zinc-900/90 border border-zinc-700/80 group-hover:border-[#e6fb04]/60 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110">
                        {getBigIcon(seal.icon, seal.accentColor)}
                      </div>
                    </div>

                    {/* 2. Título prominente sin textos extras */}
                    <div className="relative z-10 my-auto px-2">
                      <h3 className="text-base sm:text-lg md:text-xl font-black font-syne text-white uppercase leading-snug tracking-tight group-hover:text-[#e6fb04] transition-colors">
                        {seal.title}
                      </h3>
                    </div>

                    {/* 3. Indicador sutil de interacción */}
                    <div className="relative z-10 pt-2 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 group-hover:text-[#e6fb04] transition-colors">
                      <RotateCw className="w-3 h-3 group-hover:animate-spin" />
                      <span>GIRA PARA VER DETALLES</span>
                    </div>
                  </div>

                  {/* ═════════ CARA TRASERA (BACK FACE: SÓLO TEXTO EXPLICATIVO Y DEFINICIÓN LIMPIA) ═════════ */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 sm:p-7 bg-[#10131a] border-2 border-[#e6fb04]/80 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_35px_rgba(230,251,4,0.2)] flex flex-col justify-between overflow-hidden text-left">
                    
                    {/* Fondo reticular táctico */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e6fb04_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                    {/* Cabecera del dorso */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 relative z-10">
                      <span className="text-[10px] font-mono text-[#e6fb04] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        AUDITORÍA OFICIAL
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 uppercase bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800">
                        {seal.badgeText}
                      </span>
                    </div>

                    {/* Todo el contenido textual completo (simple y técnico) en el dorso */}
                    <div className="relative z-10 my-auto space-y-3">
                      <p className="text-xs sm:text-[13px] font-sans text-zinc-100 font-medium leading-relaxed bg-[#161a24]/90 p-3.5 rounded-2xl border border-zinc-700/80 shadow-sm">
                        {seal.simpleDesc}
                      </p>

                      <p className="text-[11px] sm:text-xs font-mono text-zinc-300 font-light leading-relaxed bg-black/60 p-3.5 rounded-2xl border border-zinc-800/90">
                        {seal.technicalDefinition}
                      </p>
                    </div>

                    {/* Pie del dorso limpio */}
                    <div className="pt-2.5 border-t border-zinc-800/90 flex items-center justify-between text-[10px] font-mono text-zinc-400 relative z-10">
                      <span className="text-zinc-500">ESTADO: AUDITADO</span>
                      <span className="text-emerald-400 font-black flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> PASS ✓
                      </span>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
}
