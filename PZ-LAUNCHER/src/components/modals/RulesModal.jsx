import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { SERVER_PROTOCOLS, ROLE_DISCLAIMER } from '../../data/rulesData';

export default function RulesModal({ isOpen, onClose }) {
  const [protocols, setProtocols] = useState(() => {
    try {
      const saved = localStorage.getItem('apocalipto_pz_rules');
      return saved ? JSON.parse(saved) : SERVER_PROTOCOLS;
    } catch {
      return SERVER_PROTOCOLS;
    }
  });

  const [roleDisclaimer, setRoleDisclaimer] = useState(() => {
    try {
      const saved = localStorage.getItem('apocalipto_pz_role_disclaimer');
      return saved ? JSON.parse(saved) : ROLE_DISCLAIMER;
    } catch {
      return ROLE_DISCLAIMER;
    }
  });

  // Sincronización en vivo con el Servidor Central / Swarm Bridge
  useEffect(() => {
    async function syncRules() {
      try {
        const res = await fetch('http://localhost:19842/api/rules');
        if (res.ok) {
          const data = await res.json();
          if (data && data.protocols && Array.isArray(data.protocols) && data.protocols.length > 0) {
            setProtocols(data.protocols);
            if (data.roleDisclaimer) setRoleDisclaimer(data.roleDisclaimer);
            localStorage.setItem('apocalipto_pz_rules', JSON.stringify(data.protocols));
            if (data.roleDisclaimer) localStorage.setItem('apocalipto_pz_role_disclaimer', JSON.stringify(data.roleDisclaimer));
            return;
          }
        }
      } catch {}

      // Fallback remoto para jugadores externos
      try {
        const remoteRes = await fetch('https://raw.githubusercontent.com/TheFrog-PE/apocalipto-pz/main/public/rules.json');
        if (remoteRes.ok) {
          const rData = await remoteRes.json();
          if (rData && rData.protocols && Array.isArray(rData.protocols)) {
            setProtocols(rData.protocols);
            if (rData.roleDisclaimer) setRoleDisclaimer(rData.roleDisclaimer);
          }
        }
      } catch {}
    }

    syncRules();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('apocalipto_pz_rules_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'RULES_UPDATED') {
          if (event.data.protocols) setProtocols(event.data.protocols);
          if (event.data.roleDisclaimer) setRoleDisclaimer(event.data.roleDisclaimer);
        }
      };
      return () => channel.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#141414]/95 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Franja de Advertencia / Hazard Header */}
          <div
            className="h-2.5 w-full shrink-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 12px, #000 12px, #000 24px)'
            }}
          />

          {/* Cabecera del Modal */}
          <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-black/50 shrink-0">
            <div className="flex items-center gap-2.5 text-amber-500">
              <img 
                src="/isotipo.png" 
                alt="Apocalipto PZ" 
                className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.7)] select-none" 
              />
              <span className="font-mono font-bold text-sm tracking-wider uppercase text-zinc-100">
                [ PROTOCOLOS DEL ENJAMBRE P2P ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 transition-colors cursor-pointer rounded-lg hover:bg-zinc-900"
              aria-label="Cerrar modal de reglas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tags de Modo redondeados */}
          <div className="px-6 py-2.5 bg-zinc-950/70 border-b border-zinc-900 flex items-center gap-3 text-[10px] font-mono text-zinc-400 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• PVP EXTREMO</span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• FARMEAO</span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• RAIDED</span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• TRAICIONES</span>
          </div>

          {/* Contenido scrolleable de Protocolos (Grid 2x2) */}
          <div className="p-6 overflow-y-auto space-y-4 bg-[#141414]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {protocols.map((protocol) => (
                <div
                  key={protocol.id}
                  className="p-4 bg-[#181818] border border-zinc-800/90 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold font-mono uppercase ${protocol.titleColor || 'text-zinc-100'}`}>
                      {protocol.number ? `${protocol.number} ` : ''}{protocol.title}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 border border-zinc-700 px-2.5 py-0.5 rounded-full">
                      {protocol.category}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 leading-relaxed text-justify">
                    {protocol.clause || protocol.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Cláusula: Sobre el Rol */}
            <div className="p-3.5 bg-[#181818] border border-zinc-800 rounded-xl flex items-start gap-3 mt-2">
              <div className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-400 bg-zinc-900">
                <ShieldAlert className="w-4 h-4 text-amber-500/80" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-zinc-200 mb-1 uppercase">
                  {roleDisclaimer.title}
                </div>
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed text-justify">
                  {roleDisclaimer.text}
                </p>
              </div>
            </div>
          </div>

          {/* Botón de Aceptación redondeado */}
          <div className="p-6 pt-3 bg-[#141414] border-t border-zinc-800/60 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-red-700 hover:bg-red-600 text-white font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow-lg active:scale-[0.99] rounded-xl cursor-pointer"
            >
              HE LEÍDO Y ACEPTO LOS PROTOCOLOS
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
