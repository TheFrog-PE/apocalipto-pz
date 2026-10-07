import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, XCircle, CheckCircle2, Lock, ShieldAlert, Server, Play, AlertTriangle, User } from 'lucide-react';
import { verifyOrRegisterSwarmAccess, pollApprovalStatus, resetLocalSwarmIdentity, resetSwarmCharacter, launchProjectZomboid, getOrCreateLocalIdentity, checkModSync } from '../../services/swarmClient';

export default function LaunchModal({ isOpen, onClose, selectedFactionData, onApproved, survivorName, onSurvivorNameChange }) {
  const [step, setStep] = useState(0);
  const [accessState, setAccessState] = useState(null); // { status: 'APPROVED' | 'PENDING' | 'REJECTED', isPermanent: bool }
  const [nodeId, setNodeId] = useState('');
  const [score, setScore] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState(null);

  const steps = [
    'Verificando identidad criptográfica Ed25519...',
    'Ejecutando Proof of Hardware (DPoH 250ms ultra-seguro)...',
    'Comprobando Ticket Permanente de Whitelist...',
    accessState?.status === 'APPROVED'
      ? (accessState.isPermanent 
          ? '✓ Ticket Permanente Verificado • Enlace P2P Listo' 
          : '✓ Aprobación Confirmada por el Creador • Enlace P2P Listo')
      : accessState?.status === 'REJECTED'
      ? '✕ Solicitud Denegada por el Creador'
      : 'Esperando Aprobación Única del Creador en Bento OS...'
  ];

  // Escuchar reinicio del enjambre desde el Dashboard Bento OS
  useEffect(() => {
    let bc;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('apocalipto_pz_rules_channel');
        bc.onmessage = (e) => {
          if (e.data?.type === 'SWARM_RESET') {
            resetLocalSwarmIdentity();
            setStep(0);
            setAccessState(null);
            if (onClose) onClose();
          }
          if (e.data?.type === 'NODE_APPROVED') {
            const localId = getOrCreateLocalIdentity();
            if (e.data?.nodeId === localId?.nodeId) {
              setAccessState({ status: 'APPROVED', isPermanent: true });
              setStep(3);
              const fid = (e.data.factionId || '').toLowerCase();
              if (onApproved && fid) onApproved(fid);
            }
          }
          if (e.data?.type === 'NODE_REJECTED') {
            const localId = getOrCreateLocalIdentity();
            if (e.data?.nodeId === localId?.nodeId) {
              setAccessState({ status: 'REJECTED' });
              setStep(3);
            }
          }
        };
      }
    } catch {}
    return () => {
      if (bc) bc.close();
    };
  }, [onClose]);

  const factionRef = React.useRef(selectedFactionData);
  useEffect(() => {
    if (selectedFactionData) {
      factionRef.current = selectedFactionData;
    }
  }, [selectedFactionData]);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setAccessState(null);
      setIsLaunching(false);
      setLaunchMessage(null);
      return;
    }

    let isMounted = true;
    let pollInterval = null;

    async function runCheck() {
      // Paso 0: Identidad
      setStep(0);
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      // Paso 1: Proof of Hardware
      setStep(1);
      const currentFaction = factionRef.current || selectedFactionData;
      const faction = currentFaction?.tag || currentFaction?.name || 'DOE';
      const factionId = currentFaction?.id || 'doe';
      const result = await verifyOrRegisterSwarmAccess(faction, '', factionId);
      if (!isMounted) return;

      setAccessState(result);
      if (result.status === 'APPROVED' && onApproved) {
        onApproved(factionId);
      }
      if (result.identity?.nodeId) setNodeId(result.identity.nodeId);
      if (result.score) setScore(result.score);

      // Paso 2: Whitelist check
      await new Promise(r => setTimeout(r, 500));
      if (!isMounted) return;
      setStep(2);

      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;
      setStep(3);

      // Si está pendiente, hacer polling silencioso esperando la aprobación o rechazo del creador
      if (result.status === 'PENDING') {
        const checkId = result.identity?.nodeId;
        if (checkId) {
          pollInterval = setInterval(async () => {
            const updated = await pollApprovalStatus(checkId);
            if ((updated.status === 'APPROVED' || updated.status === 'REJECTED') && isMounted) {
              setAccessState(updated);
              if (updated.status === 'APPROVED' && onApproved) {
                onApproved(factionId);
              }
              clearInterval(pollInterval);
            }
          }, 2000);
        }
      }
    }

    runCheck();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, refreshKey]);

  if (!isOpen) return null;

  const isReadyToPlay = step === 3 && accessState?.status === 'APPROVED';
  const isRejected = step === 3 && accessState?.status === 'REJECTED';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#141414]/95 border border-zinc-800 shadow-2xl rounded-2xl p-6 font-mono"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
            <div className="flex items-center gap-2.5 text-amber-500">
              <img 
                src="/isotipo.png" 
                alt="Apocalipto PZ" 
                className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.7)] select-none" 
              />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                [ PROTOCOLO DE CONEXIÓN AL ENJAMBRE ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 transition-colors rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Faction Banner con bordes redondeados */}
          {selectedFactionData && (
            <div className="mb-5 p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">FACCIÓN ASIGNADA</span>
                <span className="text-xs font-bold text-zinc-100 uppercase">{selectedFactionData.name}</span>
              </div>
              <span className={`px-3 py-0.5 text-xs font-bold border rounded-full ${selectedFactionData.accentColor}`}>
                {selectedFactionData.tag}
              </span>
            </div>
          )}

          {/* Progress sequence */}
          <div className="space-y-3 mb-5 bg-[#181818] p-4 border border-zinc-800/80 rounded-xl text-xs">
            {steps.map((text, idx) => {
              const isCompleted = step > idx || (idx === 3 && isReadyToPlay);
              const isCurrent = step === idx && !isCompleted && !isRejected;

              return (
                <div key={idx} className="flex items-center gap-3">
                  {idx === 3 && isRejected ? (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                  )}
                  <span
                    className={`${
                      idx === 3 && isRejected
                        ? 'text-red-400 font-bold'
                        : isCompleted
                        ? 'text-zinc-300'
                        : isCurrent
                        ? 'text-amber-400 font-bold'
                        : 'text-zinc-600'
                    }`}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mensaje de espera si no ha sido aprobado por el creador */}
          {step === 3 && accessState?.status === 'PENDING' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-amber-950/20 border border-amber-500/50 rounded-xl text-[11px] text-amber-300"
            >
              <div className="flex items-center gap-2 mb-1 font-bold">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>SOLICITUD ENVIADA AL CENTRO DE MANDO</span>
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Tu solicitud con NodeID <span className="text-zinc-200 font-mono">{nodeId || 'Ed25519'}</span> está en revisión. En cuanto el Creador te apruebe en su Bento OS, tu Launcher se desbloqueará <span className="text-amber-400 font-bold">para siempre</span> sin que tengas que volver a pedir permiso.
              </p>
            </motion.div>
          )}

          {/* Mensaje de rechazo */}
          {isRejected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-950/40 border border-red-500/50 rounded-xl text-[11px] text-red-300"
            >
              <div className="flex items-center gap-2 mb-1 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>SOLICITUD DENEGADA POR EL CREADOR</span>
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                El Centro de Mando ha denegado la solicitud de admisión de este nodo.
              </p>
            </motion.div>
          )}

          {/* Server details si ya está aprobado */}
          {isReadyToPlay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-emerald-950/30 border border-emerald-500/50 rounded-xl text-[11px] text-emerald-300 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1 font-bold">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>ENLACE P2P SEGURO: 127.0.0.1:16261 (LOCAL LOOPBACK)</span>
              </div>
              <div className="text-zinc-400 text-[10px]">
                Save-Chain: BLOQUE #1 SYNC • Criptografía: ED25519 • Permiso Permanente: ACTIVO
              </div>
            </motion.div>
          )}

          {/* Mensaje de Lanzamiento / Estado del Proxy */}
          {launchMessage && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-cyan-950/40 border border-cyan-500/50 rounded-xl text-[11px] text-cyan-300 font-mono flex items-center gap-2.5 shadow-md"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span>{launchMessage}</span>
            </motion.div>
          )}

          {/* Input de Nombre de Superviviente en Modal */}
          {isReadyToPlay && !isLaunching && (
            <div className="mb-4 p-3 bg-zinc-900/90 border border-zinc-700/70 rounded-xl flex items-center gap-3">
              <User className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold">Alias del Superviviente:</span>
                <input
                  type="text"
                  value={survivorName || ''}
                  onChange={(e) => onSurvivorNameChange && onSurvivorNameChange(e.target.value.replace(/[^a-zA-Z0-9_\-\s]/g, '').slice(0, 20))}
                  placeholder={`Superviviente_${selectedFactionData?.tag || 'MOK'}`}
                  className="w-full bg-transparent text-xs font-mono font-bold text-amber-400 outline-none placeholder:text-zinc-600 mt-0.5"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {/* Badge de Optimización Gráfica para PC */}
          <div className="mb-3.5 px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[10px] text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400 font-mono">RENDIMIENTO ULTRA OPTIMIZADO:</span>
              <span className="text-zinc-400">Items 2D • Sangre OFF • Niebla ligera</span>
            </div>
            <span className="text-[9px] text-zinc-500 italic hidden sm:inline">Modificable en Opciones de PZ</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!isReadyToPlay || isLaunching) return;
                const localId = getOrCreateLocalIdentity();
                const activeNodeId = nodeId || accessState?.identity?.nodeId || localId?.nodeId || 'node_creator';
                
                // ── VERIFICACIÓN DE INTEGRIDAD DE MODS ──────────────────────────────
                // Consulta al Nodo Alfa si hay desajuste de mods o señal de re-sync post-failover.
                // Si detecta un problema, bloquea el lanzamiento y avisa al jugador.
                setIsLaunching(true);
                setLaunchMessage('Verificando integridad de mods con el Nodo Alfa...');
                const modCheck = await checkModSync();
                if (!modCheck.ok) {
                  setIsLaunching(false);
                  setLaunchMessage(modCheck.message);
                  return;
                }
                // ────────────────────────────────────────────────────────────────────

                const finalPlayerName = (survivorName && survivorName.trim().length > 0)
                  ? survivorName.trim()
                  : (selectedFactionData?.tag ? `Superviviente_${selectedFactionData.tag}` : 'Superviviente');

                const res = await launchProjectZomboid(activeNodeId, selectedFactionData?.tag, finalPlayerName);
                if (res.success) {
                  setLaunchMessage(`✓ Conectando como ${finalPlayerName}... Revisa la barra de tareas.`);
                  setTimeout(() => {
                    setIsLaunching(false);
                    onClose();
                  }, 4000);
                } else {
                  setLaunchMessage(`Aviso: ${res.error || 'No se pudo iniciar automáticamente'}`);
                  setIsLaunching(false);
                }
              }}
              disabled={!isReadyToPlay || isLaunching}
              className={`flex-1 py-3.5 px-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-xl ${
                isReadyToPlay && !isLaunching
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isLaunching
                  ? 'INICIANDO JUEGO & PROXY...'
                  : isReadyToPlay
                  ? 'EJECUTAR JUEGO (BUILD 42)'
                  : isRejected
                  ? 'ACCESO DENEGADO'
                  : accessState?.status === 'PENDING'
                  ? 'ESPERANDO APROBACIÓN...'
                  : 'VERIFICANDO ENJAMBRE...'}
              </span>
            </button>
            <button
              onClick={onClose}
              disabled={isLaunching}
              className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              CERRAR
            </button>
          </div>

          {/* Botón de Reset de Prueba */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
            <span>GESTIÓN DE PERSONAJE</span>
            <button
              onClick={async () => {
                const localId = getOrCreateLocalIdentity();
                if (localId?.nodeId) {
                  await resetSwarmCharacter(localId.nodeId);
                }
                setStep(0);
                setAccessState(null);
                setRefreshKey(k => k + 1);
                if (onApproved) onApproved(null);
                if (onClose) onClose();
              }}
              className="text-amber-500 hover:text-amber-400 font-bold hover:underline cursor-pointer"
            >
              [ ↻ REINICIAR PERSONAJE ]
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
