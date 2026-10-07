import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, useSpring } from 'framer-motion';
import { ArrowUpRight, Shield, Terminal, Users, Cpu, Download } from 'lucide-react';
import { COMPANY_INFO } from '../../data/landingData';
import { fetchLiveSwarmStats } from '../../services/swarmTelemetry';

export default function RecruitSection({ onCursorEnter, onCursorLeave, onOpenContact, onOpenDownload }) {
  const containerRef = useRef(null);
  const mountRef = useRef(null);
  const [swarmStats, setSwarmStats] = useState(null);

  useEffect(() => {
    fetchLiveSwarmStats().then(setSwarmStats);
  }, []);

  // ── 1. THREE.JS PROCEDURAL PARTICLES CANVAS (FONDO DE ONDA AMBIENTAL INTERACTIVO DE BLINDAJE) ──
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

    const geometry = new THREE.PlaneGeometry(80, 55, 75, 75);
    const count = geometry.attributes.position.count;
    const initialPositions = geometry.attributes.position.array.slice();

    const material = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xe6fb04,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = -Math.PI / 2.8;
    points.position.y = -4;
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
        const wave = Math.sin(u * 0.2 + elapsedTime * 1.0) * Math.cos(v * 0.2 + elapsedTime * 0.8) * 2.4;
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

  // Progreso continuo de rotación (0 = Cara frontal 0°, 1 = Cara trasera 180°)
  const [flipProgress, setFlipProgress] = useState(0);
  const flipProgressRef = useRef(0);
  flipProgressRef.current = flipProgress;

  const smoothAngle = useSpring(0, {
    stiffness: 75,
    damping: 24,
    mass: 0.5
  });

  const [currentAngle, setCurrentAngle] = useState(0);

  useEffect(() => {
    smoothAngle.set(flipProgress * 180);
  }, [flipProgress, smoothAngle]);

  useEffect(() => {
    const unsubscribe = smoothAngle.on('change', (latest) => {
      setCurrentAngle(latest);
    });
    return () => unsubscribe();
  }, [smoothAngle]);

  // ── INTERCEPTOR GLOBAL DE SCROLL ──
  useEffect(() => {
    let accumulatedDelta = 0;
    let isCoolingDown = false;
    const threshold = 40;

    const handleWheel = (e) => {
      const section = document.getElementById('recruit');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isSectionInView = rect.top <= 120 && rect.bottom >= viewportHeight - 120;
      if (!isSectionInView) return;

      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      if (isScrollingDown && flipProgressRef.current < 1) {
        e.preventDefault();
        e.stopPropagation();

        accumulatedDelta += e.deltaY;
        if (accumulatedDelta >= threshold && !isCoolingDown) {
          accumulatedDelta = 0;
          isCoolingDown = true;
          setFlipProgress(1);
          setTimeout(() => { isCoolingDown = false; }, 220);
        }
      } else if (isScrollingUp && flipProgressRef.current > 0) {
        e.preventDefault();
        e.stopPropagation();

        accumulatedDelta += e.deltaY;
        if (accumulatedDelta <= -threshold && !isCoolingDown) {
          accumulatedDelta = 0;
          isCoolingDown = true;
          setFlipProgress(0);
          setTimeout(() => { isCoolingDown = false; }, 220);
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const section = document.getElementById('recruit');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      if (rect.top > 120 || rect.bottom < window.innerHeight - 120) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (deltaY > 25 && flipProgressRef.current < 1) {
        e.preventDefault();
        touchStartY = touchY;
        setFlipProgress(1);
      } else if (deltaY < -25 && flipProgressRef.current > 0) {
        e.preventDefault();
        touchStartY = touchY;
        setFlipProgress(0);
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
  }, []);

  return (
    <section 
      ref={containerRef} 
      id="recruit" 
      className="min-h-screen w-full bg-[#090a0d] text-[#ebebeb] relative overflow-hidden flex flex-col justify-between py-16 md:py-24 px-4 sm:px-8 md:px-12 select-none border-b border-zinc-900"
    >
      {/* ── FONDO: Canvas de ondas de partículas 3D Three.js de Blindaje ── */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 z-0 pointer-events-none opacity-50" 
      />

      {/* Luces de radar tácticas */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#e6fb04]/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center my-auto py-8">
        
        {/* ── TEXTO CENTRAL RECRUIT & MANIFIESTO MILITAR ── */}
        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center space-y-4 sm:space-y-5 pointer-events-none mb-4">
          
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white font-montserrat leading-[1.05] drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
            ELIGE TU FACCIÓN &amp; DOMINA KNOX
          </h2>

          <div className="space-y-2 text-zinc-300 font-sans text-xs sm:text-sm leading-relaxed max-w-xl px-4 drop-shadow-md">
            <p className="font-bold text-red-500 tracking-wide text-xs sm:text-sm font-mono uppercase">
              FACCIONES OFICIALES DE KNOX COUNTY // WHITELIST ABIERTA
            </p>
            <p className="text-zinc-300 font-light text-[12px] sm:text-xs">
              En Apocalipto PZ la supervivencia no es casualidad: arquitectura P2P descentralizada ($0 Cloud), cliente blindado con HWID y balanza de 50 cupos en tiempo real.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1 font-mono text-[10px] flex-wrap">
              <span className="text-blue-400 font-bold border border-blue-500/40 bg-blue-950/30 px-2 py-0.5 rounded">✦ DOE — Militares [{swarmStats?.factions?.doe?.count ?? 0}/10]</span>
              <span className="text-red-400 font-bold border border-red-500/40 bg-red-950/30 px-2 py-0.5 rounded">✦ MOK — Crimen [{swarmStats?.factions?.mok?.count ?? 1}/10]</span>
              <span className="text-amber-400 font-bold border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 rounded">✦ KTO — Culto [{swarmStats?.factions?.kto?.count ?? 0}/10]</span>
              <span className="text-emerald-400 font-bold border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 rounded">✦ RIV — Milicia [{swarmStats?.factions?.riv?.count ?? 0}/10]</span>
            </div>
          </div>

          <div className="pt-2 pointer-events-auto flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenContact}
              onMouseEnter={() => onCursorEnter?.('APPLY')}
              onMouseLeave={() => onCursorLeave?.()}
              className="px-6 py-3 bg-[#e6fb04] hover:bg-white text-black font-extrabold text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(230,251,4,0.3)] cursor-pointer hover:scale-105 flex items-center gap-2 font-syne"
            >
              <span>SOLICITAR WHITELIST</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              onClick={onOpenDownload || onOpenContact}
              onMouseEnter={() => onCursorEnter?.('LAUNCHER')}
              onMouseLeave={() => onCursorLeave?.()}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-emerald-500 font-extrabold text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2 font-syne shadow-lg"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>DESCARGAR LAUNCHER</span>
            </button>
          </div>

        </div>


        {/* ── 3. TARJETA CENTRAL DESTACADA EN FLUJO NATURAL ── */}
        <div 
          className="relative z-20 mt-6 sm:mt-8 w-[92vw] sm:w-[580px] md:w-[680px] aspect-[1920/997] max-h-[380px]"
          style={{ perspective: '1600px' }}
        >
          <div
            style={{
              transform: `rotateY(${currentAngle}deg)`,
              transformStyle: 'preserve-3d',
            }}
            className="w-full h-full relative rounded-xl sm:rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.98),0_0_35px_rgba(230,251,4,0.15)] cursor-pointer"
          >
            
            {/* ── CARA FRONTAL (0°): FOTO REAL DE APOCALIPTO-PZ-LAUNCHER-1 ── */}
            <div 
              className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden bg-[#12141c] border border-zinc-700 shadow-2xl flex flex-col"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
              }}
            >
              <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
                <img
                  src="/images/apocalipto-pz-launcher-1.PNG"
                  alt="Launcher Principal Apocalipto PZ"
                  className="w-full h-full object-contain brightness-100 contrast-105"
                  loading="eager"
                />
              </div>
            </div>

            {/* ── CARA TRASERA (180°): INFORMACIÓN TÉCNICA DEL LAUNCHER DE SEGURIDAD ── */}
            <div 
              className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden bg-[#07080b] border border-[#e6fb04]/80 shadow-[0_0_40px_rgba(230,251,4,0.2)] flex flex-col justify-between"
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <div className="relative w-full h-full bg-[#090b10] overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8">
                
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#ffffff12_0%,#0e1118_70%,#000000_100%)]" />
                
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[90px] sm:text-[110px] font-black font-syne italic text-white/[0.03] select-none pointer-events-none">
                  LAUNCHER
                </div>

                <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-2.5 max-w-lg">
                  <span className="text-xl sm:text-3xl md:text-4xl font-black font-syne uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-emerald-300 drop-shadow-[0_8px_25px_rgba(255,255,255,0.35)] leading-tight">
                    LAUNCHER DE SEGURIDAD // V4.2
                  </span>
                  
                  <span className="text-xs sm:text-sm md:text-base font-mono font-bold tracking-wider text-zinc-200 drop-shadow-md uppercase">
                    BLINDAJE DE CLIENTE &amp; HWID BINDING OBLIGATORIO
                  </span>
                  
                  <p className="text-[11px] sm:text-xs text-zinc-300 font-light leading-relaxed max-w-md">
                    Pasarela de seguridad propietaria con verificación SHA-256 y sincronización automática de mods en un solo clic. Cero tolerancia al duping y clientes modificados.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[9px] sm:text-[10px]">
                    <span className="bg-black/80 px-2.5 py-1 rounded-md border border-emerald-500/40 text-emerald-400 font-bold">
                      ✓ ANTI-CHEAT HWID
                    </span>
                    <span className="bg-black/80 px-2.5 py-1 rounded-md border border-yellow-500/40 text-yellow-300 font-bold">
                      ✓ MODS AUTO-SYNC
                    </span>
                    <span className="bg-black/80 px-2.5 py-1 rounded-md border border-cyan-500/40 text-cyan-300 font-bold">
                      ✓ 60 TPS P2P SWARM
                    </span>
                  </div>
                </div>

                <div className="absolute top-3.5 left-5 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e6fb04]" />
                  <span>APOCALIPTO SECURITY OS // 2026</span>
                </div>
                <div className="absolute bottom-3.5 right-5 text-[10px] font-mono text-[#e6fb04] font-bold">
                  ✦ 180° REVERSE SIDE
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 1. FOTO ARRIBA IZQUIERDA (Panel Administrativo - Proporción 1920x997) ── */}
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-12 sm:-left-8 lg:-left-2 top-0 sm:top-2 md:top-4 w-64 sm:w-80 md:w-96 lg:w-[460px] xl:w-[500px] aspect-[1880/997] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-zinc-800/80 z-0 pointer-events-none hidden sm:block opacity-55 hover:opacity-90 transition-all blur-[1px]"
        >
          <div className="relative w-full h-full bg-[#1b1c22]">
            <img
              src="/images/panel-administrativo.PNG"
              alt="Panel Administrativo Bento"
              className="w-full h-full object-contain brightness-[0.80] contrast-[1.05]"
              loading="eager"
            />
          </div>
        </motion.div>

        {/* ── 2. FOTO ABAJO IZQUIERDA (Launcher Módulo 2 - Proporción 1920x997) ── */}
        <motion.div 
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="absolute -left-6 sm:-left-4 lg:left-4 bottom-1 sm:bottom-3 md:bottom-5 w-48 sm:w-64 md:w-72 lg:w-[340px] xl:w-[370px] aspect-[1920/997] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-zinc-800 z-0 pointer-events-none hidden md:block opacity-70 hover:opacity-100 transition-all"
        >
          <div className="relative w-full h-full bg-[#1b1c22]">
            <img
              src="/images/apocalipto-pz-launcher-2.PNG"
              alt="Launcher Motor de Seguridad"
              className="w-full h-full object-contain brightness-[0.85] contrast-[1.05]"
              loading="eager"
            />
          </div>
        </motion.div>

        {/* ── 4. FOTO ARRIBA DERECHA (Launcher Módulo 3 - Proporción 1920x997) ── */}
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute -right-8 sm:-right-6 lg:right-0 top-1 sm:top-3 md:top-5 w-52 sm:w-72 md:w-80 lg:w-[380px] xl:w-[410px] aspect-[1920/997] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-zinc-800/90 z-0 pointer-events-none hidden sm:block opacity-60 hover:opacity-90 transition-all blur-[0.6px]"
        >
          <div className="relative w-full h-full bg-[#1b1c22]">
            <img
              src="/images/apocalipto-pz-launcher-3.PNG"
              alt="Launcher Vinculación HWID"
              className="w-full h-full object-contain brightness-[0.85] contrast-[1.05]"
              loading="eager"
            />
          </div>
        </motion.div>

        {/* ── 5. FOTO ABAJO DERECHA (Launcher Módulo 4 - Proporción 1920x997) ── */}
        <motion.div 
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          className="absolute -right-12 sm:-right-8 lg:-right-4 bottom-0 sm:bottom-2 md:bottom-4 w-60 sm:w-76 md:w-92 lg:w-[440px] xl:w-[480px] aspect-[1920/997] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-zinc-800/80 z-0 pointer-events-none hidden md:block opacity-55 hover:opacity-90 transition-all blur-[1.2px]"
        >
          <div className="relative w-full h-full bg-[#1b1c22]">
            <img
              src="/images/apocalipto-pz-launcher-4.PNG"
              alt="Launcher Sincronización Mods"
              className="w-full h-full object-contain brightness-[0.80] contrast-[1.05]"
              loading="eager"
            />
          </div>
        </motion.div>

      </div>



    </section>
  );
}

