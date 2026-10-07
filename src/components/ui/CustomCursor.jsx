import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor({ cursorText, cursorVariant }) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isPulseVariant = cursorVariant === 'pulse';
  const isTextVariant = Boolean(cursorText);
  const isHovered = cursorVariant === 'hover' || isTextVariant;

  return (
    <div className="hidden md:block pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {isPulseVariant ? (
        <div
          style={{
            position: 'fixed',
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="relative flex items-center justify-center pointer-events-none"
        >
          {/* Anillo de pulso exterior en expansión */}
          <span className="absolute w-9 h-9 rounded-full bg-[#e6fb04]/30 animate-ping" />
          {/* Anillo de resplandor medio */}
          <span className="absolute w-7 h-7 rounded-full border border-[#e6fb04]/60 bg-[#e6fb04]/20 animate-pulse shadow-[0_0_20px_rgba(230,251,4,0.6)]" />
          {/* Núcleo central del círculo */}
          <span className="relative w-3.5 h-3.5 rounded-full bg-[#e6fb04] shadow-[0_0_12px_#e6fb04]" />
        </div>
      ) : (
        /* Píldora compacta que sigue al cursor */
        <motion.div
          animate={{
            x: mousePos.x,
            y: mousePos.y,
            scale: isTextVariant ? 1 : isHovered ? 1.4 : 1,
          }}
          transition={{
            type: 'spring',
            damping: 32,
            stiffness: 400,
            mass: 0.4
          }}
          style={{ translateX: '-50%', translateY: '-50%' }}
          className={`flex items-center justify-center transition-colors duration-150 whitespace-nowrap max-w-max select-none ${
            isTextVariant
              ? 'bg-[#e6fb04] text-black px-3.5 py-1.5 rounded-full font-mono text-[10px] font-extrabold tracking-widest shadow-[0_0_15px_rgba(230,251,4,0.5)]'
              : isHovered
              ? 'w-10 h-10 rounded-full border-2 border-[#e6fb04] bg-[#e6fb04]/10 backdrop-blur-xs'
              : 'w-5 h-5 rounded-full border border-white/60 bg-white/20 backdrop-blur-xs'
          }`}
        >
          {isTextVariant && <span className="leading-none">{cursorText}</span>}
        </motion.div>
      )}
    </div>
  );
}
