import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import './App.css';

// Layout & UI Components
import Header from './components/layout/Header';
import TelemetryBar from './components/layout/TelemetryBar';
import DockNav from './components/layout/DockNav';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';

// Bento Grid & Expanded Views
import BentoGrid from './components/bento/BentoGrid';
import SystemStandbyHero from './components/bento/SystemStandbyHero';
import ExpandedChat from './components/expanded/ExpandedChat';
import ExpandedWhitelist from './components/expanded/ExpandedWhitelist';
import ExpandedFactions from './components/expanded/ExpandedFactions';
import ExpandedRcon from './components/expanded/ExpandedRcon';
import ExpandedBlockchain from './components/expanded/ExpandedBlockchain';
import ExpandedMods from './components/expanded/ExpandedMods';

// Modals
import RulesModal from './components/modals/RulesModal';
import PlayerPreviewModal from './components/modals/PlayerPreviewModal';
import GatewayModal from './components/modals/GatewayModal';
import AdminAccessModal from './components/modals/AdminAccessModal';
import WorldConfigModal from './components/modals/WorldConfigModal';
import FactionMembersModal from './components/modals/FactionMembersModal';

// Static Data
import { 
  INITIAL_MESSAGES, 
  INITIAL_APPLICANTS, 
  INITIAL_FACTIONS, 
  INITIAL_LOGS, 
  INITIAL_PROTOCOLS,
  INITIAL_ROLE_DISCLAIMER
} from './data/adminData';

export default function App() {
  // Estado del Módulo Activo: null = Bento Grid, 'chat' | 'whitelist' | 'factions' | 'rcon' = Enfoque
  const [expandedModule, setExpandedModule] = useState(null);

  // Estados del Sistema & Facciones
  const [factions, setFactions] = useState(INITIAL_FACTIONS);
  const [autoLock, setAutoLock] = useState(true);
  const [globalLock, setGlobalLock] = useState(false);
  const [logs, setLogs] = useState(INITIAL_LOGS);

  // Estados de Whitelist
  const [applicants, setApplicants] = useState(INITIAL_APPLICANTS);
  const [auditedCount, setAuditedCount] = useState(0);

  // Estados de Radio Chat
  const [chatFilter, setChatFilter] = useState('TODOS');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [chatIdentity, setChatIdentity] = useState('ADMIN');
  const [autoScroll, setAutoScroll] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMacroMenu, setShowMacroMenu] = useState(false);
  const [selectedMacroIdx, setSelectedMacroIdx] = useState(0);
  const [purgeStage, setPurgeStage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);

  // Estados de RCON
  const [rconTarget, setRconTarget] = useState('');
  const [rconReason, setRconReason] = useState('Metagaming / Discord Externo');
  const [rconInput, setRconInput] = useState('');
  const [rconTab, setRconTab] = useState('TODOS');
  const [selectedSeverity, setSelectedSeverity] = useState('TEMPBAN (24H)');

  // Estados de Protocolos y Notificaciones
  const [protocols, setProtocols] = useState(() => {
    try {
      const saved = localStorage.getItem('apocalipto_pz_rules');
      return saved ? JSON.parse(saved) : INITIAL_PROTOCOLS;
    } catch {
      return INITIAL_PROTOCOLS;
    }
  });

  const [roleDisclaimer, setRoleDisclaimer] = useState(() => {
    try {
      const saved = localStorage.getItem('apocalipto_pz_role_disclaimer');
      return saved ? JSON.parse(saved) : INITIAL_ROLE_DISCLAIMER;
    } catch {
      return INITIAL_ROLE_DISCLAIMER;
    }
  });

  const [broadcastMessage, setBroadcastMessage] = useState('[AVISO ENJAMBRE]: Frecuencia Knox 91.4 MHz activa. 14 días post-infección.');
  const [systemAlert, setSystemAlert] = useState(null);

  // Modal interactivo de reglas, vista previa y gateway
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showAdminAccessModal, setShowAdminAccessModal] = useState(false);
  const [showWorldConfigModal, setShowWorldConfigModal] = useState(false);
  const [inspectingFactionId, setInspectingFactionId] = useState(null);
  const [approvedNodes, setApprovedNodes] = useState({});

  // Cargar reglas guardadas en el Swarm Bridge al iniciar
  useEffect(() => {
    async function loadServerRules() {
      try {
        const res = await fetch('http://localhost:19842/api/rules');
        if (res.ok) {
          const data = await res.json();
          if (data && data.protocols && Array.isArray(data.protocols) && data.protocols.length > 0) {
            setProtocols(data.protocols);
            if (data.roleDisclaimer) setRoleDisclaimer(data.roleDisclaimer);
            localStorage.setItem('apocalipto_pz_rules', JSON.stringify(data.protocols));
            if (data.roleDisclaimer) localStorage.setItem('apocalipto_pz_role_disclaimer', JSON.stringify(data.roleDisclaimer));
          }
        }
      } catch {}
    }
    loadServerRules();
  }, []);
  const [liveOnlineCount, setLiveOnlineCount] = useState(0);
  const [liveOnlinePlayers, setLiveOnlinePlayers] = useState([]);
  const [worldStatus, setWorldStatus] = useState('CHECKING'); // 'ONLINE' | 'STARTING' | 'OFFLINE' | 'CHECKING'
  const [worldProgress, setWorldProgress] = useState({ percent: 0, phase: 'Verificando...' });
  const [bypassStandby, setBypassStandby] = useState(false);

  // Helper para alertas Toast
  const triggerAlert = (msg) => {
    setSystemAlert(msg);
    setTimeout(() => setSystemAlert(null), 3500);
  };

  // Polling automático del estado del mundo Alfa (Project Zomboid Server)
  useEffect(() => {
    let isMounted = true;
    const checkWorldStatus = async () => {
      try {
        const res = await fetch('http://localhost:19842/api/admin/world/status');
        const data = await res.json();
        if (isMounted && data && data.status) {
          setWorldStatus(data.status);
          if (data.progress) {
            setWorldProgress(data.progress);
          }
        }
      } catch {}
    };

    checkWorldStatus();
    const interval = setInterval(checkWorldStatus, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartWorld = async () => {
    if (worldStatus === 'ONLINE' || worldStatus === 'STARTING') {
      triggerAlert('EL MUNDO YA ESTÁ EN MARCHA O EN PROCESO DE CARGA.');
      return;
    }
    setWorldStatus('STARTING');
    setWorldProgress({ percent: 15, phase: 'Iniciando proceso Java...' });
    triggerAlert('INICIANDO NODO ALFA... CARGANDO MUNDO APOCALIPTO PZ (8GB RAM).');
    try {
      const res = await fetch('http://localhost:19842/api/admin/world/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.alreadyRunning) {
          triggerAlert('✓ EL MUNDO YA ESTÁ EN MARCHA. ENLAZANDO TELEMETRÍA...');
        } else {
          triggerAlert('✓ CONSOLA LEVANTADA. CARGANDO CHUNKS Y MODELOS (30-45s)...');
        }
      }
    } catch (err) {
      triggerAlert(`Error al iniciar mundo: ${err.message}`);
      setWorldStatus('OFFLINE');
    }
  };

  const handleStopWorld = async () => {
    triggerAlert('DETENIENDO Y GUARDANDO MUNDO EN DISCO...');
    try {
      const res = await fetch('http://localhost:19842/api/admin/world/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        triggerAlert('✓ MUNDO GUARDADO Y APAGADO LIMPIAMENTE.');
        setWorldStatus('OFFLINE');
        setWorldProgress({ percent: 0, phase: 'Servidor detenido' });
        setBypassStandby(false);
      }
    } catch (err) {
      triggerAlert(`Error al detener: ${err.message}`);
    }
  };

  // Función para guardar y publicar reglas en tiempo real al Launcher
  const handleSaveAndPublishRules = async (newProtocols, newDisclaimer) => {
    const protosToSave = newProtocols || protocols;
    const disclaimerToSave = newDisclaimer || roleDisclaimer;

    setProtocols(protosToSave);
    setRoleDisclaimer(disclaimerToSave);

    try {
      localStorage.setItem('apocalipto_pz_rules', JSON.stringify(protosToSave));
      localStorage.setItem('apocalipto_pz_role_disclaimer', JSON.stringify(disclaimerToSave));

      // Guardar en el Swarm Bridge del Enjambre (Servidor Central en disco)
      let published = false;
      for (const endpoint of ['http://127.0.0.1:19842/api/admin/rules', 'http://localhost:19842/api/admin/rules']) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              protocols: protosToSave,
              roleDisclaimer: disclaimerToSave
            })
          });
          if (res.ok) {
            published = true;
            console.log('[RULES] Reglas publicadas exitosamente vía', endpoint);
            break;
          }
        } catch (e) {
          console.warn('Notice: Error en endpoint de reglas:', endpoint, e);
        }
      }

      // Transmisión en tiempo real al Launcher
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('apocalipto_pz_rules_channel');
        channel.postMessage({
          type: 'RULES_UPDATED',
          protocols: protosToSave,
          roleDisclaimer: disclaimerToSave,
          timestamp: Date.now()
        });
        channel.close();
      }
    } catch (err) {
      console.error('Error guardando reglas:', err);
    }

    triggerAlert("¡REGLAS GUARDADAS Y PUBLICADAS EN EL LAUNCHER!");
  };

  // Debounce para el buscador
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autoscroll del chat
  useEffect(() => {
    if (autoScroll && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    } else if (!autoScroll) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, autoScroll]);

  const handleScrollDetect = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (isBottom) {
      setAutoScroll(true);
      setUnreadCount(0);
    } else {
      setAutoScroll(false);
    }
  };

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
      setAutoScroll(true);
      setUnreadCount(0);
    }
  };

  // Purgar Buffer con confirmación
  const handlePurge = () => {
    if (purgeStage === 0) {
      setPurgeStage(1);
      triggerAlert("Haz clic de nuevo en 3s para confirmar purga.");
      setTimeout(() => setPurgeStage(0), 3000);
    } else {
      setMessages([]);
      setPurgeStage(0);
      triggerAlert("Buffer purgado.");
    }
  };

  // Cálculos de Cupos de Facciones (TOPE MÁXIMO ESTRICTO: 10 POR FACCIÓN = 40 TOTAL)
  const totalOccupied = factions.reduce((acc, f) => acc + f.current, 0);
  const totalSlots = 40;
  const freeSlots = totalSlots - totalOccupied;

  const updateFactionSlots = (id, delta) => {
    setFactions(factions.map(f => {
      if (f.id === id) {
        // Límite estricto: mínimo 0, máximo 10 cupos
        const newMax = Math.min(10, Math.max(f.current, f.max + delta));
        return { 
          ...f, 
          max: newMax,
          status: f.current >= newMax ? 'SATURADO' : 'OPERATIVO',
          closed: f.current >= newMax ? true : f.closed
        };
      }
      return f;
    }));
  };

  const toggleFactionLock = (id) => {
    setFactions(factions.map(f => {
      if (f.id === id) {
        const next = !f.closed;
        return { 
          ...f, 
          closed: next,
          status: next ? 'SATURADO' : (f.current >= f.max ? 'SATURADO' : 'OPERATIVO')
        };
      }
      return f;
    }));
  };

  const toggleGlobalLock = () => {
    const next = !globalLock;
    setGlobalLock(next);
    setFactions(factions.map(f => ({ ...f, closed: next })));
    triggerAlert(next ? "BLOQUEO GLOBAL: Todos los reclutamientos cerrados." : "BLOQUEO GLOBAL DESACTIVADO.");
  };

  const handleSaveChanges = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: Date.now(),
      time,
      tag: 'SWARM_LEDGER_SYNC',
      text: `Matriz de cupos consolidada en la Save-Chain del Enjambre P2P.`,
      color: 'text-emerald-400'
    };
    setLogs([newLog, ...logs]);
    triggerAlert("CAMBIOS CONSOLIDADOS EN LA CADENA DE BLOQUES.");
  };

  const handleRevert = () => {
    setFactions(INITIAL_FACTIONS);
    triggerAlert("Cambios locales revertidos.");
  };

  const knownApplicantIds = useRef(new Set());

  // Sonido de alerta táctica con Web Audio API (cero dependencias externas)
  const playTacticalChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch {}
  };

  // Cargar aspirantes en tiempo real del Swarm Bridge con notificación sonora y visual
  useEffect(() => {
    async function fetchRealApplicants() {
      // 1. Consultar aspirantes pendientes
      try {
        const res = await fetch('http://localhost:19842/api/admin/applicants');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Detectar nuevas solicitudes para alertar al creador
            const newIncoming = data.filter(node => !knownApplicantIds.current.has(node.nodeId));
            if (newIncoming.length > 0) {
              newIncoming.forEach(node => knownApplicantIds.current.add(node.nodeId));
              playTacticalChime();
              triggerAlert(`🚨 NUEVA SOLICITUD DE INGRESO: ${newIncoming[0].faction} (DPoH Verificado)`);
            }

            const TACTICAL_PREFIXES = ['VANGUARDIA', 'FANTASMA', 'CENTINELA', 'HALCÓN', 'SOMBRA', 'TITÁN', 'ESPECTRO', 'VÍBORA', 'CÓNDOR', 'RAZOR'];
            const TACTICAL_SUFFIXES = ['ALFA', 'BRAVO', 'DELTA', 'ECO', 'KILO', 'OMEGA', 'SIERRA', 'TANGO', 'ZULÚ', 'PHOENIX'];

            const formatted = data.map(node => {
              let hash = 0;
              const nid = node.nodeId || 'node_000';
              for (let i = 0; i < nid.length; i++) {
                hash = (hash << 5) - hash + nid.charCodeAt(i);
                hash |= 0;
              }
              const absHash = Math.abs(hash);
              const p = TACTICAL_PREFIXES[absHash % TACTICAL_PREFIXES.length];
              const s = TACTICAL_SUFFIXES[(absHash >> 3) % TACTICAL_SUFFIXES.length];
              const num = (absHash % 89) + 10;
              const callsign = `OP-${p}-${s}-${num}`;
              const maskedSteam = node.steamId ? `ID-CIVIL: ●●●●●●${String(node.steamId).slice(-4)}` : 'ID-CIVIL: PROTEGIDA';
              const rankName = (node.roleClaimed === 'ALFA' || (node.score && node.score >= 200)) ? 'CLASE ALFA (HOST APTO)' : 'CLASE SOMBRA (RÉPLICA)';

              return {
                id: node.nodeId,
                callsign,
                tag: rankName,
                initials: (node.faction || 'DO').substring(0, 2),
                initialsColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40',
                priority: 'DPoH VERIFICADO',
                priorityColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30',
                steamId: maskedSteam,
                hours: `${node.hardwareMetrics?.threads || 4}c / ${node.hardwareMetrics?.ramTotalGB || 8}GB RAM`,
                timeSent: 'SOLICITUD ENJAMBRE P2P',
                lore: node.lore,
                nodeId: node.nodeId,
                faction: node.faction,
                factionId: node.factionId
              };
            });

            setApplicants(formatted);
          }
        }
      } catch {}

      // 2. Sincronizar conteo en vivo de facciones aprobadas desde el Enjambre
      try {
        const statsRes = await fetch('http://localhost:19842/api/admin/stats');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (stats && stats.counts) {
            setFactions(prevFactions => prevFactions.map(f => {
              const count = stats.counts[f.id] !== undefined ? stats.counts[f.id] : f.current;
              return {
                ...f,
                current: count,
                status: count >= f.max ? 'SATURADO' : 'OPERATIVO',
                closed: count >= f.max ? true : f.closed
              };
            }));
          }
          if (stats && stats.totalApproved !== undefined) {
            setAuditedCount(stats.totalApproved);
          }
          if (stats && stats.onlineCount !== undefined) {
            setLiveOnlineCount(stats.onlineCount);
          }
          if (stats && stats.onlinePlayers) {
            setLiveOnlinePlayers(stats.onlinePlayers);
          }
          if (stats && stats.approvedNodes) {
            setApprovedNodes(stats.approvedNodes);
          }
        }
      } catch {}
    }

    fetchRealApplicants();
    const interval = setInterval(fetchRealApplicants, 2500);
    return () => clearInterval(interval);
  }, []);

  // Acciones de Whitelist con persistencia permanente e interconexión con Balanza Táctica
  const handleWhitelistAction = async (applicant, approved) => {
    setApplicants(applicants.filter(a => a.id !== applicant.id));
    setAuditedCount(prev => prev + 1);

    if (approved) {
      triggerAlert(`Aspirante ${applicant.id} APROBADO PERMANENTEMENTE.`);

      // Actualizar conteo táctico de la facción de inmediato
      const fid = (applicant.factionId || applicant.faction || applicant.initials || 'doe').toLowerCase();
      setFactions(prevFactions => prevFactions.map(f => {
        if (fid.includes(f.id) || f.id.includes(fid)) {
          const newCurrent = Math.min(f.max, f.current + 1);
          return {
            ...f,
            current: newCurrent,
            status: newCurrent >= f.max ? 'SATURADO' : 'OPERATIVO',
            closed: newCurrent >= f.max ? true : f.closed
          };
        }
        return f;
      }));

      try {
        await fetch('http://localhost:19842/api/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: applicant.nodeId || applicant.id,
            assignedRole: 'SOMBRA'
          })
        });

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apocalipto_pz_rules_channel');
          bc.postMessage({
            type: 'NODE_APPROVED',
            nodeId: applicant.nodeId || applicant.id,
            factionId: fid,
            timestamp: Date.now()
          });
          bc.close();
        }
      } catch {}
    } else {
      triggerAlert(`Aspirante ${applicant.id} RECHAZADO.`);
      try {
        await fetch('http://localhost:19842/api/admin/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: applicant.nodeId || applicant.id
          })
        });

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apocalipto_pz_rules_channel');
          bc.postMessage({
            type: 'NODE_REJECTED',
            nodeId: applicant.nodeId || applicant.id,
            timestamp: Date.now()
          });
          bc.close();
        }
      } catch {}
    }
  };

  // Reiniciar Enjambre y Solicitudes a cero (Pruebas del Creador)
  const handleResetSwarm = async () => {
    try {
      await fetch('http://localhost:19842/api/admin/reset', { method: 'POST' });
      setApplicants([]);
      setFactions(prev => prev.map(f => ({ ...f, current: 0, status: 'OPERATIVO', closed: false })));
      knownApplicantIds.current.clear();
      triggerAlert("ENJAMBRE Y SOLICITUDES REINICIADOS A CERO.");
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apocalipto_pz_rules_channel');
        bc.postMessage({ type: 'SWARM_RESET', timestamp: Date.now() });
        bc.close();
      }
    } catch {
      triggerAlert("Error al reiniciar puente.");
    }
  };

  // Expulsar nodo de la facción y revocar Whitelist
  const handleRevokeMember = async (nodeId, factionId) => {
    try {
      const res = await fetch('http://localhost:19842/api/admin/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert(`SUPERVIVIENTE ${nodeId} EXPULSADO Y REVOCADO.`);
        setApprovedNodes(prev => {
          const copy = { ...prev };
          delete copy[nodeId];
          return copy;
        });

        if (factionId) {
          setFactions(prev => prev.map(f => {
            if (f.id === factionId.toLowerCase()) {
              const newCurrent = Math.max(0, f.current - 1);
              return {
                ...f,
                current: newCurrent,
                status: newCurrent >= f.max ? 'SATURADO' : 'OPERATIVO',
                closed: newCurrent >= f.max ? true : false
              };
            }
            return f;
          }));
        }

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apocalipto_pz_rules_channel');
          bc.postMessage({
            type: 'NODE_REVOKED',
            nodeId,
            factionId,
            timestamp: Date.now()
          });
          bc.close();
        }
      } else {
        triggerAlert(`Error al expulsar: ${data.error || 'Desconocido'}`);
      }
    } catch (err) {
      triggerAlert(`Error de conexión al expulsar nodo: ${err.message}`);
    }
  };

  // Helper para generar callsign determinista para miembros
  const getCallsignForNode = (nodeId) => {
    const nid = nodeId || 'node_000';
    let hash = 0;
    for (let i = 0; i < nid.length; i++) {
      hash = (hash << 5) - hash + nid.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const prefixes = ['VANGUARDIA', 'FANTASMA', 'CENTINELA', 'HALCÓN', 'SOMBRA', 'TITÁN', 'ESPECTRO', 'VÍBORA', 'CÓNDOR', 'RAZOR'];
    const suffixes = ['ALFA', 'BRAVO', 'DELTA', 'ECO', 'KILO', 'OMEGA', 'SIERRA', 'TANGO', 'ZULÚ', 'PHOENIX'];
    const p = prefixes[absHash % prefixes.length];
    const s = suffixes[(absHash >> 3) % suffixes.length];
    const num = (absHash % 89) + 10;
    return `OP-${p}-${s}-${num}`;
  };

  const inspectedFaction = factions.find(f => f.id === inspectingFactionId);
  const inspectedFactionMembers = Object.values(approvedNodes)
    .filter(item => {
      const p = item.payload || item;
      const fid = (p.factionId || p.faction || '').toLowerCase();
      const target = (inspectingFactionId || '').toLowerCase();
      if (!target) return false;
      if (target === 'mok') return fid.includes('mok') || fid.includes('kin') || fid.includes('merod');
      if (target === 'kto') return fid.includes('kto') || fid.includes('testam') || fid.includes('knox');
      if (target === 'riv') return fid.includes('riv') || fid.includes('centin') || fid.includes('resistencia') || fid.includes('indie') || fid.includes('vecinal');
      if (target === 'doe') return fid.includes('doe') || fid.includes('emerg') || fid.includes('milit') || fid.includes('division') || fid.includes('operaciones') || fid.includes('especiales');
      return fid.includes(target) || target.includes(fid);
    })
    .map(item => {
      const p = item.payload || item;
      return {
        nodeId: p.nodeId,
        steamId: p.steamId,
        username: p.username || '',
        faction: p.faction,
        factionId: p.factionId,
        assignedRole: p.assignedRole,
        approvedAt: p.approvedAt,
        callsign: getCallsignForNode(p.nodeId)
      };
    });

  // Envío de mensaje en Radio Chat
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const authorTag = chatIdentity === 'ADMIN' 
      ? 'MANDO CENTRAL [ADMIN]' 
      : chatIdentity === 'SISTEMA' 
      ? 'SISTEMA MILITAR' 
      : 'MODERADOR KNX';

    const newMsg = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'RADIO 91.4',
      author: authorTag,
      text: chatInput,
      type: chatIdentity === 'SISTEMA' ? 'system' : 'radio'
    };
    setMessages([...messages, newMsg]);
    setChatInput('');
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-500/30 text-amber-300 font-bold px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0c0e] text-zinc-200 flex flex-col justify-between font-mono text-xs select-none overflow-x-hidden p-2 sm:p-3.5 gap-2.5 sm:gap-3 relative max-w-full">
      
      {/* ── CAPAS DE AMBIENTACIÓN HUD TÁCTICA ── */}
      <div className="fixed inset-0 tactical-grid pointer-events-none" />
      <div className="fixed inset-0 hud-scanlines pointer-events-none opacity-25" />
      <div className="fixed inset-0 crt-vignette pointer-events-none" />

      {/* ── 1. HEADER CENTRAL CON CONTROL DEL MUNDO, 'CALIBRAR', 'EDITAR REGLAS' & 'MANDO ADMIN' ── */}
      <Header 
        onOpenRules={() => setShowRulesModal(true)} 
        onOpenGateway={() => setShowGatewayModal(true)}
        onOpenAdminAccess={() => setShowAdminAccessModal(true)}
        onOpenWorldConfig={() => setShowWorldConfigModal(true)}
        onOpenMods={() => setExpandedModule('mods')}
        onTriggerAlert={triggerAlert} 
        totalOccupied={totalOccupied}
        liveOnlineCount={liveOnlineCount}
        liveOnlinePlayers={liveOnlinePlayers}
        worldStatus={worldStatus}
        worldProgress={worldProgress}
        onStartWorld={handleStartWorld}
        onStopWorld={handleStopWorld}
      />

      {/* ── 2. TELEMETRÍA DEL ENJAMBRE P2P / NODO ALFA ── */}
      <TelemetryBar 
        onOpenBlockchain={() => setExpandedModule('blockchain')} 
        totalOccupied={totalOccupied}
        liveOnlineCount={liveOnlineCount}
      />

      {/* ── 3. VISTAS PRINCIPALES (BENTO O ENFOQUE EXPANDIDO DE LOS 4 MÓDULOS) ── */}
      <main className="relative z-10 flex-1 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {expandedModule === null && ((worldStatus === 'OFFLINE' || worldStatus === 'STARTING') && !bypassStandby ? (
            <SystemStandbyHero
              key="standby-hero"
              worldStatus={worldStatus}
              worldProgress={worldProgress}
              onStartWorld={handleStartWorld}
              onOpenWorldConfig={() => setShowWorldConfigModal(true)}
              onOpenRules={() => setShowRulesModal(true)}
              onOpenMods={() => setExpandedModule('mods')}
              onBypassToDashboard={() => setBypassStandby(true)}
            />
          ) : (
            <BentoGrid
              key="bento"
              messages={messages}
              chatFilter={chatFilter}
              setChatFilter={setChatFilter}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendMessage={handleSendMessage}
              applicants={applicants}
              auditedCount={auditedCount}
              handleWhitelistAction={handleWhitelistAction}
              handleResetSwarm={handleResetSwarm}
              factions={factions}
              updateFactionSlots={updateFactionSlots}
              toggleFactionLock={toggleFactionLock}
              rconTarget={rconTarget}
              setRconTarget={setRconTarget}
              rconReason={rconReason}
              setRconReason={setRconReason}
              broadcastMessage={broadcastMessage}
              setBroadcastMessage={setBroadcastMessage}
              setExpandedModule={setExpandedModule}
              onTriggerAlert={triggerAlert}
              onOpenFactionMembers={(fid) => setInspectingFactionId(fid)}
            />
          ))}

          {expandedModule === 'chat' && (
            <ExpandedChat
              key="expanded-chat"
              messages={messages}
              chatFilter={chatFilter}
              setChatFilter={setChatFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              debouncedSearch={debouncedSearch}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatIdentity={chatIdentity}
              setChatIdentity={setChatIdentity}
              handleSendMessage={handleSendMessage}
              autoScroll={autoScroll}
              unreadCount={unreadCount}
              scrollToBottom={scrollToBottom}
              handleScrollDetect={handleScrollDetect}
              chatScrollRef={chatScrollRef}
              inputRef={inputRef}
              showMacroMenu={showMacroMenu}
              setShowMacroMenu={setShowMacroMenu}
              selectedMacroIdx={selectedMacroIdx}
              setSelectedMacroIdx={setSelectedMacroIdx}
              purgeStage={purgeStage}
              handlePurge={handlePurge}
              setExpandedModule={setExpandedModule}
              highlightText={highlightText}
            />
          )}

          {expandedModule === 'whitelist' && (
            <ExpandedWhitelist
              key="expanded-whitelist"
              applicants={applicants}
              handleWhitelistAction={handleWhitelistAction}
              setExpandedModule={setExpandedModule}
              onTriggerAlert={triggerAlert}
            />
          )}

          {expandedModule === 'factions' && (
            <ExpandedFactions
              key="expanded-factions"
              factions={factions}
              totalOccupied={totalOccupied}
              totalSlots={totalSlots}
              freeSlots={freeSlots}
              autoLock={autoLock}
              setAutoLock={setAutoLock}
              globalLock={globalLock}
              toggleGlobalLock={toggleGlobalLock}
              updateFactionSlots={updateFactionSlots}
              toggleFactionLock={toggleFactionLock}
              logs={logs}
              handleSaveChanges={handleSaveChanges}
              handleRevert={handleRevert}
              setExpandedModule={setExpandedModule}
              onTriggerAlert={triggerAlert}
              onOpenFactionMembers={(fid) => setInspectingFactionId(fid)}
            />
          )}

          {expandedModule === 'rcon' && (
            <ExpandedRcon
              key="expanded-rcon"
              rconInput={rconInput}
              setRconInput={setRconInput}
              rconTab={rconTab}
              setRconTab={setRconTab}
              rconReason={rconReason}
              setRconReason={setRconReason}
              selectedSeverity={selectedSeverity}
              setSelectedSeverity={setSelectedSeverity}
              setExpandedModule={setExpandedModule}
              onTriggerAlert={triggerAlert}
            />
          )}

          {expandedModule === 'blockchain' && (
            <ExpandedBlockchain
              key="expanded-blockchain"
              onBack={() => setExpandedModule(null)}
            />
          )}

          {expandedModule === 'mods' && (
            <ExpandedMods
              key="expanded-mods"
              onBack={() => setExpandedModule(null)}
              onTriggerAlert={triggerAlert}
            />
          )}
        </AnimatePresence>
      </main>

      {/* ── 4. DOCK / BARRA INFERIOR DE PÍLDORAS EN MODO ENFOQUE (4 MÓDULOS) ── */}
      <DockNav
        expandedModule={expandedModule}
        setExpandedModule={setExpandedModule}
        applicantsCount={applicants.length}
        totalOccupied={totalOccupied}
      />

      {/* ── 5. FOOTER CON ESTADO ORACLE DB ── */}
      <Footer />

      {/* ── MODAL INTERACTIVO DE EDICIÓN DE REGLAS (SINCRONIZADO CON LAUNCHER) ── */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        protocols={protocols}
        setProtocols={setProtocols}
        roleDisclaimer={roleDisclaimer}
        setRoleDisclaimer={setRoleDisclaimer}
        onSaveAndPublish={handleSaveAndPublishRules}
      />

      {/* ── MODAL VISTA PREVIA JUGADOR & TOAST NOTIFICATIONS ── */}
      <PlayerPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        protocols={protocols}
      />

      {/* ── MODAL DE ENLACE EXTERNO & INVITE DE JUGADORES ── */}
      <GatewayModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        onTriggerAlert={triggerAlert}
      />

      {/* ── MODAL DE ACCESO MAESTRO CREADOR / ROOT ADMIN ── */}
      <AdminAccessModal
        isOpen={showAdminAccessModal}
        onClose={() => setShowAdminAccessModal(false)}
        onTriggerAlert={triggerAlert}
        worldStatus={worldStatus}
        worldProgress={worldProgress}
      />

      {/* ── MODAL DE CALIBRACIÓN Y CONTROL DEL MUNDO ALFA (SANDBOX) ── */}
      <WorldConfigModal
        isOpen={showWorldConfigModal}
        onClose={() => setShowWorldConfigModal(false)}
        onTriggerAlert={triggerAlert}
        worldStatus={worldStatus}
        worldProgress={worldProgress}
        onStartWorld={handleStartWorld}
        onStopWorld={handleStopWorld}
      />

      {/* ── MODAL DE MIEMBROS DE FACCIÓN Y GESTIÓN DE WHITELIST ── */}
      <FactionMembersModal
        isOpen={Boolean(inspectingFactionId)}
        onClose={() => setInspectingFactionId(null)}
        faction={inspectedFaction}
        members={inspectedFactionMembers}
        onRevokeMember={handleRevokeMember}
      />

      <Toast message={systemAlert} />

    </div>
  );
}