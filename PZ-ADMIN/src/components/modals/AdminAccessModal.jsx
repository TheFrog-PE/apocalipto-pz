import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Crown, Play, X, Zap, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';

export default function AdminAccessModal({ isOpen, onClose, onTriggerAlert, worldStatus = 'ONLINE', worldProgress = { percent: 100, phase: 'Listo' } }) {
  const [adminUsername, setAdminUsername] = useState(() => {
    return localStorage.getItem('apocalipto_creator_username') || 'The Frog';
  });
  const [rconOutput, setRconOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleExecuteCmd = async (commandStr, label) => {
    setIsExecuting(true);
    setRconOutput(`Enviando comando RCON: ${commandStr}...`);
    try {
      const res = await fetch('http://localhost:19842/api/admin/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandStr })
      });
      const data = await res.json();
      if (data.success) {
        setRconOutput(`✓ Éxito: ${data.response || 'Comando aplicado en el servidor.'}`);
        if (onTriggerAlert) onTriggerAlert(`${label}: APLICADO CON ÉXITO.`);
      } else {
        setRconOutput(`⚠️ Servidor: ${data.response || 'El servidor PZ aún no está conectado a RCON en 27015.'}`);
        if (onTriggerAlert) onTriggerAlert(`${label}: Servidor en espera.`);
      }
    } catch (err) {
      setRconOutput(`Error de enlace: ${err.message}`);
    }
    setIsExecuting(false);
  };

  const handleGrantAdmin = () => {
    const user = adminUsername.trim();
    if (!user) return;
    localStorage.setItem('apocalipto_creator_username', user);
    handleExecuteCmd(`setaccesslevel "${user}" "admin"`, 'RANGO ADMIN');
  };

  const handleGodmode = () => {
    const user = adminUsername.trim();
    if (!user) return;
    handleExecuteCmd(`godmode "${user}" -true`, 'MODO DIOS');
  };

  const handleLaunchGameAsAdmin = async () => {
    if (worldStatus === 'OFFLINE') {
      if (onTriggerAlert) onTriggerAlert('⚠️ EL MUNDO ESTÁ APAGADO. Haz clic en [ ARRANCAR MUNDO ] primero.');
      return;
    }
    if (worldStatus === 'STARTING') {
      if (onTriggerAlert) onTriggerAlert(`⏳ EL MUNDO ESTÁ INICIANDO (${worldProgress?.percent || 15}% - ${worldProgress?.phase || 'Cargando'}). Espera unos segundos a que esté ONLINE.`);
      return;
    }

    const user = adminUsername.trim() || 'The Frog';
    try {
      const res = await fetch('http://localhost:19842/api/game/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: 'admin_root_host',
          username: user,
          password: '12345',
          faction: 'STAFF',
          targetHost: '127.0.0.1',
          targetPort: 16261
        })
      });
      const data = await res.json();
      if (data.alreadyRunning) {
        if (onTriggerAlert) onTriggerAlert(`✓ PZ YA ESTÁ ABIERTO. TICKET INYECTADO PARA ${user}.`);
      } else {
        if (onTriggerAlert) onTriggerAlert(`✓ LANZANDO PROJECT ZOMBOID PARA ${user} (AUTO-JOIN 127.0.0.1:16261)...`);
      }
    } catch (e) {
      if (onTriggerAlert) onTriggerAlert(`Error al conectar con daemon: ${e.message}`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#14161a] border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)] rounded-2xl p-6 text-zinc-100"
        >
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2">
                ACCESO MAESTRO // CREADOR & ROOT ADMIN
              </h2>
              <p className="text-[11px] text-zinc-400 font-light">
                Herramientas directas de administración in-game para tu cuenta de Project Zomboid.
              </p>
            </div>
          </div>

          {/* Campo de Nombre de Usuario */}
          <div className="mb-5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">
              TU NOMBRE DE USUARIO EN PROJECT ZOMBOID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Ej. The Frog"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                onClick={handleGrantAdmin}
                disabled={isExecuting}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>DARME ADMIN</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">
              * Ejecuta <code className="text-amber-400">/setaccesslevel "{adminUsername}" "admin"</code> directamente en la consola del servidor PZ vía RCON.
            </p>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={handleLaunchGameAsAdmin}
              disabled={worldStatus === 'STARTING'}
              className={`p-3 border rounded-xl text-left transition-all group shadow-md ${
                worldStatus === 'ONLINE'
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/60 cursor-pointer'
                  : worldStatus === 'STARTING'
                  ? 'bg-amber-950/30 border-amber-500/50 cursor-wait'
                  : 'bg-zinc-900/60 border-zinc-700/60 hover:border-amber-500/40 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Play className={`w-4 h-4 fill-current ${worldStatus === 'ONLINE' ? 'text-emerald-400 group-hover:scale-110' : 'text-zinc-400'} transition-transform`} />
                  <span className={worldStatus === 'ONLINE' ? 'text-emerald-300' : 'text-zinc-200'}>
                    LANZAR PZ CREADOR
                  </span>
                </div>
                {worldStatus === 'ONLINE' && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-black">
                    ONLINE
                  </span>
                )}
                {worldStatus === 'STARTING' && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    {worldProgress?.percent || 15}%
                  </span>
                )}
                {worldStatus === 'OFFLINE' && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded font-black">
                    OFFLINE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">
                {worldStatus === 'STARTING'
                  ? `El servidor está cargando el mundo (${worldProgress?.percent || 15}% - ${worldProgress?.phase || 'Iniciando'}). Espera.`
                  : worldStatus === 'OFFLINE'
                  ? 'El servidor está apagado. Pulsa ARRANCAR MUNDO antes de ingresar.'
                  : 'Abre Project Zomboid y entra directo a la Creación de Personaje en tu mundo local.'}
              </p>
            </button>

            <button
              onClick={handleGodmode}
              disabled={isExecuting}
              className="p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 rounded-xl text-left transition-all group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>ACTIVAR MODO DIOS</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Inmune a mordeduras, rasguños, hambre, sed y fracturas para inspección.
              </p>
            </button>
          </div>

          {/* Consola RCON Feedback */}
          {rconOutput && (
            <div className="p-3 bg-black/90 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 font-mono flex items-start gap-2">
              <Terminal className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="break-all">{rconOutput}</div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
            <span>PUERTO RCON: 27015 • ACCESO LOCAL EXCLUSIVO</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              CERRAR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
