import React from 'react';
import { motion } from 'framer-motion';
import { Download, Users, Lock, CheckCircle2, Play, User } from 'lucide-react';

export default function FactionsTab({ 
  factions, 
  selectedFaction, 
  approvedFaction, 
  survivorName,
  onSurvivorNameChange,
  onSelectFaction, 
  onResetFaction, 
  onLaunchGame,
  updateInfo,
  onUpdateLauncher
}) {
  const currentFaction = factions.find(f => f.id === (approvedFaction || selectedFaction)) || factions[0];

  return (
    <motion.div
      key="facciones"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full flex flex-col items-center"
    >
      {/* Título de Sección */}
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-wider uppercase text-zinc-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          ASÍ ES COMO MORISTE
        </h2>
        <div className="w-24 h-1 bg-red-700 rounded-full mx-auto my-3 shadow-[0_0_10px_rgba(185,28,28,0.9)]" />
        <p className="text-sm text-zinc-300 font-light tracking-wide font-mono drop-shadow">
          14 días después de la infección, todo empeoró
        </p>
      </div>

      {/* Grid de Facciones: Navegación libre antes de recibir acceso, bloqueo estricto al ser aprobado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-8">
        {factions.map((faction) => {
          const isSelected = (approvedFaction ? approvedFaction === faction.id : selectedFaction === faction.id);
          const isApprovedThis = approvedFaction === faction.id;
          const isLockedOther = Boolean(approvedFaction && approvedFaction !== faction.id);
          const percentage = Math.min(100, (faction.current / faction.max) * 100);

          return (
            <div
              key={faction.id}
              onClick={() => {
                // Regla estricta: solo permite cambiar si el jugador aún no ha sido aprobado por el creador
                if (!isLockedOther && onSelectFaction) {
                  onSelectFaction(faction.id);
                }
              }}
              className={`relative flex flex-col backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${
                isLockedOther
                  ? 'bg-[#0a0c0e]/95 border-red-950/40 opacity-25 grayscale cursor-not-allowed select-none pointer-events-none shadow-none'
                  : isSelected
                  ? `${faction.selectedStyle} scale-[1.02] shadow-2xl cursor-pointer`
                  : `bg-gradient-to-b from-[#161616]/95 to-[#121212]/95 border-zinc-800/80 ${faction.hoverGlow} hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] cursor-pointer group`
              }`}
            >
              {/* Imagen Miniatura */}
              <div className="relative w-full h-44 overflow-hidden bg-zinc-950">
                <img
                  src={faction.image}
                  alt={faction.name}
                  className={`w-full h-full object-cover ${faction.imagePosition || 'object-[center_30%]'} ${
                    isLockedOther ? '' : 'group-hover:scale-108 group-hover:brightness-110 transition-all duration-500'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-90" />
                
                {/* Indicador táctico en la esquina superior derecha */}
                <div className="absolute top-2.5 right-2.5 z-20">
                  {isLockedOther ? (
                    <span className="px-2.5 py-0.5 rounded-full border border-red-500/60 bg-red-950/90 text-[9px] font-mono text-red-300 flex items-center gap-1 shadow backdrop-blur-sm">
                      <Lock className="w-2.5 h-2.5 text-red-400" />
                      BLOQUEADA
                    </span>
                  ) : isApprovedThis ? (
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono backdrop-blur-sm shadow flex items-center gap-1 ${faction.activeBadge}`}>
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      TU FACCIÓN
                    </span>
                  ) : isSelected ? (
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono backdrop-blur-sm shadow flex items-center gap-1 ${faction.activeBadge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${faction.activeDot} animate-pulse`} />
                      SELECCIONADA
                    </span>
                  ) : (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2 py-0.5 rounded-full bg-black/80 border border-zinc-600 text-[9px] font-mono text-white backdrop-blur-sm shadow">
                      SELECCIONAR ↵
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-4 flex flex-col flex-1 justify-between -mt-3 relative z-10">
                <div>
                  {/* Tag identificador */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold backdrop-blur-sm bg-black/70 ${
                      isLockedOther ? 'border-zinc-700 text-zinc-500' : faction.accentColor
                    }`}>
                      {faction.tag}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold tracking-wider mb-2 uppercase transition-colors ${
                    isLockedOther ? 'text-zinc-500' : 'text-zinc-200 group-hover:text-white'
                  }`}>
                    {faction.name}
                  </h3>
                  <p className={`text-[11px] leading-tight uppercase font-mono line-clamp-3 transition-colors ${
                    isLockedOther ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-300'
                  }`}>
                    {faction.description}
                  </p>
                </div>

                {/* Barra de Capacidad */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-zinc-500" />
                      CAPACITY
                    </span>
                    <span className="font-bold text-zinc-300">{faction.current}/{faction.max}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-[1px]">
                    <div
                      className={`h-full ${isLockedOther ? 'bg-zinc-700' : faction.barFill} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Banner de condición */}
                {isLockedOther && (
                  <div className="mt-3 p-2 bg-red-950/70 border border-red-500/50 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md">
                    <Lock className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-mono text-red-200 font-bold tracking-tight">
                      por esta demo solo puedes elegir una facción
                    </span>
                  </div>
                )}

                {isApprovedThis && (
                  <div className="mt-3 p-2 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md">
                    <span className="text-[10px] font-mono text-emerald-300 font-bold tracking-tight">
                      ✓ ACCESO CONCEDIDO POR EL CREADOR
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Campo para Personalizar el Nombre del Superviviente */}
      <div className="w-full max-w-md mb-6 flex flex-col items-center">
        <label className="text-xs font-mono uppercase text-zinc-300 mb-2 flex items-center gap-1.5 font-bold tracking-wider">
          <User className="w-3.5 h-3.5 text-amber-500" />
          <span>NOMBRE DE TU SUPERVIVIENTE:</span>
        </label>
        <div className="relative w-full">
          <input
            type="text"
            value={survivorName || ''}
            onChange={(e) => onSurvivorNameChange && onSurvivorNameChange(e.target.value.replace(/[^a-zA-Z0-9_\-\s]/g, '').slice(0, 20))}
            placeholder={`Superviviente_${currentFaction?.tag}`}
            className="w-full px-5 py-3.5 bg-[#121214] hover:bg-[#161619] focus:bg-[#18181c] border border-zinc-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-zinc-100 font-mono text-sm text-center font-bold tracking-wider outline-none transition-all shadow-inner placeholder:text-zinc-600"
          />
        </div>
        <p className="text-[10px] text-zinc-400 font-mono mt-1.5 text-center">
          Tu alias visible en el servidor. Si se deja en blanco, se usará el tag por defecto.
        </p>
      </div>

      {/* Botón Principal de Lanzamiento / Actualización */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {updateInfo?.updateRequired ? (
          <button
            onClick={onUpdateLauncher}
            className="flex items-center justify-center gap-2 px-10 py-4 font-black text-sm tracking-widest uppercase transition-all rounded-xl cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_35px_rgba(6,182,212,0.65)] hover:scale-[1.02] active:scale-[0.99] animate-pulse"
            title="Nueva versión requerida del launcher antes de iniciar"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>ACTUALIZAR LAUNCHER // v{updateInfo.latestVersion || 'NUEVA'}</span>
          </button>
        ) : (
          <button
            onClick={onLaunchGame}
            className={`flex items-center justify-center gap-2 px-10 py-4 font-black text-sm tracking-widest uppercase transition-all rounded-xl cursor-pointer ${
              approvedFaction
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.99]'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_40px_rgba(245,158,11,0.65)] hover:scale-[1.02] active:scale-[0.99]'
            }`}
          >
            {approvedFaction ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>EJECUTAR JUEGO (BUILD 42) // {currentFaction?.tag}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>INICIAR SUPERVIVENCIA // {currentFaction?.tag}</span>
              </>
            )}
          </button>
        )}

        {approvedFaction ? (
          <button
            onClick={onResetFaction}
            className="px-5 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/70 text-zinc-400 hover:text-amber-400 text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            title="Eliminar personaje actual y desbloquear la selección para elegir otra facción"
          >
            [ ↻ REINICIAR PERSONAJE ]
          </button>
        ) : (
          <button
            onClick={onResetFaction}
            className="px-4 py-4 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            title="Limpiar personaje y seleccionar facción"
          >
            [ ↻ REINICIAR PERSONAJE ]
          </button>
        )}
      </div>
    </motion.div>
  );
}
