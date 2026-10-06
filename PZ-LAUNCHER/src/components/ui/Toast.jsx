import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={`flex items-start gap-3 p-4 border shadow-2xl backdrop-blur-md max-w-md rounded-2xl ${
            isSuccess
              ? 'bg-[#121c15]/95 border-emerald-500/80 text-emerald-300'
              : isError
              ? 'bg-[#211111]/95 border-red-500/80 text-red-300'
              : 'bg-[#181818]/95 border-zinc-700 text-zinc-200'
          }`}
        >
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {isError && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

          <div className="flex-1">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider mb-1">
              {toast.title || (isSuccess ? '[ OPERACIÓN EXITOSA ]' : '[ ALERTA DE SISTEMA ]')}
            </h5>
            <p className="text-[11px] font-mono leading-relaxed text-zinc-300">
              {toast.message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
