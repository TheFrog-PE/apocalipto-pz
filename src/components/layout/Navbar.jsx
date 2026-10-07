import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X, Volume2, VolumeX, Download, Radio, Terminal } from 'lucide-react';
import { COMPANY_INFO } from '../../data/landingData';
import { fetchLiveSwarmStats } from '../../services/swarmTelemetry';

export default function Navbar({ onCursorEnter, onCursorLeave, onOpenContact, onOpenDownload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [swarmStats, setSwarmStats] = useState(null);

  useEffect(() => {
    fetchLiveSwarmStats().then(setSwarmStats);
    const interval = setInterval(() => {
      fetchLiveSwarmStats().then(setSwarmStats);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'INFRAESTRUCTURA & ENJAMBRE', href: '#works', num: '01' },
    { name: 'SEGURIDAD & LAUNCHER', href: '#service', num: '02' },
    { name: 'ENJAMBRE P2P & RENDIMIENTO', href: '#awards', num: '03' },
    { name: 'FAQ // PREGUNTAS FRECUENTES', href: '#news', num: '04' },
    { name: 'FACCIONES & WHITELIST', href: '#recruit', num: '05' },
    { name: 'DESCARGAR LAUNCHER', href: '#', num: '06', isDownload: true },
    { name: 'CONTACT / SOPORTE', href: '#contact', num: '07', isAction: true },
  ];

  return (
    <>
      {/* ── BARRA FIJA SUPERIOR ── */}
      <header className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 flex items-center justify-between px-6 md:px-12 py-5 ${
        scrolled ? 'bg-[#090a0d]/90 backdrop-blur-md border-b border-zinc-800/80 py-4' : 'bg-transparent'
      }`}>
        {/* Logotipo Táctico */}
        <a 
          href="#top" 
          onMouseEnter={() => onCursorEnter?.('HQ')}
          onMouseLeave={() => onCursorLeave?.()}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <img 
            src="./isotipo.png" 
            alt="Apocalipto PZ" 
            className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] select-none group-hover:scale-110 transition-transform" 
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white uppercase group-hover:text-[#e6fb04] transition-colors font-syne">
              APOCALIPTO PZ <span className="font-mono text-[9px] font-normal text-zinc-500">// BUILD 42.20.4</span>
            </span>
            <span className="text-[8px] font-mono text-zinc-500 tracking-widest hidden sm:block">
              ENJAMBRE P2P // 50 SLOTS // $0 CLOUD
            </span>
          </div>
        </a>


        {/* Controles Tácticos + Menú Trigger */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Badge de Estado del Servidor */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 font-mono text-[10px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ENJAMBRE P2P: <strong className="text-white">{swarmStats?.onlineNodes || 1} NODOS</strong></span>
          </div>

          {/* Botón Acceso Rápido Descarga */}
          <button
            onClick={onOpenDownload || onOpenContact}
            onMouseEnter={() => onCursorEnter?.('LAUNCHER')}
            onMouseLeave={() => onCursorLeave?.()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e6fb04] hover:bg-white text-black text-[11px] font-bold font-syne transition-all cursor-pointer shadow-[0_0_15px_rgba(230,251,4,0.3)] hover:scale-105"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>DESCARGAR</span>
          </button>

          <button 
            onClick={() => setSoundOn(!soundOn)}
            onMouseEnter={() => onCursorEnter?.('AUDIO')}
            onMouseLeave={() => onCursorLeave?.()}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sound Design"
          >
            {soundOn ? <Volume2 className="w-3 h-3 text-[#e6fb04]" /> : <VolumeX className="w-3 h-3 text-zinc-500" />}
            <span>{soundOn ? 'RADIO 91.4 ON' : 'RADIO 91.4 OFF'}</span>
          </button>

          {/* Botón flotante MENU con punto pulsante */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => onCursorEnter?.(isOpen ? 'CLOSE' : 'TAC-OPS')}
            onMouseLeave={() => onCursorLeave?.()}
            className="flex items-center gap-2.5 px-4 py-2 bg-zinc-900/90 hover:bg-black border border-zinc-800 hover:border-[#e6fb04] rounded-full transition-all shadow-xl cursor-pointer group"
          >
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-zinc-200 group-hover:text-white uppercase">
              {isOpen ? 'CLOSE' : 'MENU'}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isOpen ? 'bg-red-500 rotate-45 scale-110' : 'bg-[#e6fb04] animate-pulse group-hover:scale-125'
            }`} />
          </button>
        </div>
      </header>

      {/* ── OVERLAY DE MENÚ FULLSCREEN TÁCTICO ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'circle(0% at top right)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at top right)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at top right)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-[#07080a]/98 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-14 overflow-y-auto"
          >
            {/* Cabecera del Menú */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono tracking-[0.3em] text-[#e6fb04]">
                  [ APOCALIPTO PZ // COMMAND OS // {COMPANY_INFO.slogan} ]
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full border border-zinc-700 hover:border-white text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista Principal de Enlaces Tipográficos Grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
              <nav className="lg:col-span-8 flex flex-col space-y-2">
                {navLinks.map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + idx * 0.04, duration: 0.4 }}
                  >
                    <a
                      href={item.href}
                      onClick={(e) => {
                        if (item.isDownload) {
                          e.preventDefault();
                          setIsOpen(false);
                          if (onOpenDownload) onOpenDownload();
                          return;
                        }
                        setIsOpen(false);
                        if (item.isAction) onOpenContact?.();
                      }}
                      onMouseEnter={() => onCursorEnter?.(item.name.substring(0, 10))}
                      onMouseLeave={() => onCursorLeave?.()}
                      className="group flex items-baseline gap-4 text-2xl sm:text-4xl md:text-5xl font-black font-syne tracking-tight text-zinc-400 hover:text-[#e6fb04] transition-all duration-300 uppercase py-1"
                    >
                      <span className="text-xs font-mono font-normal text-zinc-600 group-hover:text-[#e6fb04]">
                        {item.num}
                      </span>
                      <span className="group-hover:translate-x-3 transition-transform duration-300">
                        {item.name}
                      </span>
                      <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 text-[#e6fb04]" />
                    </a>
                  </motion.div>
                ))}
              </nav>

              {/* Información Táctica de Servidor y Redes */}
              <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-6 lg:pt-0 lg:pl-10 space-y-6 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">INFRAESTRUCTURA &amp; HOST</span>
                  <p className="text-zinc-300 leading-relaxed">
                    {COMPANY_INFO.legalName}<br />
                    {COMPANY_INFO.location}<br />
                    Red Descentralizada P2P (50 Slots / 60 TPS).
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">COMUNICACIÓN DIRECTA</span>
                  <p className="text-zinc-300 font-bold hover:text-[#e6fb04] transition-colors">
                    {COMPANY_INFO.email}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-3">CANALES DE SUPERVIVENCIA</span>
                  <div className="flex flex-wrap gap-4 text-zinc-400">
                    {['DISCORD OFICIAL', 'X / TWITTER', 'GITHUB', 'YOUTUBE'].map((s) => (
                      <a 
                        key={s} 
                        href="#" 
                        className="hover:text-[#e6fb04] transition-colors border-b border-zinc-800 hover:border-[#e6fb04] pb-0.5"
                      >
                        {s}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Overlay */}
            <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-600 gap-2">
              <span>{COMPANY_INFO.slogan} — {COMPANY_INFO.defcon}</span>
              <span>© {COMPANY_INFO.established} {COMPANY_INFO.legalName}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

