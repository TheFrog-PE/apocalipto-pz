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

            {/* Descarga Única: Instalador Oficial Windows (.EXE) */}
            <div className="bg-[#12151e] border border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded font-mono font-bold tracking-wider">
                    APP NATIVA DE ESCRITORIO (.EXE)
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base font-syne uppercase">INSTALADOR OFICIAL PARA WINDOWS</h4>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-1">
                    Instalador nativo con soporte completo de Enjambre P2P, enlace criptográfico directo con Steam y aceleración de red sin intermediarios web.
                  </p>
                </div>
              </div>
              <a
                href="/downloads/ApocaliptoPZ-Setup.exe"
                download="ApocaliptoPZ-Setup.exe"
                className="mt-6 w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer font-syne text-xs tracking-wider"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>DESCARGAR APOCALIPTO PZ (WINDOWS .EXE)</span>
              </a>
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
