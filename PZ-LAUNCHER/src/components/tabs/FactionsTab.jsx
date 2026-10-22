import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, Users, Play, User, Zap, MapPin, 
  Trash2, UserPlus, Check, AlertTriangle, Clock 
} from 'lucide-react';

export default function FactionsTab({ 
  factions, 
  chosenFaction,
  selectedFaction, 
  approvedFaction, 
  survivorName,
  onSurvivorNameChange,
  onSelectFaction, 
  onResetFaction, 
  onLaunchGame,
  updateInfo,
  onUpdateLauncher,
  perfMode = true,
  onTogglePerfMode,
  savedCharacters = [],
  onSelectCharacter,
  onDeleteCharacter,
  onStartNewCharacter
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const activeLock = (chosenFaction || approvedFaction || selectedFaction || '').toLowerCase() || null;
  const currentFaction = factions.find(f => f.id === activeLock) || factions[0];

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
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-5xl font-black tracking-wider uppercase text-zinc-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          ASÍ ES COMO MORISTE
        </h2>
        <div className="w-24 h-1 bg-red-700 rounded-full mx-auto my-2.5 shadow-[0_0_10px_rgba(185,28,28,0.9)]" />
        <p className="text-xs md:text-sm text-zinc-300 font-light tracking-wide font-mono drop-shadow">
          14 días después de la infección, todo empeoró
        </p>
      </div>

      {/* Contenedor Principal: 2 Columnas (Izquierda: Facciones + Config | Derecha: Panel Vertical de Slots) */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-6">

        {/* ── COLUMNA IZQUIERDA: FACCIONES, CONFIGURACIÓN Y BOTÓN DE INICIO ── */}
        <div className="flex-1 w-full flex flex-col items-center">
          {/* Grid de las 4 Facciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full mb-6">
            {factions.map((faction) => {
              const isSelected = activeLock === faction.id;
              const isLockedOther = Boolean(activeLock && activeLock !== faction.id);
              const percentage = Math.min(100, (faction.current / faction.max) * 100);

              return (
                <div
                  key={faction.id}
                  onClick={() => {
                    if (onSelectFaction) {
                      onSelectFaction(faction.id);
                    }
                  }}
                  className={`relative flex flex-col backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${
                    isLockedOther
                      ? 'opacity-30 grayscale border-zinc-900 bg-zinc-950/70 cursor-not-allowed select-none'
                      : isSelected
                        ? `${faction.selectedStyle} scale-[1.02] shadow-2xl ring-2 ring-emerald-500/50 cursor-pointer`
                        : `bg-gradient-to-b from-[#161616]/95 to-[#121212]/95 border-zinc-800/80 ${faction.hoverGlow} hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] group cursor-pointer`
                  }`}
                >
                  {/* Imagen Miniatura */}
                  <div className="relative w-full h-36 overflow-hidden bg-zinc-950">
                    <img
                      src={faction.image}
                      alt={faction.name}
                      className={`w-full h-full object-cover ${faction.imagePosition || 'object-[center_30%]'} ${isLockedOther ? 'brightness-50' : 'group-hover:scale-108 group-hover:brightness-110'} transition-all duration-500`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-90" />
                    
                    {/* Indicador táctico en la esquina superior derecha */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      {isLockedOther ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900/95 border border-zinc-800 text-[9px] font-mono text-zinc-500 backdrop-blur-sm shadow flex items-center gap-1">
                          <span>🔒</span> BLOQUEADA
                        </span>
                      ) : isSelected ? (
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono backdrop-blur-sm shadow flex items-center gap-1 ${faction.activeBadge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${faction.activeDot} animate-pulse`} />
                          SELECCIONADA
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2 py-0.5 rounded-full bg-black/80 border border-zinc-600 text-[9px] font-mono text-white backdrop-blur-sm shadow">
                          ELEGIR ↵
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between -mt-3 relative z-10">
                    <div>
                      {/* Tag identificador */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold backdrop-blur-sm ${isLockedOther ? 'bg-zinc-900/80 text-zinc-600 border-zinc-800' : `bg-black/70 ${faction.accentColor}`}`}>
                          {faction.tag}
                        </span>
                      </div>

                      <h3 className={`text-[11px] font-bold tracking-wider mb-1.5 uppercase transition-colors truncate ${isLockedOther ? 'text-zinc-600' : 'text-zinc-200 group-hover:text-white'}`}>
                        {faction.name}
                      </h3>

                      {faction.spawnLocation && (
                        <div className={`flex items-center gap-1 mb-2 px-2 py-0.5 rounded bg-black/60 border text-[9px] font-mono ${isLockedOther ? 'border-zinc-900 text-zinc-600' : 'border-zinc-800 text-zinc-200'}`}>
                          <MapPin className={`w-3 h-3 shrink-0 ${isLockedOther ? 'text-zinc-600' : 'text-red-400'}`} />
                          <span className="text-zinc-500 font-bold">SPAWN:</span>
                          <span className="font-semibold truncate">
                            {faction.spawnLocation.split('(')[0].trim()}
                          </span>
                        </div>
                      )}

                      <p className={`text-[10px] leading-tight uppercase font-mono line-clamp-2 transition-colors ${isLockedOther ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                        {faction.description}
                      </p>
                    </div>

                    {/* Barra de Capacidad */}
                    <div className="mt-3 pt-2 border-t border-zinc-800/80">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-zinc-500" />
                          CAPACIDAD
                        </span>
                        <span className={`font-bold ${isLockedOther ? 'text-zinc-600' : 'text-zinc-300'}`}>{faction.current}/{faction.max}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-[1px]">
                        <div
                          className={`h-full ${isLockedOther ? 'bg-zinc-700' : (faction.barFill || 'bg-emerald-500')} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campo para Personalizar el Nombre del Superviviente */}
          <div className="w-full max-w-md mb-4 flex flex-col items-center">
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
                className="w-full px-5 py-3 bg-[#121214] hover:bg-[#161619] focus:bg-[#18181c] border border-zinc-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-zinc-100 font-mono text-sm text-center font-bold tracking-wider outline-none transition-all shadow-inner placeholder:text-zinc-600"
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-1 text-center">
              Tu alias visible en el servidor. Si se deja en blanco, se usará el tag por defecto.
            </p>

            {savedCharacters.length >= 4 && !savedCharacters.some(c => c.username.toLowerCase() === (survivorName || '').toLowerCase().trim()) && (
              <div className="mt-2.5 p-2 bg-red-950/60 border border-red-500/60 rounded-xl text-center flex items-center justify-center gap-1.5 shadow">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[10px] font-mono text-red-300 font-bold tracking-tight">
                  LÍMITE ALCANZADO (4/4): Selecciona uno de tus supervivientes del panel derecho o elimina uno para crear uno nuevo.
                </span>
              </div>
            )}
          </div>

          {/* Indicador de Zona de Aparición de la Facción seleccionada */}
          {currentFaction?.spawnLocation && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-black/70 border border-zinc-800 rounded-full font-mono text-xs shadow-inner mb-4">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-zinc-500 font-bold uppercase tracking-wider">SPAWN FORZADO:</span>
              <span className="text-emerald-400 font-bold tracking-wide">{currentFaction.spawnLocation}</span>
            </div>
          )}

          {/* Botones de Lanzamiento y Reinicio / Eliminación */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            {updateInfo?.updateRequired ? (
              <button
                onClick={onUpdateLauncher}
                className="flex items-center justify-center gap-2 px-10 py-4 font-black text-sm tracking-widest uppercase transition-all rounded-xl cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_35px_rgba(6,182,212,0.65)] hover:scale-[1.02] active:scale-[0.99] animate-pulse"
                title="Nueva versión requerida del launcher antes de iniciar"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>ACTUALIZAR LAUNCHER // v{updateInfo.latestVersion || 'NUEVA'}</span>
              </button>
            ) : activeLock ? (
              <>
                <button
                  onClick={onLaunchGame}
                  className={`flex items-center justify-center gap-2 px-8 py-3.5 font-black text-sm tracking-widest uppercase transition-all rounded-xl cursor-pointer ${
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

                <button
                  onClick={onResetFaction}
                  className="px-4 py-3.5 bg-zinc-900 hover:bg-red-950/80 border border-zinc-700 hover:border-red-600/70 text-zinc-400 hover:text-red-400 text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  title="Eliminar este personaje del slot y de Project Zomboid para liberar la facción"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>[ ↻ ELIMINAR / REINICIAR ]</span>
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-10 py-3.5 font-black text-sm tracking-widest uppercase rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-500 cursor-not-allowed select-none"
              >
                <span>ELIGE UNA FACCIÓN PARA COMENZAR</span>
              </button>
            )}
          </div>

          {/* Switch de Modo Rendimiento */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onTogglePerfMode}
              className={`group flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer font-mono text-xs select-none shadow-md ${
                perfMode
                  ? 'bg-emerald-950/70 border-emerald-500/80 hover:border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.99]'
                  : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 hover:scale-[1.02] active:scale-[0.99]'
              }`}
              title="Optimización gráfica automática para Project Zomboid"
            >
              <div className="flex items-center gap-2 font-bold tracking-wider text-[11px]">
                <Zap className={`w-3.5 h-3.5 ${perfMode ? 'text-[#e6fb04] fill-[#e6fb04] animate-pulse' : 'text-zinc-500'}`} />
                <span>MODO RENDIMIENTO:</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider ${
                  perfMode ? 'bg-emerald-500 text-black shadow-sm' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {perfMode ? 'ACTIVADO' : 'DESACTIVADO'}
                </span>
              </div>

              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                perfMode ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
              }`}>
                <span className="w-3 h-3 rounded-full bg-black shadow-md transform transition-transform" />
              </div>
            </button>

            <span className="text-[9px] text-zinc-400 font-mono tracking-tight">
              {perfMode
                ? '⚡ Sangre OFF • Items en suelo 2D • Niebla fluida (Máximo FPS)'
                : 'Estándar PZ • Objetos 3D y sangre original'}
            </span>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: PANEL VERTICAL DE SLOTS DE SUPERVIVIENTES ── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-[#0c0c0e]/95 border border-zinc-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col">
          {/* Encabezado del Dock Vertical */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-amber-500">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase font-black tracking-wider text-zinc-100">
                  SLOTS DE SUPERVIVIENTE
                </h3>
                <p className="text-[9px] text-zinc-500 font-mono">
                  Project Zomboid B42
                </p>
              </div>
            </div>

            {/* Contador de Slots */}
            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-black tracking-wider border ${
              savedCharacters.length >= 4
                ? 'bg-red-950/80 border-red-500/70 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
            }`}>
              {savedCharacters.length} / 4
            </span>
          </div>

          <p className="text-[9px] text-zinc-400 font-mono mb-3 leading-tight">
            Haz clic en un slot para activar a ese personaje o elige un slot libre para crear uno en otra facción.
          </p>

          {/* Lista Vertical de los 4 Slots */}
          <div className="flex flex-col gap-2.5 flex-1">
            {[0, 1, 2, 3].map((slotIdx) => {
              const char = savedCharacters[slotIdx];
              if (char) {
                const isCurrentActive = survivorName && survivorName.trim().toLowerCase() === char.username.toLowerCase();
                const factionObj = factions.find(f => f.id === char.factionId) || factions[0];
                const isDeleting = deleteTarget === char.username;

                return (
                  <div
                    key={char.username || slotIdx}
                    className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-200 ${
                      isCurrentActive
                        ? 'bg-gradient-to-b from-[#18181c] to-[#121214] border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/60'
                        : 'bg-[#121214]/90 border-zinc-800 hover:border-zinc-700 hover:bg-[#151518]'
                    }`}
                  >
                    {/* Top Bar: Slot & Faction badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500">
                        SLOT 0{slotIdx + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${factionObj?.activeBadge || 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                        {factionObj?.tag || char.factionTag}
                      </span>
                    </div>

                    {/* Character Info */}
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCurrentActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                        <h4 className="text-xs font-mono font-black text-zinc-100 truncate" title={char.username}>
                          {char.username}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-zinc-500" />
                          {char.time_played > 0 ? `${char.time_played} min` : 'Recién creado'}
                        </span>
                        {char.last_logon && (
                          <span className="truncate text-zinc-500" title={char.last_logon}>
                            • {char.last_logon.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions / Delete Confirm */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-red-900/60 bg-red-950/40 p-1.5 rounded-lg">
                        <span className="text-[9px] font-mono font-bold text-red-300 flex-1 truncate">
                          ¿BORRAR DEL JUEGO?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCharacter && onDeleteCharacter(char.username);
                            setDeleteTarget(null);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-mono text-[9px] font-bold uppercase transition-all shadow cursor-pointer"
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(null)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-[9px] font-bold uppercase transition-all cursor-pointer"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-auto pt-1.5 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => onSelectCharacter && onSelectCharacter(char)}
                          className={`flex-1 py-1 px-2 rounded-lg font-mono text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isCurrentActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-500 active:scale-95'
                          }`}
                        >
                          {isCurrentActive ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>EN USO</span>
                            </>
                          ) : (
                            <span>SELECCIONAR</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(char.username)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/80 border border-zinc-800 hover:border-red-600/60 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                          title="Eliminar este superviviente del juego y liberar este slot"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // Slot Vacío o Botón de Creación
              const isNextAvailableSlot = slotIdx === savedCharacters.length;
              return (
                <div
                  key={slotIdx}
                  onClick={() => {
                    if (isNextAvailableSlot && onStartNewCharacter) {
                      onStartNewCharacter();
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border border-dashed transition-all duration-200 min-h-[72px] ${
                    isNextAvailableSlot
                      ? 'border-amber-500/50 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-400 text-amber-400/90 cursor-pointer group shadow-sm hover:scale-[1.01]'
                      : 'border-zinc-800/60 bg-zinc-950/30 text-zinc-600 cursor-not-allowed select-none'
                  }`}
                >
                  {isNextAvailableSlot ? (
                    <>
                      <div className="flex items-center gap-1.5 text-amber-300 group-hover:scale-105 transition-all">
                        <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                          + CREAR EN ESTE SLOT
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 mt-0.5">
                        Slot 0{slotIdx + 1} libre (elige facción)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-600 uppercase">
                        SLOT 0{slotIdx + 1} // VACÍO
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
