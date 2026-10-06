import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  RotateCw, 
  RotateCcw, 
  Eye, 
  Save,
  ShieldAlert,
  Sparkles,
  Check
} from 'lucide-react';
import { INITIAL_PROTOCOLS, INITIAL_ROLE_DISCLAIMER } from '../../data/adminData';

export default function ExpandedProtocols({
  protocols,
  setProtocols,
  roleDisclaimer,
  setRoleDisclaimer,
  notifyBroadcast,
  setNotifyBroadcast,
  setShowPreviewModal,
  setExpandedModule,
  onSaveAndPublish,
  onTriggerAlert
}) {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProtocolChange = (id, field, value) => {
    setProtocols(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    onSaveAndPublish(protocols, roleDisclaimer);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#131518]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl gap-4 font-mono text-xs">
      
      {/* Cabecera del Editor de Protocolos */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-1 text-amber-400 border border-amber-500/40 bg-amber-950/20 text-xs font-bold rounded-lg tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              [ EDITOR ADMINISTRATIVO // PROTOCOLOS Y REGLAS OFICIALES ]
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-md">
              SINCRONIZACIÓN EN VIVO CON LAUNCHER
            </span>
          </div>
          <p className="text-[10px] text-zinc-500">
            Kernel V41.78 // DB-SYNC ENCRIPTADA ORACLE TENANCY • Cambios publicados en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setExpandedModule(null)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase transition-all shadow cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>[ ESC ] VOLVER A BENTO</span>
          </button>
        </div>
      </div>

      {/* Sub-barra de Estado de Edición */}
      <div className="bg-[#171a1e] border border-zinc-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 shadow-sm">
        <span className="text-emerald-400 font-bold">● MODO ADMIN: EDICIÓN DE REGLAS HABILITADA</span>
        <span>ÚLTIMA MODIFICACIÓN: EN TIEMPO REAL</span>
        <span className="text-amber-400/90 font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
          REVISIÓN: v4.2.0 (SYNC ORACLE &amp; LAUNCHER)
        </span>
      </div>

      {/* Cuadrícula de 4 Protocolos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
        {protocols.map((proto) => {
          const charCount = (proto.clause || proto.description || '').length;
          const maxChars = 488;
          const percentage = Math.round((charCount / maxChars) * 100);
          
          let badgeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30';
          let badgeText = `[OK - ${percentage}%]`;
          if (percentage >= 80 && percentage < 90) {
            badgeColor = 'text-amber-400 border-amber-500/30 bg-amber-950/30';
            badgeText = `[ADVERTENCIA - ${percentage}%]`;
          } else if (percentage >= 90) {
            badgeColor = 'text-red-400 border-red-600/50 bg-red-950/40';
            badgeText = `[LIMITE CRITICO - ${percentage}%]`;
          }

          return (
            <div 
              key={proto.id}
              className={`bg-[#171a1e] border rounded-xl p-4 flex flex-col justify-between shadow-md transition-all gap-3 ${
                proto.critical 
                  ? 'border-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.2)] bg-gradient-to-b from-[#171a1e] to-red-950/30' 
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Cabecera de Tarjeta */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                      proto.critical ? 'bg-red-950/80 text-red-400 border-red-500' : 'bg-zinc-900 text-amber-400 border-zinc-700'
                    }`}>
                      {proto.number ? `${proto.number} // ${proto.category}` : proto.code}
                    </span>
                    <span className="font-bold text-zinc-100 uppercase">{proto.name || proto.title}</span>
                    {proto.critical && (
                      <span className="text-[9px] text-red-400 bg-red-950/60 border border-red-800 px-1.5 py-0.5 rounded font-mono">
                        [CRITICO // PVP ILIMITADO]
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      const orig = INITIAL_PROTOCOLS.find(ip => ip.id === proto.id);
                      if (orig) {
                        setProtocols(protocols.map(p => p.id === proto.id ? orig : p));
                        onTriggerAlert(`Protocolo ${proto.name || proto.title} restaurado.`);
                      }
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>[ RESTAURAR ]</span>
                  </button>
                </div>

                {/* Título Táctico y Categoría */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">TÍTULO TÁCTICO:</label>
                      <input 
                        type="text" 
                        value={proto.title}
                        onChange={(e) => handleProtocolChange(proto.id, 'title', e.target.value)}
                        className="w-full bg-[#101214] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-500 font-mono transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">CATEGORÍA:</label>
                      <input 
                        type="text" 
                        value={proto.category || ''}
                        onChange={(e) => handleProtocolChange(proto.id, 'category', e.target.value)}
                        className="w-full bg-[#101214] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 uppercase focus:outline-none focus:border-amber-500 font-mono transition-colors"
                      />
                    </div>
                  </div>

                  {/* Cláusula Operativa */}
                  <div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase mb-1">
                      <span>CLÁUSULA / DIRECTIVA OPERATIVA (VISIBLE EN LAUNCHER):</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold font-mono ${badgeColor}`}>
                        {charCount} / {maxChars} CARACTERES {badgeText}
                      </span>
                    </div>
                    <textarea 
                      rows={3}
                      maxLength={maxChars}
                      value={proto.clause || proto.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleProtocolChange(proto.id, 'clause', val);
                        handleProtocolChange(proto.id, 'description', val);
                      }}
                      className="w-full bg-[#101214] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 leading-relaxed font-mono resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Estado inferior de la tarjeta */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 uppercase">ESTADO:</span>
                  <span className={`font-bold ${proto.critical ? 'text-red-400 animate-pulse bg-red-950/60 border border-red-800 px-2 py-0.5 rounded' : 'text-emerald-400'}`}>
                    {proto.status || 'VIGENTE'}
                  </span>
                </div>
                <span className="text-zinc-500 font-mono">{charCount} / {maxChars} [{percentage}%]</span>
              </div>

            </div>
          );
        })}

        {/* Sección: Sobre el Rol */}
        {roleDisclaimer && (
          <div className="lg:col-span-2 p-4 bg-[#171a1e] border border-zinc-800 rounded-xl shadow-md space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <input
                type="text"
                value={roleDisclaimer.title}
                onChange={(e) => setRoleDisclaimer?.({ ...roleDisclaimer, title: e.target.value })}
                className="bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded px-2.5 py-1 text-xs font-bold text-zinc-100 uppercase focus:outline-none transition-colors"
                placeholder="Título de la Cláusula de Rol"
              />
            </div>

            <div>
              <label className="block text-[9px] text-zinc-500 uppercase mb-1">
                DIRECTIVA DE INTERACCIÓN Y ROL IC / OOC (VISIBLE EN LAUNCHER):
              </label>
              <textarea
                rows={2}
                value={roleDisclaimer.text}
                onChange={(e) => setRoleDisclaimer?.({ ...roleDisclaimer, text: e.target.value })}
                className="w-full bg-[#101214] border border-zinc-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none leading-relaxed font-mono resize-none transition-colors"
                placeholder="Normativa sobre rol, metagaming y toxicidad..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer del Editor de Protocolos */}
      <div className="bg-[#171a1e] border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-amber-500 text-black font-black text-[10px] rounded-lg tracking-wider">
            EDICIÓN ACTIVA
          </span>
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={notifyBroadcast}
              onChange={(e) => setNotifyBroadcast(e.target.checked)}
              className="rounded bg-[#101214] border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <span>Notificar a los 38 jugadores conectados (Broadcast RCON)</span>
          </label>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
              setProtocols(INITIAL_PROTOCOLS);
              setRoleDisclaimer?.(INITIAL_ROLE_DISCLAIMER);
              onTriggerAlert("Valores originales restaurados.");
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase transition-all shadow cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTAURAR TODOS</span>
          </button>

          <button 
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase transition-all shadow cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>VISTA PREVIA JUGADOR</span>
          </button>

          <button 
            onClick={handleSave}
            disabled={savedSuccess}
            className={`px-6 py-2 rounded-lg font-black text-xs uppercase flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.99]'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡REGLAS GUARDADAS Y PUBLICADAS!</span>
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

    </div>
  );
}
