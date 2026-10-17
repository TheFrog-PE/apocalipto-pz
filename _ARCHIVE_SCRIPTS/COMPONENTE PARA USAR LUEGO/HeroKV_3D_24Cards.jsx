import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, useSpring } from 'framer-motion';
import { ArrowDown, Shield, ArrowUpRight, Radio, Cpu, Activity } from 'lucide-react';
import { COMPANY_INFO } from '../../data/landingData';

export default function HeroKV({ onCursorEnter, onCursorLeave, onOpenContact }) {
  const mountRef = useRef(null);
  const containerRef = useRef(null);

  // Estados de giro 360° al pasar el mouse por cada tarjeta individual
  const [hoveredTiles, setHoveredTiles] = useState({});

  // Progreso objetivo (0.0 = Hero con logo APOCALIPTO PZ, 1.0 = Filosofía 100% revelada)
  const targetProgressRef = useRef(0);
  const [waveProgress, setWaveProgress] = useState(0);
  const waveProgressRef = useRef(0);
  waveProgressRef.current = waveProgress;

  // Grilla de 6 columnas por 4 filas (24 rectángulos grandes a pantalla completa)
  const cols = 6;
  const rows = 4;
  const totalTiles = cols * rows;

  // 12 Palabras Clave Tácticas de Apocalipto PZ (para el reverso en hover 360°)
  const tileWords = [
    { en: 'ORACLE CLOUD', jp: 'INFRAESTRUCTURA DE ALTA DISPONIBILIDAD' },
    { en: 'ANTI-CHEAT', jp: 'BLINDAJE INTEGRAL CONTRA INTRUSOS' },
    { en: 'RCON SYNC', jp: 'CONTROL EN TIEMPO REAL' },
    { en: 'WEBSOCKET', jp: 'LATENCIA ULTRABAJA DE 12MS' },
    { en: 'SQLITE DB', jp: 'GESTIÓN SEGURA DE DATOS' },
    { en: 'WHITELIST', jp: 'FILTRADO ESTRICTO DE ACCESO' },
    { en: 'DEFCON 5', jp: 'ESTADO OPERATIVO NOMINAL' },
    { en: 'BENTO OS', jp: 'INTERFAZ EDITORIAL UNIFICADA' },
    { en: 'RADIO 91.4', jp: 'FRECUENCIAS DE SUPERVIVENCIA' },
    { en: 'FACTIONS', jp: 'SIMETRÍA DE BANDOS CONTROLADA' },
    { en: 'HARDCORE', jp: 'EXPERIENCIA SURVIVAL INMERSIVA' },
    { en: 'TAC-OPS', jp: 'CENTRO DE MANDO MILITAR' }
  ];

  // ── 1. THREE.JS PROCEDURAL PARTICLES CANVAS (FONDO AMBIENTAL FLUIDO) ──
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(65, 45, 60, 60);
    const count = geometry.attributes.position.count;
    const initialPositions = geometry.attributes.position.array.slice();

    const material = new THREE.PointsMaterial({
      size: 0.13,
      color: 0xcccccc,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = -Math.PI / 3.2;
    points.position.y = -6;
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    let startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      targetX += (mouseX * 4 - targetX) * 0.05;
      targetY += (mouseY * 3 - targetY) * 0.05;
      points.rotation.z = targetX * 0.06;
      points.rotation.y = targetY * 0.06;

      const positionAttribute = geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        const u = initialPositions[i * 3];
        const v = initialPositions[i * 3 + 1];
        const wave = Math.sin(u * 0.22 + elapsedTime * 1.2) * Math.cos(v * 0.22 + elapsedTime * 1.0) * 2.0;
        positionAttribute.setZ(i, wave);
      }
      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // ── 2. RESORTE SUAVE PARA LA ONDA 3D DE REVELACIÓN ──
  const smoothWave = useSpring(0, {
    stiffness: 85,
    damping: 25,
    mass: 0.4
  });

  useEffect(() => {
    const unsubscribe = smoothWave.on('change', (latest) => {
      setWaveProgress(latest);
    });
    return () => unsubscribe();
  }, [smoothWave]);

  // ── 3. INTERCEPTOR Y BLOQUEO DE SCROLL (HERO 100% FIJO HASTA COMPLETAR EL GIRO) ──
  useEffect(() => {
    const handleWheel = (e) => {
      const section = document.getElementById('top');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const isAtTop = window.scrollY <= 10 && rect.top >= -20;

      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      // 1. SCROLL DOWN: Bloqueo estricto hasta que la onda de 24 cartas termine 100%
      if (isAtTop && isScrollingDown && (targetProgressRef.current < 1.0 || waveProgressRef.current < 0.96)) {
        e.preventDefault();
        e.stopPropagation();

        const step = Math.max(0.14, Math.min(0.32, Math.abs(e.deltaY) * 0.0022));
        const next = Math.min(1.0, targetProgressRef.current + step);
        targetProgressRef.current = next;
        smoothWave.set(next);
        return;
      }

      // 2. SCROLL UP: Bloqueo para regresar a cubrir con APOCALIPTO PZ
      if (isAtTop && isScrollingUp && (targetProgressRef.current > 0 || waveProgressRef.current > 0.04)) {
        e.preventDefault();
        e.stopPropagation();

        const step = Math.max(0.14, Math.min(0.32, Math.abs(e.deltaY) * 0.0022));
        const next = Math.max(0.0, targetProgressRef.current - step);
        targetProgressRef.current = next;
        smoothWave.set(next);
        return;
      }
    };

    // Touch events
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (window.scrollY > 10) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (deltaY > 20 && (targetProgressRef.current < 1.0 || waveProgressRef.current < 0.96)) {
        e.preventDefault();
        touchStartY = touchY;
        const next = Math.min(1.0, targetProgressRef.current + 0.25);
        targetProgressRef.current = next;
        smoothWave.set(next);
      } else if (deltaY < -20 && (targetProgressRef.current > 0 || waveProgressRef.current > 0.04)) {
        e.preventDefault();
        touchStartY = touchY;
        const next = Math.max(0.0, targetProgressRef.current - 0.25);
        targetProgressRef.current = next;
        smoothWave.set(next);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [smoothWave]);

  // Manejo de giro 360° al pasar el mouse por una tarjeta individual
  const handleTileMouseEnter = (idx) => {
    if (hoveredTiles[idx]) return;

    setHoveredTiles(prev => ({ ...prev, [idx]: true }));
    onCursorEnter?.('TACTICAL');

    setTimeout(() => {
      setHoveredTiles(prev => ({ ...prev, [idx]: false }));
    }, 750);
  };

  const scrollToWorks = () => {
    const worksEl = document.getElementById('works');
    if (worksEl) {
      worksEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cálculo de opacidad condicional para los puntos de Three.js (OCULTOS al inicio, revelados al girar)
  const particlesOpacity = Math.max(0, Math.min(0.65, (waveProgress - 0.15) * 1.3));

  return (
    <section 
      ref={containerRef} 
      id="top" 
      className="h-screen min-h-[640px] w-full bg-[#090a0d] relative overflow-hidden flex items-center justify-center select-none border-b border-zinc-900"
    >
      
      {/* ── FONDO 1: Canvas de partículas 3D Three.js (OCULTO AL INICIO, SE REVELA AL GIRAR) ── */}
      <div 
        ref={mountRef} 
        style={{ 
          opacity: particlesOpacity,
          pointerEvents: 'none',
          transition: 'opacity 0.25s ease-out'
        }} 
        className="absolute inset-0 z-0" 
      />

      {/* ── FONDO 2: Cuadrícula ambiental táctica militar con marcas de coordenadas ── */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* ═══════════════════════════════════════════════════════════════════
          CAPA 0 (DETRÁS DE TODO): SECCIÓN DE FILOSOFÍA & MISIÓN APOCALIPTO PZ
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        style={{ 
          opacity: Math.max(0, Math.min(1, waveProgress * 1.3)),
          transform: `scale(${0.94 + waveProgress * 0.06})`,
          pointerEvents: waveProgress > 0.7 ? 'auto' : 'none'
        }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto transition-transform duration-150"
      >
        {/* Glow táctico de fondo */}
        <div className="absolute w-[520px] h-[520px] bg-[#e6fb04]/5 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Tag de sección militar */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-full font-mono text-[10px] text-zinc-400 tracking-[0.25em] uppercase mb-4 shadow-xl">
          <Shield className="w-3.5 h-3.5 text-[#e6fb04]" />
          <span>01 // PHILOSOPHY &amp; MISSION</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>

        {/* Titular Principal de Manifiesto */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white font-syne leading-[1.05] mb-3">
          SEGURIDAD ABSOLUTA, <span className="text-[#e6fb04]">JUEGO LIMPIO</span><br />
          Y SUPERVIVENCIA PURA.
        </h2>

        {/* Declaración de Misión */}
        <p className="text-xs sm:text-sm font-mono text-zinc-300 tracking-wide uppercase max-w-3xl mb-4 font-semibold text-emerald-400/90">
          "Blindar la experiencia de rol en Project Zomboid frente a amenazas externas, garantizando un entorno libre de hackers y desequilibrios técnicos."
        </p>

        {/* Párrafo Descriptivo Oficial */}
        <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-3xl mb-8">
          Apocalipto PZ redefine la administración de servidores mediante un ecosistema propietario. Combinamos un Launcher de seguridad dedicado que protege a los jugadores con un panel de control estilo militar (Bento OS) sincronizado en tiempo real con Oracle Cloud. Aquí el caos zombi es el único desafío real; la trampa y la vulnerabilidad técnica han sido erradicadas.
        </p>

        {/* Botones de acción Tácticos */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenContact}
            onMouseEnter={() => onCursorEnter?.('COMMS')}
            onMouseLeave={() => onCursorLeave?.()}
            className="px-8 py-3.5 bg-[#e6fb04] hover:bg-white text-black font-extrabold text-xs tracking-[0.25em] uppercase rounded-full transition-all duration-300 shadow-[0_0_25px_rgba(230,251,4,0.35)] cursor-pointer hover:scale-105 flex items-center gap-2"
          >
            <span>ABOUT THE ECOSYSTEM &amp; CONTACT</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={scrollToWorks}
            onMouseEnter={() => onCursorEnter?.('LAUNCHER')}
            onMouseLeave={() => onCursorLeave?.()}
            className="px-6 py-3.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2"
          >
            <span>DISCOVER THE LAUNCHER</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#e6fb04]" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CAPA 1 (ENFRENTE): MALLA DE 24 RECTÁNGULOS GRANDES FLIP 3D
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-2 sm:inset-4 md:inset-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 grid-rows-4 gap-2 sm:gap-3 z-20 pointer-events-auto"
        style={{ perspective: '1500px' }}
      >
        {Array.from({ length: totalTiles }).map((_, idx) => {
          const isHovered = Boolean(hoveredTiles[idx]);
          const word = tileWords[idx % tileWords.length];

          // Cálculo del giro diagonal en cascada
          const rowIdx = Math.floor(idx / cols);
          const colIdx = idx % cols;
          
          const stagger = (rowIdx / (rows - 1)) * 0.3 + (colIdx / (cols - 1)) * 0.2;
          const tileStart = stagger * 0.45;
          const tileEnd = tileStart + 0.65;

          const localProgress = Math.max(0, Math.min(1, (waveProgress - tileStart) / (tileEnd - tileStart)));
          const tileScrollAngle = localProgress * 180;
          const tileOpacity = Math.max(0, 1 - Math.pow(localProgress, 3) * 0.95);

          return (
            <div
              key={idx}
              onMouseEnter={() => handleTileMouseEnter(idx)}
              onMouseLeave={() => onCursorLeave?.()}
              className="relative w-full h-full cursor-pointer"
              style={{
                transformStyle: 'preserve-3d',
                opacity: waveProgress >= 0.98 ? 0 : tileOpacity,
                pointerEvents: waveProgress > 0.6 ? 'none' : 'auto',
                transition: 'opacity 0.2s ease-out'
              }}
            >
              <div
                className="w-full h-full relative rounded-xl sm:rounded-2xl transition-transform duration-700 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isHovered 
                    ? 'rotateX(360deg)' 
                    : `rotateX(${tileScrollAngle}deg)`
                }}
              >
                {/* ── CARA FRONTAL (0°): RECTÁNGULO OSCURO TÁCTICO ── */}
                <div 
                  className="absolute inset-0 rounded-xl sm:rounded-2xl bg-[#111318] border border-zinc-800/80 shadow-md backdrop-blur-xs flex items-center justify-center overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700/60 absolute top-2 right-2" />
                  <span className="font-mono text-[8px] text-zinc-700 absolute bottom-2 left-2">
                    SEC-{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* ── CARA POSTERIOR (180°): AMARILLO NEÓN CON PALABRA CLAVE Y BADGE (HOVER 360°) ── */}
                <div 
                  className="absolute inset-0 rounded-xl sm:rounded-2xl bg-[#e6fb04] border border-[#e6fb04] shadow-[0_0_25px_rgba(230,251,4,0.4)] flex flex-col items-center justify-center p-2 text-center text-black overflow-hidden"
                  style={{
                    transform: 'rotateX(180deg)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  {/* Badge circular táctico */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center animate-[spin_6s_linear_infinite] pointer-events-none opacity-85">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                      <path
                        id={`scrollPath-${idx}`}
                        d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                        fill="none"
                      />
                      <text className="text-[10px] font-mono font-black fill-current tracking-[0.2em] uppercase">
                        <textPath href={`#scrollPath-${idx}`} startOffset="0%">
                          APOCALIPTO PZ ✦ SECURED ✦
                        </textPath>
                      </text>
                    </svg>
                  </div>

                  <div className="absolute inset-x-2 text-center flex flex-col items-center">
                    <span className="text-[10px] sm:text-xs md:text-sm font-black font-syne uppercase tracking-wider leading-none text-black">
                      {word.en}
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] font-bold font-mono tracking-tight mt-1 opacity-80 text-black leading-tight">
                      {word.jp}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. TEXTO HERO PRINCIPAL SOBRE LAS TARJETAS ── */}
      <div 
        style={{ 
          opacity: Math.max(0, 1 - waveProgress * 2.2),
          transform: `scale(${1 - waveProgress * 0.08})`
        }}
        className="relative z-30 text-center flex flex-col items-center justify-center px-4 max-w-5xl mx-auto pointer-events-none transition-transform duration-150"
      >
        {/* Badge superior de estado de seguridad */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950/80 border border-zinc-800 rounded-full font-mono text-[10px] text-zinc-400 tracking-[0.2em] uppercase mb-3 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DEFCON 5 [OPERATIONAL] // ORACLE CLOUD SA-BOGOTÁ</span>
        </div>

        {/* Logo Central Apocalipto PZ */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[110px] font-black tracking-tight text-white uppercase font-syne leading-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)]">
          APOCALIPTO PZ
        </h1>

        {/* Slogan central corto */}
        <p className="mt-3 text-base sm:text-xl md:text-2xl font-bold text-[#e6fb04] tracking-[0.25em] drop-shadow-md uppercase">
          “BLINDAJE TOTAL, ROL SIN LÍMITES”
        </p>

        {/* Subtítulo de categoría */}
        <p className="mt-1 text-[10px] sm:text-xs font-mono text-zinc-400 tracking-[0.25em] uppercase font-medium">
          KNOX COUNTY HARDCORE ROLEPLAY // SECURED CLIENT OS
        </p>
      </div>

      {/* Indicador inferior de Scroll interactivo */}
      <div className="absolute bottom-4 inset-x-8 flex items-center justify-between text-[10px] font-mono tracking-[0.25em] text-zinc-500 z-30 pointer-events-none">
        <span className="flex items-center gap-2 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e6fb04] animate-ping" />
          <span>HOVER TILES FOR TAC-SPECS</span>
        </span>
        <span className="flex items-center gap-1.5 text-zinc-400 animate-bounce">
          <span>
            {waveProgress >= 0.95 ? 'SCROLL DOWN TO INFRASTRUCTURE' : 'SCROLL DOWN TO REVEAL MISSION'}
          </span>
          <ArrowDown className="w-3 h-3 text-[#e6fb04]" />
        </span>
      </div>

    </section>
  );
}

