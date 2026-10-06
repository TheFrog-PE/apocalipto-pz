import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass } from 'lucide-react';
import { COMPANY_INFO } from '../../data/landingData';

export default function AboutSection({ onCursorEnter, onCursorLeave, onOpenContact }) {
  return (
    <section id="about" className="py-24 px-6 md:px-12 border-b border-zinc-900 bg-[#090a0d] relative overflow-hidden flex flex-col items-center justify-center text-center">
      
      {/* Malla sutil de fondo */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-10 space-y-6">
        
        {/* Etiqueta y Título Centrados */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-full font-mono text-[10px] text-zinc-400 tracking-[0.25em] uppercase shadow-md">
          <Compass className="w-3.5 h-3.5 text-red-600" />
          <span>01 // FILOSOFÍA & MISIÓN — APOCALIPTO PZ</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white font-syne leading-[1.05]">
          BLINDAJE TOTAL, <span className="text-[#e6fb04]">ROL</span><br />
          SIN LÍMITES.
        </h2>

        <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">
          {COMPANY_INFO.slogan} ✦ {COMPANY_INFO.enSlogan}
        </p>

        {/* Manifiesto Oficial */}
        <div className="space-y-6 text-zinc-300 font-light leading-relaxed max-w-3xl pt-2">
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-xl sm:text-2xl md:text-3xl text-zinc-100 font-normal leading-snug"
          >
            "En Apocalipto PZ, la trampa y la deslealtad técnica son el verdadero enemigo. Los zombis son el escenario; los jugadores, el conflicto."
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4 text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto"
          >
            <p>
              Apocalipto PZ es una red P2P descentralizada hardcore de rol inmersivo en Project Zomboid ambientado en el Condado de Knox, circa 1993. Cuatro facciones —<span className="text-blue-400">D.O.E.</span>, <span className="text-red-400">MOK</span>, <span className="text-amber-400">KTO</span> y <span className="text-emerald-400">RIV</span>— compiten por el control territorial con balanza simétrica de cupos, diplomacia en tiempo real y conflicto PvP regulado.
            </p>
            <p>
              La infraestructura opera sobre una red distribuida de nodos P2P garantizando 60 TPS estables y latencia directa LAN/P2P sin servidores centrales en la nube ($0 costo). Un Launcher propietario con HWID Binding y verificación criptográfica DPoH (Proof of Hardware 250ms) protege cada sesión. El caos zombi es el único desafío real; la trampa y la ventaja técnica desleal han sido erradicadas.
            </p>
          </motion.div>

          {/* Botón Centrado */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={onOpenContact}
              onMouseEnter={() => onCursorEnter?.('TALK')}
              onMouseLeave={() => onCursorLeave?.()}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 border border-zinc-700 hover:border-red-600 text-white hover:text-white hover:bg-red-950/30 rounded-full font-mono text-xs font-bold tracking-[0.25em] uppercase transition-all duration-300 shadow-xl cursor-pointer hover:scale-105"
            >
              <span>POSTULAR A WHITELIST</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-red-500" />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
}
