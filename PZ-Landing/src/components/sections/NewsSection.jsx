import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldCheck, Terminal, ArrowUpRight } from 'lucide-react';
import { FAQ_DATA } from '../../data/landingData';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewsSection({ onCursorEnter, onCursorLeave }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="news" className="py-24 sm:py-32 md:py-36 border-b border-zinc-900 bg-[#090a0d] relative overflow-hidden">
      
      {/* Luz ambiental sutil */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#e6fb04]/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* ── HEADER DE SECCIÓN FAQ ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 md:mb-16 gap-4">
          <div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white font-syne leading-[1.05]">
              FAQ // PREGUNTAS FRECUENTES DE SUPERVIVENCIA
            </h2>
          </div>
        </div>

        {/* ── LISTA DE PREGUNTAS FRECUENTES (FAQ ACORDEÓN TÁCTICO) ── */}
        <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={item.id}
                className={`transition-all duration-300 ${isOpen ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/20'}`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  onMouseEnter={() => onCursorEnter?.(isOpen ? 'CLOSE' : 'EXPAND')}
                  onMouseLeave={() => onCursorLeave?.()}
                  className="w-full py-7 sm:py-8 px-4 sm:px-6 flex items-start sm:items-center justify-between gap-4 text-left cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#e6fb04] px-2.5 py-1 bg-black/60 rounded-lg border border-[#e6fb04]/30">
                      {item.num} //
                    </span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-syne text-zinc-100 group-hover:text-white transition-colors">
                      {item.question}
                    </h3>
                  </div>

                  <div className={`w-9 h-9 rounded-full border border-zinc-700/80 flex items-center justify-center text-zinc-400 group-hover:border-[#e6fb04] group-hover:text-[#e6fb04] transition-all shrink-0 ${isOpen ? 'bg-[#e6fb04] text-black border-[#e6fb04] rotate-180' : ''}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'text-black' : ''}`} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-6 pb-8 pt-2">
                        <div className="p-5 sm:p-6 rounded-2xl bg-black/50 border border-zinc-800 text-zinc-300 font-sans text-sm sm:text-base leading-relaxed flex flex-col sm:flex-row items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 font-mono text-xs font-bold mt-0.5">
                            RP
                          </div>
                          <div className="flex-1 space-y-1">
                            <span className="font-mono text-xs font-bold text-[#e6fb04] tracking-wider uppercase block">
                              Respuesta Oficial:
                            </span>
                            <p className="text-zinc-200 font-light">
                              {item.answer}
                            </p>
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
