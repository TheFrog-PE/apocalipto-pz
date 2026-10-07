import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Radio, Shield, Users } from 'lucide-react';
import { fetchLiveSwarmStats } from '../../services/swarmTelemetry';

const HERO_BACKGROUNDS = [
  '/images/apocalipto-pz-imagen-1.jpeg',
  '/images/apocalipto-pz-imagen-2.jpeg',
  '/images/apocalipto-pz-imagen-3.jpeg',
  '/images/apocalipto-pz-imagen-4.jpeg'
];

export default function HeroKV({ onCursorEnter, onCursorLeave, onOpenContact, onOpenDownload }) {
  const containerRef = useRef(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: -1000, y: -1000 });
  const [swarmStats, setSwarmStats] = useState(null);

  // Obtener telemetría del enjambre en vivo
  useEffect(() => {
    fetchLiveSwarmStats().then(setSwarmStats);
    const interval = setInterval(() => {
      fetchLiveSwarmStats().then(setSwarmStats);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Rotación automática del fondo cada 6 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BACKGROUNDS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    
    // Parallax idéntico al launcher
    setParallaxOffset({ x: normX * -18, y: normY * -12 });
    // Coordenadas locales para el haz de luz interactivo
    setMouseCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const scrollToWorks = () => {
    const el = document.getElementById('recruit');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentBg = HERO_BACKGROUNDS[bgIndex];

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      id="top" 
      className="min-h-screen w-full bg-[#070707] relative overflow-hidden flex items-center justify-center select-none pt-20 pb-16"
    >
      {/* ─── 1. IMAGEN DE FONDO BASE A PANTALLA COMPLETA (Táctico, Desaturado, Frío) ─── */}
      <div
        className="absolute -inset-10 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700 ease-out will-change-transform bg-tactical-filter"
        style={{
          backgroundImage: `url(${currentBg})`,
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.08)`,
        }}
      />

      {/* ─── 2. HAZ DE LUZ / SPOTLIGHT INTERACTIVO DEL MOUSE (Revela color y nitidez) ─── */}
      <div
        className="absolute -inset-10 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${currentBg})`,
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.08)`,
          filter: 'saturate(0.85) brightness(0.95) contrast(1.10)',
          maskImage: `radial-gradient(circle 320px at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 320px at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)`,
        }}
      />

      {/* ─── 3. LÍNEAS DE ESCANEO CRT (SCANLINES DE MONITOR MILITAR) ─── */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none z-10 opacity-70" />

      {/* ─── 4. CURVATURA Y VIÑETA DE TUBO CRT ─── */}
      <div className="absolute inset-0 crt-tube crt-corners pointer-events-none z-10" />

      {/* ─── 5. MALLA Y COORDENADAS TÁCTICAS HUD ─── */}
      <div className="absolute inset-0 tactical-mesh pointer-events-none z-10 opacity-80" />
      <div className="absolute inset-0 tactical-crossdots pointer-events-none z-10 opacity-60" />

      {/* ─── 6. TRACKING VHS ANALÓGICO ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <div className="vhs-tracking" />
      </div>

      {/* ─── 7. DIFUMINADO SUAVE / GRADIENT FADE EN EL BORDE INFERIOR (CERO CORTES ABRUPTOS) ─── */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#07080a] via-[#07080a]/80 to-transparent pointer-events-none z-10" />

      {/* Glow táctico central */}
      <div className="absolute w-[600px] h-[600px] bg-[#e6fb04]/5 rounded-full blur-3xl pointer-events-none z-10" />

      {/* ── CONTENIDO PRINCIPAL: FILOSOFÍA & MISIÓN APOCALIPTO PZ ── */}
      <div 
        style={{
          transform: `translate3d(${parallaxOffset.x * -0.3}px, ${parallaxOffset.y * -0.3}px, 0)`,
          transition: 'transform 0.25s ease-out'
        }}
        className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto"
      >
        {/* Branding táctico: nombre del servidor */}
        <div className="mb-4 inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 border border-emerald-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <span className="text-emerald-400 text-sm font-black select-none">▲</span>
          <span className="text-[11px] sm:text-xs font-mono text-zinc-200 tracking-[0.22em] uppercase font-bold">
            BUILD 42.20.4 <span className="text-zinc-500 mx-1">//</span> <span className="text-emerald-400">ENJAMBRE DISTRIBUIDO P2P ($0 CLOUD)</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white font-montserrat leading-[1.08] mb-5 drop-shadow-[0_12px_40px_rgba(0,0,0,0.98)]">
          APOCALIPTO PZ<br />
          <span className="text-[#e6fb04] drop-shadow-[0_0_25px_rgba(230,251,4,0.4)]">BLINDAJE TOTAL.</span><br />
          ROL SIN LÍMITES.
        </h1>

        {/* Declaración de Misión */}
        <p className="text-xs sm:text-sm font-mono text-zinc-300 tracking-wide uppercase max-w-3xl mb-4 font-semibold text-emerald-400/90 drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] bg-black/40 px-4 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
          Red P2P Hardcore de Rol en Knox County — Erradicando el hack. Tecnología inspirada en Bitcoin.
        </p>

        {/* HUD TELEMETRÍA EN VIVO DEL ENJAMBRE */}
        <div className="w-full max-w-3xl mb-6 bg-black/70 border border-zinc-800 rounded-2xl p-3 backdrop-blur-md flex flex-wrap items-center justify-around gap-2 text-[10px] sm:text-[11px] font-mono shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-400">ENJAMBRE EN VIVO:</span>
            <span className="text-white font-bold">{swarmStats?.onlineNodes || 1} NODOS</span>
          </div>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-bold">DOE: {swarmStats?.factions?.doe?.count ?? 0}/10</span>
            <span className="text-red-400 font-bold">MOK: {swarmStats?.factions?.mok?.count ?? 1}/10</span>
            <span className="text-amber-400 font-bold">KTO: {swarmStats?.factions?.kto?.count ?? 0}/10</span>
            <span className="text-emerald-400 font-bold">RIV: {swarmStats?.factions?.riv?.count ?? 0}/10</span>
          </div>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div className="text-[#e6fb04] font-bold">
            [ 40 PÚBLICOS + 10 STAFF ]
          </div>
        </div>

        {/* Párrafo Descriptivo Oficial */}
        <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed max-w-3xl mb-8 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          Cuatro facciones pugnan por el control de Knox County: <span className="text-blue-400 font-semibold">D.O.E.</span> (Militares), <span className="text-red-400 font-semibold">MOK</span> (Crimen Organizado), <span className="text-amber-400 font-semibold">KTO</span> (Culto Oscuro) y <span className="text-emerald-400 font-semibold">RIV</span> (Milicia Civil). Cliente blindado con HWID, DPoH (Proof of Hardware), 60 TPS estables y cero tolerancia al hack.
        </p>

        {/* Botones de acción Tácticos */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenDownload || onOpenContact}
            onMouseEnter={() => onCursorEnter?.('DOWNLOAD')}
            onMouseLeave={() => onCursorLeave?.()}
            className="px-9 py-4 bg-[#e6fb04] hover:bg-white text-black font-black text-xs tracking-[0.22em] uppercase rounded-full transition-all duration-300 shadow-[0_0_35px_rgba(230,251,4,0.45)] cursor-pointer hover:scale-105 flex items-center gap-2.5 font-syne"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>DESCARGAR LAUNCHER</span>
          </button>

          <button
            onClick={scrollToWorks}
            onMouseEnter={() => onCursorEnter?.('LEARN')}
            onMouseLeave={() => onCursorLeave?.()}
            className="px-7 py-4 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-red-600 font-mono text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-lg backdrop-blur-md"
          >
            <span>CONOCER MÁS</span>
            <ArrowDown className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>

      
      </div>

    </section>
  );
}

