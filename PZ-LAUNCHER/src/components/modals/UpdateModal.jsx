import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export default function UpdateModal({ isOpen, updateInfo, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleUpdate = async () => {
    setDownloading(true);
    const targetUrl = updateInfo.downloadUrl || 'https://github.com/TheFrog-PE/apocalipto-pz/raw/main/public/downloads/ApocaliptoPZ-Setup.exe';
    
    try {
      const { open } = await import('@tauri-apps/api/shell');
      await open(targetUrl);
    } catch {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#141414]/95 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)] rounded-2xl p-6 font-mono text-zinc-200"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold block">
                SISTEMA DE ACTUALIZACIÓN DEL ENJAMBRE
              </span>
              <h2 className="text-sm font-bold text-white">
                Nueva Versión Disponible (v{updateInfo.latestVersion})
              </h2>
            </div>
          </div>

          {/* Versión Diff */}
          <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Versión Actual</span>
              <span className="font-bold text-zinc-400">v{updateInfo.currentVersion}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500" />
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block uppercase">Nueva Versión</span>
              <span className="font-bold text-emerald-400">v{updateInfo.latestVersion}</span>
            </div>
          </div>

          {/* Changelog */}
          <div className="mb-5 p-3.5 bg-black/60 border border-zinc-800 rounded-xl text-xs space-y-1">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Novedades del Parche:</span>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              {updateInfo.changelog || 'Actualización obligatoria para sincronizar con la red P2P del Enjambre.'}
            </p>
          </div>

          {/* Action button */}
          <div className="space-y-2.5">
            <button
              onClick={handleUpdate}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'DESCARGANDO ACTUALIZACIÓN...' : 'ACTUALIZAR LAUNCHER AHORA'}</span>
            </button>

            {downloading && (
              <p className="text-[10px] text-center text-emerald-400 animate-pulse">
                ✓ Descarga iniciada. Ejecuta el nuevo archivo para actualizar tu Launcher.
              </p>
            )}

            {!updateInfo.updateRequired && (
              <button
                onClick={onClose}
                className="w-full py-2.5 text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Recordar más tarde
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
