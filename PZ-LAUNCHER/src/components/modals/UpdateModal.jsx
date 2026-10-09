import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export default function UpdateModal({ isOpen, updateInfo, onClose }) {
  const [stage, setStage] = useState('idle'); // 'idle' | 'downloading' | 'verifying' | 'installing' | 'error'
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !updateInfo) return null;

  const handleUpdate = async () => {
    setStage('downloading');
    setProgress(0);
    setErrorMessage('');
    setStatusText('Conectando con el repositorio oficial...');

    const targetUrl = updateInfo.downloadUrl || 'https://github.com/TheFrog-PE/apocalipto-pz/raw/main/public/downloads/ApocaliptoPZ-Setup.exe';

    try {
      // 1. Descarga por streaming con reporte de progreso
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: No se pudo descargar la actualización`);

      const contentLength = res.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let loadedBytes = 0;

      const reader = res.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loadedBytes += value.length;
        if (totalBytes > 0) {
          const pct = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
          setProgress(pct);
          setStatusText(`Descargando parche oficial: ${pct}% (${(loadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`);
        } else {
          setStatusText(`Descargando parche: ${(loadedBytes / (1024 * 1024)).toFixed(1)} MB`);
        }
      }

      // 2. Unificar los chunks recibidos
      const fullBuffer = new Uint8Array(loadedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // 3. Verificación criptográfica SHA-256 en el cliente
      setStage('verifying');
      setStatusText('Verificando firma criptográfica SHA-256 (Anti-Tamper)...');

      if (window.crypto && window.crypto.subtle && updateInfo.sha256) {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', fullBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
        const expected = updateInfo.sha256.trim().toLowerCase();

        if (expected && hashHex !== expected) {
          throw new Error(`Violación de seguridad criptográfica: el hash del archivo no coincide con la firma oficial.`);
        }
      }

      // 4. Aplicar instalación silenciosa nativa vía Tauri
      setStage('installing');
      setStatusText('Instalando en segundo plano y reiniciando launcher...');

      const base64Data = uint8ArrayToBase64(fullBuffer);

      if (window.__TAURI__ && window.__TAURI__.invoke) {
        await window.__TAURI__.invoke('apply_update', {
          binaryDataBase64: base64Data,
          expectedSha256: updateInfo.sha256 || ''
        });
        setStatusText('¡Actualización aplicada! Reiniciando launcher en breve...');
      } else {
        // Fallback fuera de Tauri (navegador web o desarrollo)
        const blob = new Blob([fullBuffer], { type: 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'ApocaliptoPZ-Setup.exe';
        a.click();
        URL.revokeObjectURL(blobUrl);
        setStage('idle');
      }
    } catch (err) {
      console.error('Error durante la auto-actualización:', err);
      setStage('error');
      setErrorMessage(err.message || 'Error al procesar la actualización automática');
    }
  };

  const handleManualFallback = async () => {
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

          {/* Estado de Descarga y Seguridad */}
          {stage !== 'idle' && stage !== 'error' && (
            <div className="mb-5 p-4 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 flex items-center gap-2 font-bold">
                  {stage === 'downloading' && <Download className="w-3.5 h-3.5 animate-bounce" />}
                  {stage === 'verifying' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  {stage === 'installing' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
                  {stage === 'downloading' && 'Descarga en segundo plano'}
                  {stage === 'verifying' && 'Validación Anti-Malware'}
                  {stage === 'installing' && 'Instalación Silenciosa'}
                </span>
                <span className="text-zinc-400 font-bold">{progress}%</span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-[10px] text-zinc-400 leading-tight">
                {statusText}
              </p>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs space-y-2">
              <p className="text-red-400 font-bold text-[11px]">
                ✕ Error durante la actualización:
              </p>
              <p className="text-red-300 text-[10px]">
                {errorMessage}
              </p>
              <button
                onClick={handleManualFallback}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline block"
              >
                Descargar instalador manualmente vía navegador
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5">
            {stage === 'idle' && (
              <button
                onClick={handleUpdate}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ACTUALIZAR EN SEGUNDO PLANO AHORA</span>
              </button>
            )}

            {stage === 'error' && (
              <button
                onClick={handleUpdate}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>REINTENTAR ACTUALIZACIÓN AUTOMÁTICA</span>
              </button>
            )}

            {stage !== 'idle' && stage !== 'error' && (
              <div className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>PROCESANDO ACTUALIZACIÓN...</span>
              </div>
            )}

            {!updateInfo.updateRequired && stage === 'idle' && (
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
