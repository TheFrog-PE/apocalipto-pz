import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';

export default function WorksRoulette3D({ 
  works, 
  onSelectProject, 
  onCursorEnter, 
  onCursorLeave 
}) {
  const containerRef = useRef(null);
  const itemCount = works.length;
  // Ángulo de separación entre módulos en el cilindro
  const anglePerItem = 70;
  
  // Radio del cilindro 3D físico
  const cylinderRadius = 400; 

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  // ── ROTADOR DINÁMICO DE SINÓNIMOS ALEATORIOS (FACCIONES, RAIDEO, TRAICIONES, MUERTE) ──
  const [synonymIndices, setSynonymIndices] = useState(() => works.map(() => 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setSynonymIndices(prev => 
        prev.map((currIdx, workIdx) => {
          const synonymsList = works[workIdx]?.synonyms || [];
          if (synonymsList.length <= 1) return 0;
          let nextIdx;
          do {
            nextIdx = Math.floor(Math.random() * synonymsList.length);
          } while (nextIdx === currIdx && synonymsList.length > 1);
          return nextIdx;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [works]);

  // Ángulo objetivo basado en el índice activo
  const targetRotation = currentIndex * anglePerItem;

  // Física de resorte ultra suave para emular la inercia de un tambor cilíndrico pesado
  const smoothRotation = useSpring(targetRotation, {
    stiffness: 100,
    damping: 22,
    mass: 0.6
  });

  const [currentRot, setCurrentRot] = useState(0);

  useEffect(() => {
    smoothRotation.set(targetRotation);
  }, [targetRotation, smoothRotation]);

  useEffect(() => {
    const unsubscribe = smoothRotation.on('change', (latest) => {
      setCurrentRot(latest);
    });
    return () => unsubscribe();
  }, [smoothRotation]);

  // ── ROTACIÓN DIRECTA POR SCROLL DENTRO DEL CONTENEDOR (SIN BLOQUEAR LA PÁGINA) ──
  const isHoveredRef = useRef(false);

  useEffect(() => {
    let accumulatedDelta = 0;
    let isCoolingDown = false;
    const threshold = 35;

    const handleWheel = (e) => {
      // Solo capturar cuando el cursor está sobre la ruleta
      if (!isHoveredRef.current) return;

      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      // Si aún podemos girar en la ruleta, prevenir scroll de página y rotar
      if (isScrollingDown && currentIndexRef.current < itemCount - 1) {
        e.preventDefault();
        e.stopPropagation();

        accumulatedDelta += e.deltaY;
        if (accumulatedDelta >= threshold && !isCoolingDown) {
          accumulatedDelta = 0;
          isCoolingDown = true;
          setCurrentIndex(prev => Math.min(itemCount - 1, prev + 1));
          setTimeout(() => { isCoolingDown = false; }, 180);
        }
      } else if (isScrollingUp && currentIndexRef.current > 0) {
        e.preventDefault();
        e.stopPropagation();

        accumulatedDelta += e.deltaY;
        if (accumulatedDelta <= -threshold && !isCoolingDown) {
          accumulatedDelta = 0;
          isCoolingDown = true;
          setCurrentIndex(prev => Math.max(0, prev - 1));
          setTimeout(() => { isCoolingDown = false; }, 180);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [itemCount]);

  // ── AUTOPLAY AUTOMÁTICO DE IMÁGENES / CARROUSEL ──
  useEffect(() => {
    const autoPlayInterval = setInterval(() => {
      if (!isHoveredRef.current) {
        setCurrentIndex(prev => (prev + 1) % itemCount);
      }
    }, 4500);

    return () => clearInterval(autoPlayInterval);
  }, [itemCount]);

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className="relative w-full h-[520px] sm:h-[580px] md:h-[640px] flex items-center justify-center select-none overflow-hidden"
      style={{ 
        perspective: '1200px',
        perspectiveOrigin: '50% 50%'
      }}
    >
      
      {/* ── CONTENEDOR 3D DEL CILINDRO GIRATORIO (TUBO TRIDIMENSIONAL) ── */}
      <div 
        className="w-full max-w-5xl h-[240px] sm:h-[280px] md:h-[320px] relative flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {works.map((work, idx) => {
          const itemBaseAngle = idx * anglePerItem;
          // El ángulo relativo en el tubo respecto a la rotación actual
          const angle = itemBaseAngle - currentRot;

          // Mostrar elementos dentro del arco visible del cilindro
          const isVisible = Math.abs(angle) <= 100;
          const rad = (angle * Math.PI) / 180;
          const cosAngle = Math.max(0, Math.cos(rad));
          
          // Atenuación suave y escala según cercanía al centro
          const opacity = isVisible ? Math.max(0.25, Math.pow(cosAngle, 1.2)) : 0;
          const scale = isVisible ? 0.75 + 0.25 * Math.pow(cosAngle, 1.5) : 0.75;
          const isClosest = Math.abs(angle) < (anglePerItem / 2.2);

          const activeSynonym = work.synonyms ? work.synonyms[synonymIndices[idx] || 0] : work.title;

          if (!isVisible) return null;

          return (
            <div
              key={work.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isClosest) {
                  onSelectProject(work);
                } else {
                  setCurrentIndex(idx);
                }
              }}
              onMouseEnter={() => {
                if (isClosest) onCursorEnter?.('', 'pulse');
              }}
              onMouseLeave={() => {
                onCursorLeave?.();
              }}
              className="absolute inset-x-0 mx-auto w-[92%] sm:w-[88%] max-w-4xl h-[220px] sm:h-[260px] md:h-[300px] cursor-pointer group rounded-[1rem] sm:rounded-[1.25rem] overflow-hidden"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${angle}deg) translateZ(${cylinderRadius}px) scale(${scale})`,
                opacity: opacity,
                pointerEvents: 'auto',
                zIndex: isClosest ? 30 : Math.round(cosAngle * 20),
              }}
            >
              
              {/* ── SUPERFICIE DEL BANNER PEGADA AL TUBO 3D ── */}
              <div 
                className={`w-full h-full rounded-[1rem] sm:rounded-[1.25rem] overflow-hidden bg-[#111216] border transition-all duration-300 shadow-[0_25px_60px_rgba(0,0,0,0.98)] ${
                  isClosest 
                    ? 'border-[#e6fb04]/70 shadow-[0_0_35px_rgba(230,251,4,0.15)]' 
                    : 'border-zinc-800/80 hover:border-zinc-600'
                }`}
              >
                {/* ── IMAGEN DE FONDO REAL DE PROJECT ZOMBOID ── */}
                {work.image && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <img
                      src={work.image}
                      alt={work.title}
                      className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
                        isClosest 
                          ? 'brightness-[0.88] contrast-[1.05] group-hover:scale-105 group-hover:brightness-[0.95]' 
                          : 'brightness-[0.55] contrast-[1.0]'
                      }`}
                      loading="eager"
                      style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    />
                    {/* Overlay de oscurecimiento */}
                    <div className={`absolute inset-0 transition-colors ${
                      isClosest ? 'bg-black/30 group-hover:bg-black/15' : 'bg-black/55'
                    }`} />
                  </div>
                )}

                {/* ── TEXTO INTEGRADO EN LA CARA DEL CILINDRO ── */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 sm:p-8 text-center pointer-events-none">
                  <h3 className={`font-black uppercase tracking-tight text-white font-syne leading-tight drop-shadow-[0_10px_25px_rgba(0,0,0,0.98)] transition-all duration-300 ${
                    isClosest 
                      ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white' 
                      : 'text-xl sm:text-2xl md:text-3xl text-zinc-300'
                  }`}>
                    {activeSynonym}
                  </h3>
                  
                  {isClosest && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 text-[11px] sm:text-xs md:text-sm font-mono font-bold text-zinc-200 drop-shadow-[0_4px_12px_rgba(0,0,0,0.98)] max-w-xl text-center tracking-widest uppercase"
                    >
                      {work.subtitle}
                    </motion.p>
                  )}
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

