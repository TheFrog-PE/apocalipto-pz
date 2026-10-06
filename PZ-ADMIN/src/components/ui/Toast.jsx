import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-2.5 rounded-xl border-2 border-black font-mono font-bold tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center gap-2.5 backdrop-blur-md"
        >
          <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs uppercase">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
