import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Save, RotateCcw, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { INITIAL_PROTOCOLS, INITIAL_ROLE_DISCLAIMER } from '../../data/adminData';

export default function RulesModal({ 
  isOpen, 
  onClose, 
  protocols, 
  setProtocols, 
  roleDisclaimer, 
  setRoleDisclaimer,
  onSaveAndPublish
}) {
  const [localProtocols, setLocalProtocols] = useState(protocols || INITIAL_PROTOCOLS);
  const [localDisclaimer, setLocalDisclaimer] = useState(roleDisclaimer || INITIAL_ROLE_DISCLAIMER);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (protocols && protocols.length > 0) {
        setLocalProtocols(protocols);
      }
      if (roleDisclaimer) {
        setLocalDisclaimer(roleDisclaimer);
      }
    }
  }, [isOpen, protocols, roleDisclaimer]);

  if (!isOpen) return null;

  const handleProtocolChange = (id, field, value) => {
    setLocalProtocols(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setProtocols?.(localProtocols);
    setRoleDisclaimer?.(localDisclaimer);
    if (onSaveAndPublish) {
      await onSaveAndPublish(localProtocols, localDisclaimer);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setLocalProtocols(INITIAL_PROTOCOLS);
    setLocalDisclaimer(INITIAL_ROLE_DISCLAIMER);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#131518] border border-amber-500/60 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl font-mono text-xs text-zinc-200 overflow-hidden"
        >
          {/* Franja Hazard militar */}
          <div
            className="h-2.5 w-full shrink-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 12px, #000 12px, #000 24px)'
            }}
          />

          {/* Cabecera del Editor de Reglas */}
          <div className="px-6 py-4 border-b border-zinc-800 bg-[#16181d] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-wider uppercase text-zinc-100">
                    [ EDITOR DE REGLAS // SINCRONIZACIÓN CON LAUNCHER ]
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold rounded">
                    EDICIÓN ACTIVA
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Las reglas guardadas aquí se publican automáticamente y en tiempo real en la pantalla del Launcher de los jugadores.
                </span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tags de Modo */}
          <div className="px-6 py-2 bg-zinc-950/80 border-b border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• PVP EXTREMO</span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• FARMEAO</span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• RAIDED</span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">• TRAICIONES</span>
            </div>
            <button
              onClick={handleReset}
              className="text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESTAURAR ORIGINALES</span>
            </button>
          </div>

          {/* Formulario Scrolleable de los 4 Protocolos + Disclaimer */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#101214]">
            
            {/* Grid 2x2 de los 4 Protocolos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localProtocols.map((proto) => (
                <div 
                  key={proto.id}
                  className="p-4 bg-[#171a1e] border border-zinc-800/90 hover:border-zinc-700 rounded-xl flex flex-col justify-between shadow-md transition-all gap-3"
                >
                  <div className="space-y-2.5">
                    {/* Header de cada protocolo */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-700 font-bold text-[10px]">
                          {proto.number || '01'}
                        </span>
                        <input
                          type="text"
                          value={proto.title}
                          onChange={(e) => handleProtocolChange(proto.id, 'title', e.target.value)}
                          className="flex-1 bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded px-2.5 py-1 text-xs font-bold text-zinc-100 uppercase focus:outline-none transition-colors"
                          placeholder="Título del Protocolo"
                        />
                      </div>
                      <input
                        type="text"
                        value={proto.category}
                        onChange={(e) => handleProtocolChange(proto.id, 'category', e.target.value)}
                        className="w-28 bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded px-2 py-1 text-[10px] text-zinc-400 text-center uppercase focus:outline-none transition-colors"
                        placeholder="Categoría"
                      />
                    </div>

                    {/* Área de texto de la directiva */}
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">
                        CLÁUSULA OPERATIVA (TEXTO VISIBLE EN LAUNCHER):
                      </label>
                      <textarea
                        rows={4}
                        value={proto.clause || proto.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleProtocolChange(proto.id, 'clause', val);
                          handleProtocolChange(proto.id, 'description', val);
                        }}
                        className="w-full bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none leading-relaxed font-mono resize-none transition-colors"
                        placeholder="Descripción y directiva del protocolo..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-850">
                    <span>Caracteres: {(proto.clause || proto.description || '').length}</span>
                    <span className="text-emerald-400 font-bold">● VIGENTE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sección: Sobre el Rol (Role Disclaimer) */}
            <div className="p-4 bg-[#171a1e] border border-zinc-800 rounded-xl shadow-md space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <input
                  type="text"
                  value={localDisclaimer.title}
                  onChange={(e) => setLocalDisclaimer({ ...localDisclaimer, title: e.target.value })}
                  className="bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded px-2.5 py-1 text-xs font-bold text-zinc-100 uppercase focus:outline-none transition-colors"
                  placeholder="Título de la Cláusula de Rol"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase mb-1">
                  DIRECTIVA DE INTERACCIÓN Y ROL IC / OOC:
                </label>
                <textarea
                  rows={3}
                  value={localDisclaimer.text}
                  onChange={(e) => setLocalDisclaimer({ ...localDisclaimer, text: e.target.value })}
                  className="w-full bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none leading-relaxed font-mono resize-none transition-colors"
                  placeholder="Normativa sobre rol, metagaming y toxicidad..."
                />
              </div>
            </div>

          </div>

          {/* Footer de Acciones del Modal */}
          <div className="px-6 py-4 bg-[#16181d] border-t border-zinc-800 flex items-center justify-between shrink-0">
            <div className="text-[10px] text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sincronización instantánea mediante canal de radiotransmisión</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                CANCELAR
              </button>

              <button 
                onClick={handleSave}
                disabled={savedSuccess}
                className={`px-6 py-2 font-black rounded-lg text-xs uppercase flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                  savedSuccess
                    ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.99]'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡REGLAS PUBLICADAS AL LAUNCHER!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>GUARDAR REGLAS Y PUBLICAR EN LAUNCHER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
