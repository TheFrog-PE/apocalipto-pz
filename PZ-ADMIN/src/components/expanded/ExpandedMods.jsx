import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  ExternalLink, 
  Power, 
  RefreshCw, 
  Download, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  HardDrive,
  Users,
  Tag,
  Filter,
  Check,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowUpCircle,
  Flame,
  Plus,
  Trash2,
  MoveLeft,
  GripVertical
} from 'lucide-react';

export default function ExpandedMods({ onBack, onTriggerAlert }) {
  const [enjambreMods, setEnjambreMods] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEnjambre, setSearchEnjambre] = useState('');
  const [searchCatalog, setSearchCatalog] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [actionTargetId, setActionTargetId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [isDragOverEnjambre, setIsDragOverEnjambre] = useState(false);

  const fetchMods = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:19842/api/admin/mods');
      if (res.ok) {
        const data = await res.json();
        if (data.enjambreMods) setEnjambreMods(data.enjambreMods);
        if (data.catalog) setCatalog(data.catalog);
      }
    } catch (err) {
      console.error('Error fetching mods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMods();
  }, []);

  useEffect(() => {
    if (!autoUpdateEnabled) return;
    const interval = setInterval(() => {
      fetchMods();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoUpdateEnabled]);

  const handleRemoveFromEnjambre = async (mod) => {
    setActionTargetId(mod.workshopId);
    try {
      const res = await fetch('http://localhost:19842/api/admin/mods/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: mod.workshopId,
          modId: mod.modId,
          enabled: false
        })
      });

      if (res.ok) {
        if (onTriggerAlert) {
          onTriggerAlert(`MOD "${mod.title || mod.modId}" REMOVIDO DEL ENJAMBRE.`);
        }
        await fetchMods();
      }
    } catch (err) {
      if (onTriggerAlert) onTriggerAlert(`Error: ${err.message}`);
    } finally {
      setActionTargetId(null);
    }
  };

  const handleAddToEnjambre = async (workshopId) => {
    const targetId = String(workshopId || manualInput).trim();
    if (!targetId) return;

    setIsInstalling(true);
    setActionTargetId(targetId);

    try {
      if (onTriggerAlert) onTriggerAlert(`DESCARGANDO E INSTALANDO ITEM DE STEAM WORKSHOP (${targetId})...`);
      const res = await fetch('http://localhost:19842/api/admin/mods/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId: targetId })
      });
      const data = await res.json();
      if (data.success) {
        setManualInput('');
        if (onTriggerAlert) onTriggerAlert(`✓ MOD "${data.title || data.modId}" AGREGADO CON ÉXITO AL ENJAMBRE.`);
        await fetchMods();
      } else {
        if (onTriggerAlert) onTriggerAlert(`ERROR: ${data.message || data.error}`);
      }
    } catch (err) {
      if (onTriggerAlert) onTriggerAlert(`Error: ${err.message}`);
    } finally {
      setIsInstalling(false);
      setActionTargetId(null);
    }
  };

  const handleUpdateSingle = async (workshopId, title) => {
    setUpdatingId(workshopId);
    try {
      if (onTriggerAlert) onTriggerAlert(`DESCARGANDO PARCHE DE STEAM: ${title || workshopId}...`);
      const res = await fetch('http://localhost:19842/api/admin/mods/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId })
      });
      const data = await res.json();
      if (data.success) {
        if (onTriggerAlert) onTriggerAlert(`✓ MOD ${title || workshopId} ACTUALIZADO CON ÉXITO.`);
        await fetchMods();
      } else {
        if (onTriggerAlert) onTriggerAlert(`ERROR: ${data.message || data.error}`);
      }
    } catch (err) {
      if (onTriggerAlert) onTriggerAlert(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateAll = async () => {
    const outdated = enjambreMods.filter(m => m.hasUpdate);
    if (outdated.length === 0) {
      if (onTriggerAlert) onTriggerAlert('TODOS LOS MODS DEL ENJAMBRE ESTÁN AL DÍA.');
      return;
    }

    setIsUpdatingAll(true);
    if (onTriggerAlert) onTriggerAlert(`ACTUALIZANDO ${outdated.length} MODS DEL ENJAMBRE...`);

    for (const mod of outdated) {
      try {
        await fetch('http://localhost:19842/api/admin/mods/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workshopId: mod.workshopId })
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (onTriggerAlert) onTriggerAlert(`✓ ACTUALIZACIÓN COMPLETA PARA EL ENJAMBRE.`);
    await fetchMods();
    setIsUpdatingAll(false);
  };

  const filteredEnjambre = enjambreMods.filter(m => 
    (m.title && m.title.toLowerCase().includes(searchEnjambre.toLowerCase())) ||
    (m.modId && m.modId.toLowerCase().includes(searchEnjambre.toLowerCase())) ||
    (m.workshopId && m.workshopId.includes(searchEnjambre))
  );

  const filteredCatalog = catalog.filter(m => 
    (m.title && m.title.toLowerCase().includes(searchCatalog.toLowerCase())) ||
    (m.workshopId && m.workshopId.includes(searchCatalog)) ||
    (m.tags && m.tags.some(t => t.toLowerCase().includes(searchCatalog.toLowerCase())))
  );

  const updatesCount = enjambreMods.filter(m => m.hasUpdate).length;
  const enjambreSizeMB = (enjambreMods.reduce((acc, m) => acc + (m.fileSize || 0), 0) / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none">
      
      {/* ── HEADER SUPERIOR ── */}
      <div className="bg-[#121418]/95 border border-zinc-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        
        {/* Título y Navegación */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bold text-[11px] uppercase tracking-wider">DASHBOARD</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider text-zinc-100 uppercase">
                  ARSENAL DE MODS // ENJAMBRE P2P & STEAM WORKSHOP
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[9px]">
                  {enjambreMods.length} ACTIVOS EN RED
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                Columna Izquierda: Mods dentro del Enjambre • Columna Derecha: Catálogo y Tienda de Steam
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Métricas Globales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          <div className="px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center gap-2 shadow-sm">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-[9px] text-zinc-400 block uppercase leading-none font-bold">CARGA ENJAMBRE</span>
              <span className="text-xs font-black text-zinc-200 font-mono">{enjambreSizeMB} MB</span>
            </div>
          </div>

          <button
            onClick={() => {
              setAutoUpdateEnabled(!autoUpdateEnabled);
              if (onTriggerAlert) {
                onTriggerAlert(!autoUpdateEnabled ? "AUTO-SYNC DE STEAM ACTIVADO (60s)" : "AUTO-SYNC PAUSADO");
              }
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider ${
              autoUpdateEnabled
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Verifica y actualiza automáticamente los mods si los creadores suben cambios en Steam"
          >
            <RefreshCw className={`w-3 h-3 ${autoUpdateEnabled ? 'animate-spin text-cyan-400' : ''}`} />
            <span>AUTO-SYNC STEAM: {autoUpdateEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {updatesCount > 0 ? (
            <button
              onClick={handleUpdateAll}
              disabled={isUpdatingAll}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flame className={`w-3.5 h-3.5 ${isUpdatingAll ? 'animate-bounce' : ''}`} />
              <span>{isUpdatingAll ? 'ACTUALIZANDO...' : `ACTUALIZAR TODOS (${updatesCount})`}</span>
            </button>
          ) : (
            <button
              onClick={fetchMods}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>COMPROBAR STEAM</span>
            </button>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── DOS COLUMNAS LADO A LADO: ENJAMBRE (IZQ) vs STEAM WORKSHOP (DER) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* COLUMNA 1 (IZQUIERDA): MODS ACTIVOS EN EL ENJAMBRE                 */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <section 
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOverEnjambre(true);
          }}
          onDragLeave={() => setIsDragOverEnjambre(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOverEnjambre(false);
            const wId = e.dataTransfer.getData('text/plain');
            if (wId) handleAddToEnjambre(wId);
          }}
          className={`bg-[#0f1115]/95 border rounded-2xl p-4 shadow-xl transition-all flex flex-col gap-3 min-h-[620px] ${
            isDragOverEnjambre 
              ? 'border-emerald-400 ring-2 ring-emerald-500/50 bg-emerald-950/25' 
              : 'border-emerald-500/40'
          }`}
        >
          
          {/* Header de la Columna 1 */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <div>
                <h2 className="text-xs font-black tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                  FILA 1: MODS ACTIVOS EN EL ENJAMBRE
                </h2>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  Simulación compartida ApocaliptoPZ.ini ({enjambreMods.length} oficiales)
                </span>
              </div>
            </div>

            {/* Buscador dentro del Enjambre */}
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filtrar enjambre..."
                value={searchEnjambre}
                onChange={(e) => setSearchEnjambre(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg text-zinc-200 placeholder-zinc-500 outline-none text-[11px]"
              />
            </div>
          </div>

          {/* Banner Zona Drag & Drop */}
          <div className="px-3 py-2 bg-emerald-950/30 border border-emerald-500/25 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoveLeft className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Arrastra mods de Steam aquí para sumarlos al Enjambre</span>
            </div>
            <span className="font-bold text-zinc-400 font-mono text-[10px]">DPoH MESH</span>
          </div>

          {/* Lista de Mods del Enjambre */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] uppercase font-bold">Sincronizando Enjambre...</span>
            </div>
          ) : filteredEnjambre.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-900 flex flex-col items-center gap-2">
              <Package className="w-8 h-8 text-zinc-600" />
              <span>No hay mods que coincidan con la búsqueda.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredEnjambre.map((mod) => {
                const isTarget = actionTargetId === mod.workshopId;
                const isUpdating = updatingId === mod.workshopId;
                const sizeMB = (mod.fileSize / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={mod.workshopId}
                    className={`bg-[#13161c] border rounded-xl p-3 flex flex-col gap-2.5 transition-all shadow-sm ${
                      mod.hasUpdate 
                        ? 'border-amber-500/80 ring-1 ring-amber-500/50 bg-gradient-to-r from-amber-950/15 to-[#13161c]' 
                        : 'border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-r from-emerald-950/15 to-[#13161c]'
                    }`}
                  >
                    {/* Fila Superior: Miniatura + Título Completo + Enlace */}
                    <div className="flex items-start gap-3">
                      
                      {/* Miniatura Cuadrada en Proporción Original */}
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-black/95 border border-zinc-800 flex items-center justify-center p-0.5 relative shadow-inner">
                        {mod.previewUrl ? (
                          <img
                            src={mod.previewUrl}
                            alt={mod.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Package className="w-7 h-7 text-zinc-600" />
                        )}

                        {mod.hasUpdate && (
                          <span 
                            className="absolute top-1 left-1 px-1 py-0.2 bg-amber-500 text-black font-black text-[7px] rounded uppercase shadow flex items-center gap-0.5 animate-pulse"
                            title="Hay un nuevo parche publicado en Steam Workshop"
                          >
                            <Flame className="w-2 h-2" />
                            PARCHE
                          </span>
                        )}

                        <span className="absolute bottom-1 right-1 px-1 py-0.2 text-[8px] font-black rounded bg-emerald-500 text-black">
                          ON
                        </span>
                      </div>

                      {/* Título y Badges Legibles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 
                            className="font-bold text-xs text-zinc-100 hover:text-emerald-300 transition-colors leading-snug line-clamp-1"
                            title={mod.title}
                          >
                            {mod.title}
                          </h3>
                          <a
                            href={mod.workshopUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-400 hover:text-cyan-400 shrink-0 p-1 transition-colors"
                            title="Ver en Steam Workshop"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Fila de Badges: ID de Steam, Mod ID, tamaño */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700/80 text-zinc-200 font-mono text-[10px] rounded font-bold">
                            Steam ID: {mod.workshopId}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] rounded font-bold truncate max-w-[170px]" title={mod.modId}>
                            {mod.modId}
                          </span>
                          {sizeMB > 0 && (
                            <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-400 font-mono text-[10px] rounded">
                              {sizeMB} MB
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Fila Inferior: Botones de Acción */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-0.5">
                      {mod.hasUpdate ? (
                        <button
                          onClick={() => handleUpdateSingle(mod.workshopId, mod.title)}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/70 text-amber-300 font-black text-[10px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(245,158,11,0.25)] disabled:opacity-50"
                          title="Descargar parche y actualizar archivos locales"
                        >
                          <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                          <span>{isUpdating ? 'PARCHEANDO...' : 'ACTUALIZAR PARCHE'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Sincronizado en Enjambre</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleRemoveFromEnjambre(mod)}
                        disabled={isTarget}
                        className="px-3 py-1 bg-red-950/50 hover:bg-red-900 border border-red-800/70 text-red-200 hover:text-white font-bold text-[10px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                        title="Remover de ApocaliptoPZ.ini"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>{isTarget ? 'REMOVIENDO...' : 'QUITAR DEL ENJAMBRE'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </section>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* COLUMNA 2 (DERECHA): WORKSHOP DE STEAM // TIENDA & DESCUBRIMIENTO  */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <section className="bg-[#0f1115]/95 border border-cyan-500/40 rounded-2xl p-4 shadow-xl flex flex-col gap-3 min-h-[620px]">
          
          {/* Header de la Columna 2 */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wider text-cyan-300 uppercase flex items-center gap-2">
                  FILA 2: TIENDA & WORKSHOP DE STEAM
                </h2>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  Catálogo disponible para sumar al servidor ({catalog.length} mods)
                </span>
              </div>
            </div>

            {/* Buscador dentro del Catálogo */}
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar en catálogo..."
                value={searchCatalog}
                onChange={(e) => setSearchCatalog(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-lg text-zinc-200 placeholder-zinc-500 outline-none text-[11px]"
              />
            </div>
          </div>

          {/* Barra de Instalación Manual Directa */}
          <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            <input
              type="text"
              placeholder="Pegar Enlace o ID de Steam Workshop (ej. 2169435993)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddToEnjambre(manualInput)}
              className="flex-1 bg-transparent px-2 py-1 text-zinc-200 placeholder-zinc-500 outline-none text-[11px]"
            />
            <button
              onClick={() => handleAddToEnjambre(manualInput)}
              disabled={isInstalling || !manualInput.trim()}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] tracking-wider uppercase rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isInstalling ? 'animate-bounce' : ''}`} />
              <span>{isInstalling ? 'SUMANDO...' : '+ AGREGAR'}</span>
            </button>
          </div>

          {/* Lista de Mods del Catálogo Steam (Draggables) */}
          {filteredCatalog.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-900 flex flex-col items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-zinc-600" />
              <span>No se encontraron mods adicionales. Pega cualquier ID de Steam arriba.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const isItemAction = isInstalling && actionTargetId === item.workshopId;
                const sizeMB = (item.fileSize / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={item.workshopId}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.workshopId);
                    }}
                    className="bg-[#13161c] border border-zinc-800/90 hover:border-cyan-500/70 rounded-xl p-3 flex flex-col gap-2.5 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:bg-zinc-900/50 group"
                    title="Arrastra este mod hacia la columna izquierda o haz clic en '+ AGREGAR AL ENJAMBRE'"
                  >
                    {/* Fila Superior: Grip + Miniatura + Título + Enlace */}
                    <div className="flex items-start gap-3">
                      
                      {/* Indicador de Arrastre Grip */}
                      <div className="text-zinc-600 group-hover:text-cyan-400 transition-colors pt-4">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Miniatura Cuadrada en Proporción Original */}
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-black/95 border border-zinc-800 flex items-center justify-center p-0.5 relative shadow-inner">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Package className="w-7 h-7 text-zinc-600" />
                        )}
                      </div>

                      {/* Título y Badges Legibles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 
                            className="font-bold text-xs text-zinc-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-1"
                            title={item.title}
                          >
                            {item.title}
                          </h3>
                          <a
                            href={item.workshopUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-400 hover:text-cyan-400 shrink-0 p-1 transition-colors"
                            title="Ver en Steam Workshop"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Fila de Badges */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700/80 text-zinc-200 font-mono text-[10px] rounded font-bold">
                            Steam ID: {item.workshopId}
                          </span>
                          {item.modId && (
                            <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono text-[10px] rounded font-semibold truncate max-w-[150px]">
                              {item.modId}
                            </span>
                          )}
                          {item.subscriptions > 0 && (
                            <span className="px-1.5 py-0.5 bg-zinc-950 text-amber-400 font-mono text-[10px] rounded">
                              {(item.subscriptions / 1000).toFixed(0)}k subs
                            </span>
                          )}
                          {sizeMB > 0 && (
                            <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-400 font-mono text-[10px] rounded">
                              {sizeMB} MB
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Fila Inferior: Botón de Agregar al Enjambre */}
                    <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80 mt-0.5">
                      <button
                        onClick={() => handleAddToEnjambre(item.workshopId)}
                        disabled={isInstalling}
                        className="px-3.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-300 hover:text-white font-bold text-[10px] tracking-wider uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isItemAction ? 'DESCARGANDO...' : '+ AGREGAR AL ENJAMBRE'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </section>

      </div>

    </div>
  );
}
