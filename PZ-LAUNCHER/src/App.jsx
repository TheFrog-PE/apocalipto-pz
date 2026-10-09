import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import './App.css';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import FactionsTab from './components/tabs/FactionsTab';
import NewsTab from './components/tabs/NewsTab';
import ContactTab from './components/tabs/ContactTab';
import RulesModal from './components/modals/RulesModal';
import LaunchModal from './components/modals/LaunchModal';
import UpdateModal from './components/modals/UpdateModal';
import Toast from './components/ui/Toast';
import { checkLauncherUpdate } from './version';

import { FACTIONS } from './data/factionsData';
import factionsBg from './assets/apocalipto-pz-facciones.webp';
import newsBg from './assets/publicaciones-bg-pz.webp';
import contactBg from './assets/contacto-bg-pz.webp';

import { getSavedPermanentTicket, savePermanentTicket, getSwarmBridgeUrl, getOrCreateLocalIdentity, launchProjectZomboid, activateAlfaEngine, getAlfaStatus, resetSwarmCharacter, setSwarmNodeFaction } from './services/swarmClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('facciones');
  
  // Solo se bloquea si el Creador YA le otorgó acceso criptográfico en Bento OS
  const [approvedFaction, setApprovedFaction] = useState(() => {
    try {
      const ticket = getSavedPermanentTicket();
      if (ticket && ticket.creatorSignature) {
        const p = ticket.payload;
        return (p?.factionId || p?.faction || '').toLowerCase() || null;
      }
    } catch {}
    return null;
  });

  // El jugador puede navegar y cambiar libremente entre facciones antes de la aprobación
  const [selectedFaction, setSelectedFaction] = useState(() => {
    try {
      const ticket = getSavedPermanentTicket();
      if (ticket && ticket.creatorSignature) {
        const p = ticket.payload;
        const fid = (p?.factionId || p?.faction || '').toLowerCase();
        if (fid) return fid;
      }
    } catch {}
    return 'mok';
  });

  const [showRules, setShowRules] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [factions, setFactions] = useState(FACTIONS);
  const [survivorName, setSurvivorName] = useState(() => localStorage.getItem('pz_survivor_name') || '');

  const handleSurvivorNameChange = (val) => {
    setSurvivorName(val);
    try { localStorage.setItem('pz_survivor_name', val); } catch {}
  };

  // Estado de Modo Rendimiento Gráfico (Items 2D, Sangre OFF, Niebla Ligera)
  const [perfMode, setPerfMode] = useState(() => {
    try {
      const saved = localStorage.getItem('pz_perf_mode');
      return saved !== null ? saved === 'true' : true; // Por defecto ACTIVADO para cuidar la PC
    } catch {
      return true;
    }
  });

  const handleTogglePerfMode = () => {
    setPerfMode(prev => {
      const next = !prev;
      try { localStorage.setItem('pz_perf_mode', String(next)); } catch {}
      handleShowToast({
        title: next ? 'MODO RENDIMIENTO ACTIVADO' : 'MODO RENDIMIENTO DESACTIVADO',
        desc: next 
          ? 'Project Zomboid se ejecutará optimizado (Items 2D, sangre OFF, niebla fluida).'
          : 'Project Zomboid se ejecutará con gráficos estándar/originales.',
        type: next ? 'success' : 'info'
      });
      return next;
    });
  };

  // Estado del Motor de Failover Alfa — indica si este nodo está emitiendo heartbeats P2P
  const [alfaStatus, setAlfaStatus] = useState({ alfaEngineActive: false, alfaNodeId: null });

  // Estado de actualización del Launcher (semver check automático con GitHub)
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const info = await checkLauncherUpdate();
        if (info && (info.updateRequired || info.updateAvailable)) {
          setUpdateInfo(info);
          if (info.updateRequired) {
            setShowUpdateModal(true);
          }
        }
      } catch {}
    };
    checkUpdate();
    const interval = setInterval(checkUpdate, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateLauncher = async () => {
    const targetUrl = updateInfo?.downloadUrl || 'https://github.com/TheFrog-PE/apocalipto-pz/raw/main/public/downloads/ApocaliptoPZ-Setup.exe';
    try {
      const { open } = await import('@tauri-apps/api/shell');
      await open(targetUrl);
    } catch {
      window.open(targetUrl, '_blank');
    }
  };

  // Sincronizar conteo de facciones en vivo con el Enjambre (0 si no hay nadie)
  // Sincronizar conteo de facciones en vivo y estado de aprobación del nodo local
  useEffect(() => {
    const fetchStats = async () => {
      const bridgeUrl = getSwarmBridgeUrl();
      try {
        // 1. Conteo público y anónimo de facciones
        const res = await fetch(`${bridgeUrl}/api/swarm/stats`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.counts) {
            setFactions(prev => {
              const hasChanged = prev.some(f => (data.counts[f.id] !== undefined ? data.counts[f.id] : 0) !== f.current);
              if (!hasChanged) return prev;
              return prev.map(f => ({
                ...f,
                current: data.counts[f.id] !== undefined ? data.counts[f.id] : 0
              }));
            });
          }
        }

        // 2. Consulta segura y aislada del ticket propio de este nodo (cero filtración de terceros)
        const localId = getOrCreateLocalIdentity();
        if (localId?.nodeId) {
          const statusRes = await fetch(`${bridgeUrl}/api/node/status/${localId.nodeId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === 'APPROVED' && statusData.ticket) {
              const fid = (statusData.ticket.payload?.factionId || statusData.ticket.payload?.faction || '').toLowerCase();
              if (fid) {
                savePermanentTicket(statusData.ticket);
                setApprovedFaction(fid);
                setSelectedFaction(fid);
              }
            } else if (statusData.status === 'NOT_FOUND' && approvedFaction) {
              // Si fue reseteado en el servidor
              try {
                localStorage.removeItem('apocalipto_admission_ticket');
                localStorage.removeItem('apocalipto_local_identity');
                localStorage.removeItem('apocalipto_chosen_faction');
                localStorage.removeItem('pz_survivor_name');
              } catch {}
              setApprovedFaction(null);
              setSurvivorName('');
            }
          }
        }
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 2500);
    return () => clearInterval(interval);
  }, [approvedFaction]);

  // Polling del estado del Motor de Failover Alfa — actualiza el indicador táctico cada 6s
  useEffect(() => {
    const pollAlfa = async () => {
      const status = await getAlfaStatus();
      setAlfaStatus(status);
    };
    pollAlfa();
    const interval = setInterval(pollAlfa, 6000);
    return () => clearInterval(interval);
  }, []);
  
  // Coordenadas para el parallax y el radio de luz/color interactivo
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: -1000, y: -1000 });

  // Cambio libre de facción antes de ser aprobado por el creador
  const handleSelectFaction = (factionId) => {
    if (approvedFaction) return; // Si ya tiene facción fijada, no cambia hasta reiniciar personaje
    setSelectedFaction(factionId);
  };

  const handleResetFaction = async () => {
    try {
      const localId = getOrCreateLocalIdentity();
      if (localId?.nodeId) {
        await resetSwarmCharacter(localId.nodeId);
      }
    } catch {}
    setApprovedFaction(null);
    setSurvivorName('');
    setShowLaunchModal(false);
    handleShowToast({
      title: 'PERSONAJE REINICIADO',
      desc: 'Tu personaje ha sido eliminado y se ha liberado la selección de facción. Elige una nueva facción y tu alias.',
      type: 'info'
    });
  };

  // Escuchar SWARM_RESET desde Bento OS para desbloquear y limpiar al instante
  useEffect(() => {
    let bc;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('apocalipto_pz_rules_channel');
        bc.onmessage = (e) => {
          if (e.data?.type === 'SWARM_RESET') {
            try {
              localStorage.removeItem('apocalipto_admission_ticket');
              localStorage.removeItem('apocalipto_local_identity');
              localStorage.removeItem('apocalipto_chosen_faction');
            } catch {}
            setApprovedFaction(null);
            setShowLaunchModal(false);
            setFactions(prev => prev.map(f => ({ ...f, current: 0 })));
          }

          if (e.data?.type === 'NODE_APPROVED') {
            const localId = getOrCreateLocalIdentity();
            if (e.data?.nodeId === localId?.nodeId) {
              const fid = (e.data.factionId || '').toLowerCase();
              if (fid) {
                setApprovedFaction(fid);
                setSelectedFaction(fid);
                handleShowToast({
                  title: '¡ACCESO CONCEDIDO POR EL CREADOR!',
                  desc: `Tu nodo ha sido verificado criptográficamente en la facción ${fid.toUpperCase()}.`,
                  type: 'success'
                });
              }
            }
          }
        };
      }
    } catch {}
    return () => {
      if (bc) bc.close();
    };
  }, []);

  const selectedFactionData = factions.find((f) => f.id === selectedFaction) || null;
  const onlineCount = factions.reduce((acc, f) => acc + (f.current || 0), 0);

  const handleLaunchGame = async () => {
    if (!selectedFactionData) return;

    // Si ya está aprobado por el Creador, disparar directamente la ejecución
    if (approvedFaction) {
      const localId = getOrCreateLocalIdentity();
      const finalPlayerName = (survivorName && survivorName.trim().length > 0)
        ? survivorName.trim()
        : `Superviviente_${selectedFactionData.tag}`;

      handleShowToast({
        title: 'INICIANDO PROJECT ZOMBOID',
        desc: `Conectando directo al servidor como ${finalPlayerName}...`,
        type: 'success'
      });
      const res = await launchProjectZomboid(localId.nodeId, selectedFactionData.tag, finalPlayerName, perfMode);
      if (res.success) {
        // ── ACTIVAR MOTOR DE FAILOVER ALFA ─────────────────────────────────
        // Solo el anfitrión local (Creador / Nodo Alfa) activa el emitter de heartbeats.
        const currentBridge = getSwarmBridgeUrl();
        const isLocalHost = currentBridge.includes('localhost') || currentBridge.includes('127.0.0.1');
        if (isLocalHost) {
          const alfaRes = await activateAlfaEngine(localId.nodeId);
          if (alfaRes.success) {
            setAlfaStatus({ alfaEngineActive: true, alfaNodeId: localId.nodeId });
            handleShowToast({
              title: '🟢 NODO ALFA ACTIVO',
              desc: 'Motor de Failover P2P iniciado. Heartbeats cada 5s.',
              type: 'success'
            });
          }
        }
        // ───────────────────────────────────────────────────────────────────
      } else {
        // Si falló por alguna razón técnica, abrir el modal para diagnóstico
        setShowLaunchModal(true);
      }
      return;
    }

    // Si aún no está aprobado, abrir el modal de verificación y aprobación
    setShowLaunchModal(true);
  };
  const handleShowToast = (newToast) => setToast(newToast);

  const handleMouseMove = (e) => {
    const normX = (e.clientX / window.innerWidth  - 0.5) * 2;
    const normY = (e.clientY / window.innerHeight - 0.5) * 2;
    
    // Parallax suave
    setParallaxOffset({ x: normX * -18, y: normY * -12 });
    
    // Coordenadas absolutas para el haz de luz/color
    setMouseCoords({ x: e.clientX, y: e.clientY });
  };

  let activeBackground = factionsBg;
  if (activeTab === 'publicaciones') activeBackground = newsBg;
  if (activeTab === 'contacto')      activeBackground = contactBg;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen bg-[#070707] text-zinc-100 flex flex-col justify-between font-sans select-none overflow-x-hidden"
    >
      {/* ─── 1. IMAGEN DE FONDO BASE (Desaturada, fría y oscura táctica) ─── */}
      <div
        className="fixed -inset-10 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-300 ease-out will-change-transform bg-tactical-filter"
        style={{
          backgroundImage: `url(${activeBackground})`,
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.05)`,
        }}
      />

      {/* ─── 2. HAZ DE LUZ / SPOTLIGHT INTERACTIVO DEL MOUSE ───
          Revela color sutilmente desaturado en un radio suave alrededor del cursor */}
      <div
        className="fixed -inset-10 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${activeBackground})`,
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.05)`,
          filter: 'saturate(0.70) brightness(0.85) contrast(1.05)',
          maskImage: `radial-gradient(circle 280px at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 280px at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)`,
        }}
      />

      {/* ─── 3. LÍNEAS DE ESCANEO CRT (SCANLINES DE TUBO) ─── */}
      <div className="fixed inset-0 crt-scanlines pointer-events-none" />

      {/* ─── 4. CURVATURA Y VIÑETA DE MONITOR CRT ─── */}
      <div className="fixed inset-0 crt-tube crt-corners pointer-events-none" />

      {/* ─── 5. MALLA Y COORDENADAS TÁCTICAS HUD ─── */}
      <div className="fixed inset-0 tactical-mesh pointer-events-none" />
      <div className="fixed inset-0 tactical-crossdots pointer-events-none" />

      {/* ─── 6. TRACKING VHS ANALÓGICO ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="vhs-tracking" />
      </div>

      {/* ─── CONTENIDO DE LA APLICACIÓN ─── */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRules={() => setShowRules(true)}
        onlineCount={onlineCount}
        gatewayUrl={getSwarmBridgeUrl()}
        alfaStatus={alfaStatus}
      />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-6 w-full max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'facciones' && (
            <FactionsTab
              key="facciones"
              factions={factions}
              selectedFaction={selectedFaction}
              approvedFaction={approvedFaction}
              survivorName={survivorName}
              onSurvivorNameChange={handleSurvivorNameChange}
              onSelectFaction={handleSelectFaction}
              onResetFaction={handleResetFaction}
              onLaunchGame={handleLaunchGame}
              updateInfo={updateInfo}
              onUpdateLauncher={handleUpdateLauncher}
              perfMode={perfMode}
              onTogglePerfMode={handleTogglePerfMode}
            />
          )}
          {activeTab === 'publicaciones' && (
            <NewsTab key="publicaciones" onShowToast={handleShowToast} />
          )}
          {activeTab === 'contacto' && (
            <ContactTab key="contacto" onShowToast={handleShowToast} />
          )}
        </AnimatePresence>
      </main>

      <Footer />

      <RulesModal  isOpen={showRules}       onClose={() => setShowRules(false)} />
      <UpdateModal isOpen={showUpdateModal} updateInfo={updateInfo} onClose={() => setShowUpdateModal(false)} />
      <LaunchModal 
        isOpen={showLaunchModal} 
        onClose={() => setShowLaunchModal(false)} 
        selectedFactionData={selectedFactionData} 
        survivorName={survivorName}
        onSurvivorNameChange={handleSurvivorNameChange}
        perfMode={perfMode}
        onTogglePerfMode={handleTogglePerfMode}
        onApproved={(fid) => {
          setApprovedFaction(fid);
          if (fid) {
            setSelectedFaction(fid);
            const localId = getOrCreateLocalIdentity();
            if (localId?.nodeId) {
              setSwarmNodeFaction(localId.nodeId, fid.toUpperCase(), fid.toLowerCase());
            }
          }
        }}
      />
      <Toast       toast={toast}            onClose={() => setToast(null)} />
    </div>
  );
}