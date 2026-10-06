import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Copy, Check, X, Shield, Wifi, Radio, ExternalLink } from 'lucide-react';

export default function GatewayModal({ isOpen, onClose, onTriggerAlert }) {
  const [gatewayData, setGatewayData] = useState({
    localLanIp: '192.168.0.102',
    httpPort: 19842,
    gameUdpPort: 16261,
    publicGateway: '',
    activeGateway: '192.168.0.102',
    inviteUrl: 'http://192.168.0.102:5176/?gateway=http://192.168.0.102:19842',
    tunnelStatus: 'LAN_DIRECT'
  });

  const [customInput, setCustomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchGatewayInfo();
  }, [isOpen]);

  const fetchGatewayInfo = async () => {
    try {
      const res = await fetch('http://localhost:19842/api/admin/gateway-info');
      if (res.ok) {
        const data = await res.json();
        setGatewayData(data);
        setCustomInput(data.publicGateway || '');
      }
    } catch {}
  };

  const handleSaveGateway = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:19842/api/admin/gateway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicGateway: customInput.trim() })
      });
      if (res.ok) {
        await fetchGatewayInfo();
        if (onTriggerAlert) onTriggerAlert('GATEWAY P2P ACTUALIZADO EXITOSAMENTE.');
      }
    } catch {}
    setIsSaving(false);
  };

  const handleCopyInvite = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(gatewayData.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onTriggerAlert) onTriggerAlert(`ENLACE COPIADO: ${gatewayData.inviteUrl}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#14161a] border border-zinc-800 shadow-2xl rounded-2xl p-6 text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
            <div className="flex items-center gap-2 text-amber-500">
              <Globe className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  CENTRAL DE ENLACE EXTERNO // GATEWAY P2P
                </h3>
                <span className="text-[10px] text-zinc-500">Conectividad Multijugador $0 para Jugadores Externos</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 transition-colors rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetría de Puertos */}
          <div className="grid grid-cols-3 gap-3 mb-5 text-[11px]">
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <span className="text-zinc-500 text-[9px] block uppercase">IP LOCAL (LAN)</span>
              <span className="font-bold text-emerald-400">{gatewayData.localLanIp}</span>
            </div>
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <span className="text-zinc-500 text-[9px] block uppercase">CONTROL HTTP</span>
              <span className="font-bold text-cyan-400">Puerto {gatewayData.httpPort}</span>
            </div>
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <span className="text-zinc-500 text-[9px] block uppercase">JUEGO UDP</span>
              <span className="font-bold text-amber-400">Puerto {gatewayData.gameUdpPort}</span>
            </div>
          </div>

          {/* Input de Dominio / Túnel Público */}
          <div className="mb-5 p-4 bg-[#101214] border border-zinc-800/80 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                GATEWAY PÚBLICO O TÚNEL ($0)
              </span>
              <span className="text-[10px] text-zinc-500">Opcional si juegan por Internet</span>
            </div>
            <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
              Si juegas con amigos fuera de tu casa, puedes colocar aquí tu IP pública o un túnel $0 gratuito (como Playit.gg o Cloudflare):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: apocalipto.playit.gg o tu IP pública..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 bg-[#16181d] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={handleSaveGateway}
                disabled={isSaving}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-lg transition-all cursor-pointer shadow hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              >
                {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </div>
          </div>

          {/* Enlace de Invitación para Jugadores */}
          <div className="mb-5 p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                ENLACE DIRECTO DE INVITACIÓN PARA OTRAS PCS
              </span>
              <span className="text-[10px] text-emerald-300/80 font-bold">AUTO-CONFIGURABLE</span>
            </div>
            <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-lg flex items-center justify-between gap-3 text-xs mb-3 font-mono">
              <span className="text-zinc-300 truncate">{gatewayData.inviteUrl}</span>
              <button
                onClick={handleCopyInvite}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-600'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡COPIADO!' : 'COPIAR'}</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Copia este enlace y envíaselo a tus jugadores. Cuando abran el Launcher con este link, **su Launcher se conectará automáticamente a tu Centro de Mando sin que ellos tengan que configurar nada**.
            </p>
          </div>

          {/* Opciones $0 para Conectar a Distancia */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-3 text-[10px] text-zinc-400">
            <div className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-400" />
              3 MODOS 100% GRATIS ($0) PARA OTRAS PCS:
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
              <li><strong className="text-zinc-200">Misma Red WiFi / LAN:</strong> Solo dales el enlace con la IP <code className="text-amber-400">{gatewayData.localLanIp}</code>.</li>
              <li><strong className="text-zinc-200">Internet sin abrir puertos (Recomendado $0):</strong> Usa un túnel UDP con <span className="text-cyan-400">Playit.gg</span> (atraviesa cualquier router/CGNAT gratis).</li>
              <li><strong className="text-zinc-200">Internet Directo (Port Forward):</strong> Abre los puertos 16261 (UDP) y 19842 (TCP) en tu router y usa tu IP pública.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
