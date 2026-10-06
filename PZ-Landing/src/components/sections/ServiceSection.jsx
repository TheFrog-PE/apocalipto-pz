import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, CheckCircle2, ArrowRight, Lock, Cpu, Radio } from 'lucide-react';
import { SERVICES_DATA } from '../../data/landingData';

export default function ServiceSection({ onCursorEnter, onCursorLeave }) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <section id="service" className="py-32 md:py-40 bg-[#07080a] relative overflow-hidden">
      {/* ─── DIFUMINADO SUPERIOR SUAVE ─── */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07080a] via-[#07080a]/60 to-transparent pointer-events-none z-10" />

      {/* ─── DIFUMINADO INFERIOR SUAVE ─── */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07080a] via-[#07080a]/60 to-transparent pointer-events-none z-10" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* ── HEADER DE SECCIÓN CON AMPLIO AIRE VERTICAL ── */}
        <div className="mb-14 md:mb-18">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white font-syne leading-[1.05]">
            PILARES DE BLINDAJE &amp; CONTROL
          </h2>
        </div>

        {/* ── LISTA EDITORIAL DE SERVICIOS CON ACORDEÓN Y ESPACIO ESPACIOSO ── */}
        <div className="divide-y divide-zinc-800/80 border-t border-zinc-800/80">
          {SERVICES_DATA.map((srv, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div 
                key={srv.num}
                className="py-10 md:py-12 transition-colors group"
              >
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  onMouseEnter={() => onCursorEnter?.(`SERVICE ${srv.num}`)}
                  onMouseLeave={() => onCursorLeave?.()}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center cursor-pointer p-6 -mx-6 rounded-2xl hover:bg-zinc-900/40 transition-colors"
                >
                  {/* Número */}
                  <div className="md:col-span-1 font-mono text-2xl font-bold text-zinc-600 group-hover:text-[#e6fb04] transition-colors">
                    {srv.num}
                  </div>

                  {/* Título & Subtítulo */}
                  <div className="md:col-span-6 space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 group-hover:text-white uppercase font-syne tracking-tight">
                      {srv.title}
                    </h3>
                    <span className="text-xs font-mono text-zinc-500 block">
                      {srv.en}
                    </span>
                  </div>

                  {/* Descripción Corta */}
                  <div className="md:col-span-4 text-xs sm:text-sm font-light text-zinc-400 line-clamp-2 leading-relaxed">
                    {srv.desc}
                  </div>

                  {/* Icono Desplegable */}
                  <div className="md:col-span-1 flex justify-end">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      isExpanded 
                        ? 'rotate-180 bg-[#e6fb04] text-black border-[#e6fb04] shadow-[0_0_15px_rgba(230,251,4,0.5)]' 
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 group-hover:border-[#e6fb04] group-hover:text-[#e6fb04]'
                    }`}>
                      <ChevronDown className={`w-4 h-4 stroke-[2.5] ${isExpanded ? 'text-black' : 'text-zinc-300 group-hover:text-[#e6fb04]'}`} />
                    </div>
                  </div>
                </div>

                {/* Área Desplegable con Detalles de Capacidades */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-8 pb-6 px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-[#121318] border border-zinc-800 rounded-3xl mt-6 font-mono text-xs shadow-2xl">
                        <div className="md:col-span-7 space-y-5">
                          <div>
                            <span className="text-[10px] text-[#e6fb04] uppercase tracking-widest block font-bold mb-1.5">
                              [ EL PROPÓSITO ]
                            </span>
                            <p className="text-zinc-200 font-sans leading-relaxed text-sm md:text-base">
                              {srv.purpose || srv.desc}
                            </p>
                          </div>

                          {srv.materialization && (
                            <div className="pt-2 border-t border-zinc-800/80">
                              <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold mb-1.5">
                                [ CÓMO SE MATERIALIZA ]
                              </span>
                              <p className="text-zinc-300 font-sans leading-relaxed text-xs sm:text-sm">
                                {srv.materialization}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-5 space-y-3 border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-8">
                          <span className="text-[10px] text-[#e6fb04] uppercase tracking-widest block font-bold mb-3">KEY DELIVERABLES &amp; TECH:</span>
                          <div className="space-y-3">
                            {srv.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-2.5 text-zinc-300 text-xs sm:text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#e6fb04]" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
}
