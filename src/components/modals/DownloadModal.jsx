import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, ShieldCheck, Cpu, Server, CheckCircle2, X, Terminal, Copy, Check, Monitor } from 'lucide-react';
import { fetchGatewayInfo, fetchLiveSwarmStats, getBridgeApiUrl } from '../../services/swarmTelemetry';

export default function DownloadModal({ isOpen, onClose, onCursorEnter, onCursorLeave }) {
  const [gatewayData, setGatewayData] = useState(null);
  const [swarmStats, setSwarmStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGatewayInfo().then(setGatewayData);
      fetchLiveSwarmStats().then(setSwarmStats);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';

  // Si el usuario está en su máquina local, puede abrir directamente localhost:5176
  const launchUrl = isLocal 
    ? 'http://localhost:5176' 
    : (gatewayData?.inviteUrl || `http://${currentHost}:5176/?gateway=http://${currentHost}:19842`);

  // Enlace para compartir con jugadores en la red
  const inviteUrl = gatewayData?.inviteUrl || `http://${gatewayData?.localLanIp || currentHost}:5176/?gateway=http://${gatewayData?.localLanIp || currentHost}:19842`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLauncher = () => {
    window.open(launchUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 font-mono text-xs text-zinc-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0b0d13] border border-zinc-700/80 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800 bg-[#11131a] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e6fb04] animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-white font-syne text-sm">
                ACCESO &amp; DESCARGA // LAUNCHER DE ESCRITORIO P2P
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Swarm Status Banner */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">ESTADO DEL ENJAMBRE P2P</span>
                <span className="text-white font-bold flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  RED DISTRIBUIDA ACTIVA // {swarmStats?.onlineNodes || 1} NODO EN VIVO
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-300 bg-black/60 px-3 py-1.5 rounded-xl border border-zinc-700/50">
                <span className="text-[#e6fb04]">50 SLOTS</span>
                <span className="text-zinc-600">|</span>
                <span className="text-emerald-400">0$ COSTO</span>
              </div>
            </div>

            {/* Opciones de Acceso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción 1: Abrir Launcher (Entorno Runtime de Escritorio) */}
              <div className="bg-[#12151e] border border-zinc-800 hover:border-[#e6fb04]/70 rounded-2xl p-5 flex flex-col justify-between transition-all group">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#e6fb04]/10 text-[#e6fb04] flex items-center justify-center mb-3">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm font-syne uppercase">1. INICIAR LAUNCHER</h4>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    Ejecuta la interfaz del Launcher en el entorno local con autoconfiguración del Enjambre P2P.
                  </p>
                </div>
                <button
                  onClick={handleOpenLauncher}
                  className="mt-4 w-full py-3 bg-[#e6fb04] hover:bg-white text-black font-extrabold uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(230,251,4,0.3)] flex items-center justify-center gap-2 cursor-pointer font-syne text-[11px]"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                  <span>EJECUTAR LAUNCHER</span>
                </button>
              </div>

              {/* Opción 2: Descargar Instalador Oficial Windows (.EXE) */}
              <div className="bg-[#12151e] border border-zinc-800 hover:border-emerald-500/70 rounded-2xl p-5 flex flex-col justify-between transition-all group">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm font-syne uppercase">2. APP DE ESCRITORIO</h4>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">.EXE NATIVO</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    Instalador oficial para Windows 10/11. Aplicación nativa de escritorio con motor de Enjambre P2P y aceleración de red.
                  </p>
                </div>
                <a
                  href="/downloads/ApocaliptoPZ-Setup.exe"
                  download="ApocaliptoPZ-Setup.exe"
                  className="mt-4 w-full py-3 bg-zinc-800 hover:bg-emerald-500 text-zinc-200 hover:text-black font-extrabold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-syne text-[11px]"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>DESCARGAR .EXE (WINDOWS)</span>
                </a>
              </div>
            </div>

            {/* Enlace Directo Copiable */}
            <div className="bg-black/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#e6fb04]" />
                  ENLACE DE INVITACIÓN AL NODO (COMPARTIR CON OTROS JUGADORES)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">1-CLIC AUTO-CONFIG</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-[#090b10] border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-300 font-mono focus:outline-none select-all"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] font-bold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COPIADO</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>COPIAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Garantías Criptográficas y de Seguridad */}
            <div className="border-t border-zinc-800/80 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <Cpu className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>DPoH 250ms (Cero sobrecalentamiento)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Firma Ed25519 &amp; HWID Binding</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>P2P sin servidores en la nube ($0)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
