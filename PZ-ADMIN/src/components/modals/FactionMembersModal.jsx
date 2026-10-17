import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserX, X, Shield, Cpu, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FactionMembersModal({
  isOpen,
  onClose,
  faction,
  members = [],
  onRevokeMember
}) {
  const [confirmRevokeId, setConfirmRevokeId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  if (!isOpen || !faction) return null;

  const handleRevoke = async (nodeId) => {
    setRevokingId(nodeId);
    try {
      await onRevokeMember(nodeId, faction.id);
      setConfirmRevokeId(null);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#121418] border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl p-4 sm:p-6 text-zinc-100 flex flex-col max-h-[90vh]"
        >
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{faction.sub || 'FACCIÓN OFICIAL'}</span>
                <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 text-[9px] rounded font-bold">
                  {members.length} / {faction.max || 10} CUPOS
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-zinc-100">
                MIEMBROS DE {faction.name} ({faction.id.toUpperCase()})
              </h2>
            </div>
          </div>

          {/* Lista de Miembros */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2">
            {members.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800/80 rounded-xl text-zinc-500 font-mono text-xs my-4 bg-zinc-950/40">
                <Users className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                <div className="font-bold text-zinc-400 uppercase tracking-wider text-xs">Sin Miembros Registrados</div>
                <div className="text-[10px] text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Esta facción no tiene supervivientes aprobados en la Whitelist en este momento.
                </div>
              </div>
            ) : (
              members.map((member) => {
                const isConfirming = confirmRevokeId === member.nodeId;
                const isProcessing = revokingId === member.nodeId;
                const approvedDate = member.approvedAt ? new Date(member.approvedAt).toLocaleDateString() : 'Activo';

                return (
                  <div
                    key={member.nodeId}
                    className="p-3 bg-[#171a1e] border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-1.5 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 font-mono text-[9px] font-bold">
                          {member.assignedRole || 'SOMBRA'}
                        </span>
                        <span className="font-bold text-zinc-100 text-xs font-mono truncate">
                          {member.callsign || member.nodeId}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 font-mono">
                        <span className="text-zinc-500">Steam: <strong className="text-zinc-300">{member.steamId ? `...${String(member.steamId).slice(-6)}` : 'Protegido'}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {approvedDate}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          DPoH Válido
                        </span>
                      </div>
                    </div>

                    {/* Botón de Expulsión */}
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/60 p-1.5 rounded-lg animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="text-[9px] font-bold text-red-200">¿Confirmar expulsión?</span>
                          <button
                            onClick={() => handleRevoke(member.nodeId)}
                            disabled={isProcessing}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            {isProcessing ? '...' : 'SÍ, EXPULSAR'}
                          </button>
                          <button
                            onClick={() => setConfirmRevokeId(null)}
                            disabled={isProcessing}
                            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            CANCELAR
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRevokeId(member.nodeId)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-red-950/80 border border-zinc-700 hover:border-red-600 text-zinc-400 hover:text-red-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                          title="Revocar ticket de la Whitelist y expulsar de la facción"
                        >
                          <UserX className="w-3.5 h-3.5 text-red-400" />
                          <span>EXPULSAR</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Modal */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
            <span>Al expulsar, el ticket DPoH queda revocado y se libera 1 slot táctico de inmediato.</span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold transition-colors cursor-pointer"
            >
              CERRAR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
