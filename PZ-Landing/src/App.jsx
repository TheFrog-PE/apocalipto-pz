import React, { useState } from 'react';
import './App.css';

// UI & Layout
import CustomCursor from './components/ui/CustomCursor';
import Navbar from './components/layout/Navbar';
import DownloadModal from './components/modals/DownloadModal';

// Secciones
import HeroKV from './components/hero/HeroKV';
import WorksSection from './components/sections/WorksSection';
import ServiceSection from './components/sections/ServiceSection';
import AwardsSection from './components/sections/AwardsSection';
import RecruitSection from './components/sections/RecruitSection';
import ContactSection from './components/sections/ContactSection';
import NewsSection from './components/sections/NewsSection';
import Footer from './components/layout/Footer';

export default function App() {
  const [cursorText, setCursorText] = useState('');
  const [cursorVariant, setCursorVariant] = useState('default');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleCursorEnter = (text = '', variant = 'hover') => {
    setCursorText(text);
    setCursorVariant(variant);
  };

  const handleCursorLeave = () => {
    setCursorText('');
    setCursorVariant('default');
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#ebebeb] relative selection:bg-[#e6fb04] selection:text-black">
      
      {/* ── 1. CURSOR INTERACTIVO DINÁMICO (ESTILO JUNNI) ── */}
      <CustomCursor
        cursorText={cursorText}
        cursorVariant={cursorVariant}
      />

      {/* ── 2. NAVEGACIÓN FIJA Y OVERLAY FULLSCREEN ── */}
      <Navbar
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
        onOpenContact={() => setIsContactModalOpen(true)}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* ── 3. HERO KEY VISUAL & PHILOSOPHY (CANVAS THREE.JS + 3D FLIP TILE MASK & UNMASK) ── */}
      <HeroKV
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
        onOpenContact={() => setIsContactModalOpen(true)}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* ── 4. SECCIÓN WORKS (PORTAFOLIO, MARQUESINA Y FIRMAS GRISES) ── */}
      <WorksSection
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

      {/* ── 5. SECCIÓN SERVICE (CAPACIDADES EDITORIALES Y ACORDEÓN) ── */}
      <ServiceSection
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

      {/* ── 6. SECCIÓN AWARDS (MARQUESINAS BIDIRECCIONALES) ── */}
      <AwardsSection
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

      {/* ── 7. SECCIÓN RECRUIT (BANNER DINÁMICO DE TALENTO & LAUNCHER) ── */}
      <RecruitSection
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
        onOpenContact={() => setIsContactModalOpen(true)}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* ── 8. SECCIÓN CONTACT (ESTABLECER TRANSMISIÓN) ── */}
      <ContactSection
        isContactModalOpen={isContactModalOpen}
        setIsContactModalOpen={setIsContactModalOpen}
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

      {/* ── 8.5. MODAL DE DESCARGA & ACCESO DIRECTO AL LAUNCHER ── */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

      {/* ── 9. SECCIÓN FAQ // PREGUNTAS FRECUENTES DE SUPERVIVENCIA ── */}
      <NewsSection
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

      {/* ── 10. FOOTER INDEPENDIENTE AL FINAL ── */}
      <Footer
        onCursorEnter={handleCursorEnter}
        onCursorLeave={handleCursorLeave}
      />

    </div>
  );
}