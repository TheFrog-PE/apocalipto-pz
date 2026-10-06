import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Sliders, X, CheckCircle2, Zap, Droplets, ShieldAlert, Cpu, RefreshCw, Power } from 'lucide-react';

export default function WorldConfigModal({ isOpen, onClose, onTriggerAlert, worldStatus, worldProgress = { percent: 0, phase: 'Iniciando...' }, onStartWorld, onStopWorld }) {
  const [config, setConfig] = useState({
    doorOpeningPercentage: 30,
    sprinterPercentage: 3,
    populationMultiplier: 0.60,
    waterShutModifier: 21,
    elecShutModifier: 21
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:19842/api/admin/world/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Error cargando configuración del sandbox:', err);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:19842/api/admin/world/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        if (onTriggerAlert) onTriggerAlert("✓ CONFIGURACIÓN DEL MUNDO GUARDADA EN DISCO.");
      } else {
        if (onTriggerAlert) onTriggerAlert("ERROR AL GUARDAR CONFIGURACIÓN.");
      }
    } catch (err) {
      if (onTriggerAlert) onTriggerAlert(`Error: ${err.message}`);
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#121418] border border-red-600/50 shadow-[0_0_50px_rgba(220,38,38,0.25)] rounded-2xl p-6 text-zinc-100 flex flex-col max-h-[90vh]"
        >
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2">
                CALIBRACIÓN DEL MUNDO // SANDBOX BUILD 42
              </h2>
              <p className="text-[11px] text-zinc-400 font-light">
                Ajuste fino de la simulación del Nodo Alfa (Zombies, Dificultad, Luz y Agua).
              </p>
            </div>
          </div>

          {/* Estado del Servidor & Acciones de Control Rápido */}
          <div className="mb-5 p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between shadow-inner shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${
                worldStatus === 'ONLINE' ? 'bg-emerald-500 animate-ping' : 
                worldStatus === 'STARTING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
              }`} />
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">ESTADO DE LA SIMULACIÓN ALFA</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  worldStatus === 'ONLINE' ? 'text-emerald-400' :
                  worldStatus === 'STARTING' ? 'text-amber-400' : 'text-zinc-400'
                }`}>
                  {worldStatus === 'ONLINE' ? '🟢 MUNDO EN LÍNEA (ACEPTANDO CONEXIONES)' :
                   worldStatus === 'STARTING' ? `🟡 INICIANDO (${worldProgress?.percent || 15}% - ${worldProgress?.phase || 'Cargando...'})` : 
                   worldStatus === 'CHECKING' ? '⏳ VERIFICANDO TELEMETRÍA...' : '🔴 MUNDO DETENIDO'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {worldStatus === 'OFFLINE' ? (
                <button
                  onClick={onStartWorld}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>ENCENDER MUNDO</span>
                </button>
              ) : worldStatus === 'STARTING' ? (
                <div className="px-3 py-1.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-[10px] uppercase rounded-lg flex items-center gap-1.5 select-none">
                  <div className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>{worldProgress?.percent || 15}% CARGANDO</span>
                </div>
              ) : (
                <button
                  onClick={onStopWorld}
                  className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-[10px] uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(220,38,38,0.4)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>APAGAR SEGURO</span>
                </button>
              )}
            </div>
          </div>

          {/* Sliders y Controles de Configuración */}
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            
            {/* 1. ZOMBIES INTELIGENTES (ABREN PUERTAS) */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  ZOMBIES INTELIGENTES (ABREN PUERTAS)
                </span>
                <span className="text-sm font-black text-red-400 font-mono">
                  {config.doorOpeningPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.doorOpeningPercentage}
                onChange={(e) => setConfig({ ...config, doorOpeningPercentage: parseInt(e.target.value, 10) })}
                className="w-full accent-red-600 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                El <strong className="text-red-400">{config.doorOpeningPercentage}%</strong> de los zombis tiene cognición avanzada y sabe abrir puertas y ventanas. El <strong className="text-zinc-300">{100 - config.doorOpeningPercentage}% restante</strong> son básicos que solo arañan sin abrir.
              </p>
            </div>

            {/* 2. VELOCIDAD Y CORREDORES ESPECIALES */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  PROBABILIDAD DE CORREDORES (SPRINTERS)
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {config.sprinterPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={config.sprinterPercentage}
                onChange={(e) => setConfig({ ...config, sprinterPercentage: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Los zombis son tambaleantes veloces con un <strong className="text-amber-400">{config.sprinterPercentage}%</strong> de corredores especiales mortíferos que corren a máxima velocidad.
              </p>
            </div>

            {/* 3. DENSIDAD DE POBLACIÓN DE ZOMBIS */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  DENSIDAD DE POBLACIÓN
                </span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {Math.round(config.populationMultiplier * 100)}% ({config.populationMultiplier}x)
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={config.populationMultiplier}
                onChange={(e) => setConfig({ ...config, populationMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Población reducida al <strong className="text-cyan-400">{Math.round(config.populationMultiplier * 100)}%</strong> de la base para garantizar combates tácticos sin sobrecargar la CPU del enjambre.
              </p>
            </div>

            {/* 4. SUMINISTRO DE AGUA Y ENERGÍA */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 uppercase flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  DURACIÓN DE LUZ Y AGUA
                </span>
                <span className="text-xs font-bold text-blue-400 font-mono">
                  {config.waterShutModifier === 21 ? '1 SEMANA REAL (7 DÍAS)' :
                   config.waterShutModifier === 14 ? 'INMEDIATO (0 DÍAS)' :
                   config.waterShutModifier === 28 ? '2 SEMANAS' :
                   config.waterShutModifier === 44 ? '1 MES' : `${config.waterShutModifier} MOD`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: '0 Días (Inmediato)', val: 14 },
                  { label: '7 Días (1 Sem)', val: 21 },
                  { label: '14 Días (2 Sem)', val: 28 },
                  { label: '30 Días (1 Mes)', val: 44 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setConfig({ ...config, waterShutModifier: item.val, elecShutModifier: item.val })}
                    className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      config.waterShutModifier === item.val
                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer de Acciones */}
          <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-zinc-500">
              * Los cambios se aplican al arrancar o reiniciar la simulación del mundo.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadConfig}
                disabled={isLoading}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>RECARGAR</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR REGLAS DEL MUNDO'}</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
