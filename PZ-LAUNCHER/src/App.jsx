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

import { getSavedPermanentTicket, savePermanentTicket, getSwarmBridgeUrl, getOrCreateLocalIdentity, launchProjectZomboid, activateAlfaEngine, getAlfaStatus, resetSwarmCharacter, setSwarmNodeFaction, fetchSavedCharacters, removeSavedCharacter, recordCharacterFaction, checkIsGameRunning } from './services/swarmClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('facciones');
  
  // Facción bloqueada / elegida:
  // Se obtiene de localStorage ('apocalipto_chosen_faction') o del ticket permanente si existe.
  const [chosenFaction, setChosenFaction] = useState(() => {
    try {
      const ticket = getSavedPermanentTicket();
      if (ticket && ticket.creatorSignature) {
        const p = ticket.payload;
        const fid = (p?.factionId || p?.faction || '').toLowerCase();
        if (fid) return fid;
      }
      const saved = localStorage.getItem('apocalipto_chosen_faction');
      if (saved && saved.trim()) return saved.trim().toLowerCase();
    } catch {}
    return null;
  });

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

  const [showRules, setShowRules] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [toast, setToast] = useState(null);
  const handleShowToast = (newToast) => setToast(newToast);
  const [factions, setFactions] = useState(FACTIONS);
  const [survivorName, setSurvivorName] = useState(() => {
    const saved = localStorage.getItem('pz_survivor_name');
    if (saved && saved.trim()) return saved.trim();
    try {
      const localId = getOrCreateLocalIdentity();
      const shortId = (localId?.nodeId || '1234').replace('node_', '').substring(0, 4).toUpperCase();
      const generated = `Superviviente_${shortId}`;
      try { localStorage.setItem('pz_survivor_name', generated); } catch {}
      return generated;
    } catch {
      return `Superviviente_${Math.floor(1000 + Math.random() * 9000)}`;
    }
  });

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

  // Supervivientes guardados en SQLite de Project Zomboid (ServerListSteam.db / ServerList.db)
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Monitor continuo del estado de ejecución de Project Zomboid
  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      const running = await checkIsGameRunning();
      if (!mounted) return;
      setIsGameRunning(prev => {
        if (prev && !running) {
          // El juego acaba de cerrarse: recargar slots
          loadCharacters();
        }
        return running;
      });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await fetchSavedCharacters();
      setSavedCharacters(chars || []);
    } catch {}
  };

  useEffect(() => {
    loadCharacters();
    const interval = setInterval(loadCharacters, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Sincronización Remota de Wipe del Servidor (worldEpoch) ──
  useEffect(() => {
    let active = true;
    const checkWorldWipe = async () => {
      try {
        const urls = [
          'https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/public/swarm-gateway.json',
          'https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/PZ-LAUNCHER/public/swarm-gateway.json'
        ];
        let remoteEpoch = null;
        for (const u of urls) {
          try {
            const res = await fetch(`${u}?_t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              const data = await res.json();
              if (data && data.worldEpoch) {
                remoteEpoch = String(data.worldEpoch);
                break;
              }
            }
          } catch {}
        }

        if (!remoteEpoch) {
          try {
            const bridgeUrl = getSwarmBridgeUrl();
            const res = await fetch(`${bridgeUrl}/api/swarm/world-info`, { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
              const data = await res.json();
              if (data && data.worldEpoch) remoteEpoch = String(data.worldEpoch);
            }
          } catch {}
        }

        if (!active || !remoteEpoch) return;

        const localEpoch = localStorage.getItem('apocalipto_last_world_epoch');
        if (localEpoch !== remoteEpoch) {
          console.log('[WORLD_WIPE] Sincronizando wipe remoto. Nueva era:', remoteEpoch);

          // 1. Limpiar todos los personajes de las bases de datos locales de SQLite
          try {
            const chars = await fetchSavedCharacters();
            if (chars && chars.length > 0) {
              for (const ch of chars) {
                await removeSavedCharacter(ch.username);
              }
            }
          } catch {}

          // 2. Limpiar tickets y caché local de navegador/Tauri
          try {
            localStorage.removeItem('apocalipto_admission_ticket');
            localStorage.removeItem('apocalipto_chosen_faction');
            localStorage.removeItem('pz_survivor_name');
          } catch {}

          // 3. Registrar la nueva época para no volver a limpiar hasta el próximo wipe
          localStorage.setItem('apocalipto_last_world_epoch', remoteEpoch);

          // 4. Actualizar estado visual
          setSavedCharacters([]);
          setSurvivorName('');
          setChosenFaction(null);
          setApprovedFaction(null);
          setIsCreatingCharacter(false);
          setShowLaunchModal(false);

          handleShowToast({
            title: 'NUEVA ERA: REINICIO DE MUNDO (DÍA 1)',
            desc: 'El Creador ha iniciado un nuevo ciclo de supervivencia. Tus slots locales se han limpiado para una partida fresca.',
            type: 'info'
          });
        }
      } catch {}
    };

    checkWorldWipe();
    const interval = setInterval(checkWorldWipe, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectCharacter = (char) => {
    if (!char) return;
    setSurvivorName(char.username);
    try { localStorage.setItem('pz_survivor_name', char.username); } catch {}
    
    if (char.factionId) {
      const fid = char.factionId.toLowerCase();
      setChosenFaction(fid);
      setApprovedFaction(fid);
      try { localStorage.setItem('apocalipto_chosen_faction', fid); } catch {}
    }
    handleShowToast({
      title: 'SUPERVIVIENTE SELECCIONADO',
      desc: `Listo para jugar como ${char.username} (${char.factionTag || 'APOCALIPTO'}).`,
      type: 'success'
    });
  };

  const handleDeleteCharacter = async (username) => {
    if (!username) return;
    const ok = await removeSavedCharacter(username);
    if (ok) {
      handleShowToast({
        title: 'SUPERVIVIENTE ELIMINADO',
        desc: `"${username}" ha sido eliminado de tu lista y del servidor. 1 slot liberado.`,
        type: 'info'
      });
      if ((survivorName || '').trim().toLowerCase() === username.trim().toLowerCase()) {
        setSurvivorName('');
        setChosenFaction(null);
        setApprovedFaction(null);
        try {
          localStorage.removeItem('pz_survivor_name');
          localStorage.removeItem('apocalipto_chosen_faction');
        } catch {}
      }
      await loadCharacters();
    }
  };

  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);

  const handleStartNewCharacter = () => {
    if (savedCharacters.length >= 4) {
      handleShowToast({
        title: 'LÍMITE ALCANZADO (4/4 SLOTS)',
        desc: 'Tienes el máximo de 4 supervivientes creados. Elimina uno de la lista para crear uno nuevo.',
        type: 'warning'
      });
      return;
    }
    setIsCreatingCharacter(true);
    setChosenFaction(null);
    setApprovedFaction(null);
    setSurvivorName('');
    try {
      localStorage.removeItem('apocalipto_chosen_faction');
      localStorage.removeItem('pz_survivor_name');
    } catch {}
    handleShowToast({
      title: 'MODO CREACIÓN ACTIVADO',
      desc: `Creando superviviente en Slot 0${savedCharacters.length + 1}. Elige tu facción a la izquierda.`,
      type: 'info'
    });
  };

  const handleCancelNewCharacter = () => {
    setIsCreatingCharacter(false);
    if (savedCharacters.length > 0) {
      handleSelectCharacter(savedCharacters[0]);
    } else {
      setChosenFaction(null);
      setApprovedFaction(null);
      setSurvivorName('');
    }
  };


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

  const handleUpdateLauncher = () => {
    setShowUpdateModal(true);
  };

  // Sincronizar conteo de facciones en vivo con el Enjambre (0 si no hay nadie)
  // Sincronizar conteo de facciones en vivo y estado de aprobación del nodo local
  useEffect(() => {
    const fetchStats = async () => {
      let bridgeUrl = getSwarmBridgeUrl();
      try {
        // 1. Conteo público y anónimo de facciones
        let res;
        try {
          res = await fetch(`${bridgeUrl}/api/swarm/stats`, { signal: AbortSignal.timeout(3000) });
        } catch {}

        if (!res || !res.ok) {
          try {
            res = await fetch('http://127.0.0.1:19842/api/swarm/stats', { signal: AbortSignal.timeout(1500) });
            if (res && res.ok) bridgeUrl = 'http://127.0.0.1:19842';
          } catch {}
        }

        if (!res || !res.ok) {
          try {
            res = await fetch('https://johnson-dried-equipment-respect.trycloudflare.com/api/swarm/stats', { signal: AbortSignal.timeout(3000) });
          } catch {}
        }

        if (res && res.ok) {
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
          let statusRes;
          try {
            statusRes = await fetch(`${bridgeUrl}/api/node/status/${localId.nodeId}`, { signal: AbortSignal.timeout(3000) });
          } catch {}

          if (!statusRes || !statusRes.ok) {
            try {
              statusRes = await fetch(`http://127.0.0.1:19842/api/node/status/${localId.nodeId}`, { signal: AbortSignal.timeout(1500) });
            } catch {}
          }

          if (!statusRes || !statusRes.ok) {
            try {
              statusRes = await fetch(`https://johnson-dried-equipment-respect.trycloudflare.com/api/node/status/${localId.nodeId}`, { signal: AbortSignal.timeout(3000) });
            } catch {}
          }

          if (statusRes && statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === 'APPROVED' && statusData.ticket) {
              if (!isCreatingCharacter && !chosenFaction && savedCharacters.length === 0) {
                const fid = (statusData.ticket.payload?.factionId || statusData.ticket.payload?.faction || '').toLowerCase();
                if (fid) {
                  savePermanentTicket(statusData.ticket);
                  setApprovedFaction(fid);
                  setChosenFaction(fid);
                }
                const ticketUser = statusData.ticket.payload?.username;
                if (ticketUser) {
                  setSurvivorName(ticketUser);
                  try {
                    localStorage.setItem('pz_survivor_name', ticketUser);
                  } catch {}
                }
              }
            } else if (statusData.status === 'NOT_FOUND' && approvedFaction && !isCreatingCharacter) {
              // Solo si tenía un ticket de admisión formal que fue revocado por el Creador
              try {
                localStorage.removeItem('apocalipto_admission_ticket');
              } catch {}
              setApprovedFaction(null);
            }
          }
        }
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 2500);
    return () => clearInterval(interval);
  }, [approvedFaction, chosenFaction]);

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

  // Selección de facción con bloqueo estricto de las demás (excepto si está en modo creación de nuevo personaje)
  const handleSelectFaction = async (factionId) => {
    const fid = (factionId || '').toLowerCase();
    if (!isCreatingCharacter) {
      const activeLock = chosenFaction || approvedFaction;
      if (activeLock && activeLock !== fid) {
        handleShowToast({
          title: '🔒 FACCIÓN BLOQUEADA',
          desc: 'Para jugar en otra facción, selecciona otro superviviente de tus slots o crea uno nuevo.',
          type: 'warning'
        });
        return;
      }
    }
    setChosenFaction(fid);
    try {
      localStorage.setItem('apocalipto_chosen_faction', fid);
      const localId = getOrCreateLocalIdentity();
      if (localId?.nodeId) {
        const factObj = factions.find(f => f.id === fid);
        const factionTag = factObj?.tag || fid.toUpperCase();
        await setSwarmNodeFaction(localId.nodeId, factionTag, fid);
      }
    } catch {}
  };

  const handleResetFaction = async () => {
    // Si hay un personaje guardado activo en un slot, eliminarlo del slot y del juego directamente
    const activeChar = savedCharacters.find(c => c.username.toLowerCase() === (survivorName || '').toLowerCase().trim());
    if (activeChar) {
      await handleDeleteCharacter(activeChar.username);
      return;
    }
    try {
      localStorage.removeItem('apocalipto_admission_ticket');
      localStorage.removeItem('apocalipto_chosen_faction');
      localStorage.removeItem('pz_survivor_name');
      const localId = getOrCreateLocalIdentity();
      if (localId?.nodeId) {
        await resetSwarmCharacter(localId.nodeId);
      }
    } catch {}
    setChosenFaction(null);
    setApprovedFaction(null);
    setSurvivorName('');
    setShowLaunchModal(false);
    handleShowToast({
      title: 'SELECCIÓN REINICIADA',
      desc: 'Has reiniciado la selección. Las 4 facciones se han desbloqueado. Elige tu nueva facción.',
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
              localStorage.removeItem('pz_survivor_name');
            } catch {}
            setApprovedFaction(null);
            setChosenFaction(null);
            setSurvivorName('');
            setShowLaunchModal(false);
            setFactions(prev => prev.map(f => ({ ...f, current: 0 })));
          }

          if (e.data?.type === 'NODE_APPROVED') {
            const localId = getOrCreateLocalIdentity();
            if (e.data?.nodeId === localId?.nodeId) {
              const fid = (e.data.factionId || '').toLowerCase();
              if (fid) {
                setApprovedFaction(fid);
                setChosenFaction(fid);
                try {
                  localStorage.setItem('apocalipto_chosen_faction', fid);
                } catch {}
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

  const activeFactionId = (chosenFaction || approvedFaction || '').toLowerCase();
  const selectedFactionData = factions.find((f) => f.id === activeFactionId) || null;
  const onlineCount = factions.reduce((acc, f) => acc + (f.current || 0), 0);

  const handleLaunchGame = async () => {
    if (!selectedFactionData) {
      handleShowToast({
        title: 'ELIGE UNA FACCIÓN',
        desc: 'Debes seleccionar una facción antes de iniciar la partida.',
        type: 'warning'
      });
      return;
    }

    const localId = getOrCreateLocalIdentity();
    const finalPlayerName = (survivorName && survivorName.trim().length > 0)
      ? survivorName.trim()
      : `Superviviente_${selectedFactionData.tag}`;

    const isExisting = savedCharacters.some(c => c.username.toLowerCase() === finalPlayerName.toLowerCase());
    if (!isExisting && savedCharacters.length >= 4) {
      handleShowToast({
        title: 'LÍMITE ALCANZADO (4/4 SLOTS)',
        desc: 'No puedes crear un 5to superviviente. Selecciona uno existente del roster o elimina uno para crear uno nuevo.',
        type: 'warning'
      });
      return;
    }

    // Guardar facción preliminar
    recordCharacterFaction(finalPlayerName, selectedFactionData.id);

    // Abrir obligatoriamente el LaunchModal de verificación criptográfica y autorización con Bento OS
    setShowLaunchModal(true);
  };

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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-6 w-full max-w-[1380px] mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'facciones' && (
            <FactionsTab
              key="facciones"
              factions={factions}
              chosenFaction={chosenFaction}
              selectedFaction={chosenFaction}
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
              savedCharacters={savedCharacters}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onStartNewCharacter={handleStartNewCharacter}
              isCreatingCharacter={isCreatingCharacter}
              onCancelNewCharacter={handleCancelNewCharacter}
              isGameRunning={isGameRunning}
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
          if (fid) {
            const lower = fid.toLowerCase();
            setApprovedFaction(lower);
            setChosenFaction(lower);
            try {
              localStorage.setItem('apocalipto_chosen_faction', lower);
            } catch {}
            const localId = getOrCreateLocalIdentity();
            if (localId?.nodeId) {
              setSwarmNodeFaction(localId.nodeId, fid.toUpperCase(), lower);
            }
          } else {
            setApprovedFaction(null);
            setChosenFaction(null);
          }
        }}
      />
      <Toast       toast={toast}            onClose={() => setToast(null)} />
    </div>
  );
}