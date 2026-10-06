import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X } from 'lucide-react';

export default function PlayerPreviewModal({ isOpen, onClose, protocols }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#131518] border border-amber-500/50 rounded-2xl w-full max-w-2xl p-6 shadow-2xl font-mono text-xs text-zinc-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Eye className="w-4 h-4" />
              <span>[ VISTA PREVIA JUGADOR // LAUNCHER SUPERVIVIENTE ]</span>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
            {protocols.map((p) => (
              <div key={p.id} className="p-3.5 bg-[#171a1e] border border-zinc-800 rounded-xl space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold text-[10px]">{p.code} — {p.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${p.critical ? 'bg-red-950/80 text-red-400 border border-red-800' : 'bg-zinc-900 text-emerald-400 border border-zinc-700'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-zinc-400 leading-relaxed text-[11px]">{p.clause}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg uppercase cursor-pointer transition-colors"
            >
              CERRAR VISTA PREVIA
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
