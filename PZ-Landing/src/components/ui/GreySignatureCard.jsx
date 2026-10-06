import React from 'react';
import { ArrowUpRight, Sparkles, Layers, Box } from 'lucide-react';

export default function GreySignatureCard({
  id = '01',
  title = 'Project Blueprint',
  tag = 'WEBGL / 3D',
  ratio = 'aspect-[16/10]',
  onCursorEnter,
  onCursorLeave,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onCursorEnter?.('EXPLORE')}
      onMouseLeave={() => onCursorLeave?.()}
      className={`relative w-full ${ratio} bg-[#131418] border border-zinc-800 hover:border-zinc-500 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 shadow-xl`}
    >
      {/* ── MALLA TÉCNICA Y WIREFRAME GRIS (SIGNATURE PLACEHOLDER) ── */}
      <div className="absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none">
        {/* Cuadrícula isométrica de fondo */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        />

        {/* Círculos concéntricos y wireframe 3D en escala de grises */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-zinc-700/60 border-dashed animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-32 h-32 rounded-full border border-zinc-700/40" />
          <div className="absolute w-16 h-16 rounded-full border border-zinc-600/30" />
          {/* Cruz técnica central */}
          <div className="absolute w-12 h-0.5 bg-zinc-700/80" />
          <div className="absolute h-12 w-0.5 bg-zinc-700/80" />
        </div>
      </div>

      {/* ── INSIGNIA SUPERIOR: ID Y RATIO ── */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 font-mono text-[10px] text-zinc-400">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-md border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e6fb04] animate-pulse" />
          <span className="font-bold text-zinc-200">REF // {id}</span>
        </div>
        <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded border border-zinc-800/80 text-zinc-500">
          SIG-GREY 16:10
        </span>
      </div>

      {/* ── CENTRO: FIRMA GRIS MINIMALISTA ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900/80 border border-zinc-750 flex items-center justify-center text-zinc-500 group-hover:text-[#e6fb04] group-hover:border-[#e6fb04]/50 transition-all duration-300 mb-3 shadow-inner group-hover:scale-110">
          <Box className="w-6 h-6 stroke-[1.5]" />
        </div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-zinc-400 group-hover:text-zinc-200 uppercase transition-colors">
          {tag}
        </span>
        <span className="text-[9px] font-mono text-zinc-600 mt-0.5">
          [ SPATIAL ARCHITECTURE • LOREM IPSUM ]
        </span>
      </div>

      {/* ── BOTÓN FLOTANTE INFERIOR DERECHA ── */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="w-9 h-9 rounded-full bg-black/80 group-hover:bg-[#e6fb04] border border-zinc-700 group-hover:border-[#e6fb04] text-zinc-400 group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-lg group-hover:rotate-45">
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

      {/* ── COORDENADAS TÉCNICAS INFERIORES ── */}
      <div className="absolute bottom-4 left-4 z-10 font-mono text-[9px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
        GEO: 35.66°N // TOKYO LAB
      </div>
    </div>
  );
}
