import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Minimize2, 
  Trash2, 
  Search, 
  Sliders, 
  Lock, 
  ArrowDown, 
  Zap, 
  Radio, 
  Send 
} from 'lucide-react';
import { MACROS } from '../../data/adminData';

export default function ExpandedChat({
  messages,
  chatFilter,
  setChatFilter,
  searchQuery,
  setSearchQuery,
  debouncedSearch,
  chatInput,
  setChatInput,
  chatIdentity,
  setChatIdentity,
  handleSendMessage,
  autoScroll,
  unreadCount,
  scrollToBottom,
  handleScrollDetect,
  chatScrollRef,
  inputRef,
  showMacroMenu,
  setShowMacroMenu,
  selectedMacroIdx,
  setSelectedMacroIdx,
  purgeStage,
  handlePurge,
  setExpandedModule,
  highlightText
}) {
  const filteredChatMessages = messages.filter(m => {
    const matchFilter = 
      chatFilter === 'TODOS' ? true :
      chatFilter === 'RADIO 91.4' ? m.channel.includes('RADIO') :
      chatFilter === 'LOCAL' ? m.channel.includes('LOCAL') :
      chatFilter === 'COMBATE / KILLS' ? m.channel.includes('COMBATE') || m.channel.includes('KILL') :
      chatFilter === 'LOGS RCON' ? m.channel.includes('LOGS') || m.channel.includes('SISTEMA') || m.channel.includes('RCON') : true;

    const matchSearch = debouncedSearch.trim() === '' ? true :
      m.text.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.author.toLowerCase().includes(debouncedSearch.toLowerCase());

    return matchFilter && matchSearch;
  });

  const handleChatInputChange = (e) => {
    const val = e.target.value;
    setChatInput(val);
    if (val.startsWith('!') || val.endsWith(' !') || val === '!') {
      setShowMacroMenu(true);
    } else if (showMacroMenu && !val.includes('!')) {
      setShowMacroMenu(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (showMacroMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMacroIdx((prev) => (prev + 1) % MACROS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMacroIdx((prev) => (prev - 1 + MACROS.length) % MACROS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setChatInput(`${MACROS[selectedMacroIdx].cmd} `);
        setShowMacroMenu(false);
        if (inputRef.current) inputRef.current.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMacroMenu(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 bg-[#131518]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl gap-3 relative font-mono text-xs">
      
      <div>
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="px-2.5 py-1 text-emerald-400 border border-emerald-500/40 bg-emerald-950/20 text-xs font-bold rounded-lg tracking-wider">
                [ MOD-01 // FRECUENCIA KNOX &amp; REGISTRO DE EVENTOS EN VIVO ]
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>EN DIRECTO • WEBSOCKET 12ms SYNC</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-md">
                MODO ENFOQUE ACTIVO
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Monitoreo, intercepción de radiofrecuencias, proximidad local, combate PVP y telemetría de nodos del Enjambre en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
              <span>[] BUFFER: 1,420 MSGS (FIFO AUTO)</span>
              <span>|</span>
              <button
                onClick={handlePurge}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  purgeStage === 1
                    ? 'bg-red-700 hover:bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border-zinc-800'
                }`}
              >
                <Trash2 className="w-3 h-3" />
                <span>{purgeStage === 1 ? '¿CONFIRMAR PURGA?' : '[ PURGAR BUFFER ]'}</span>
              </button>
            </div>

            <button 
              onClick={() => setExpandedModule(null)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 uppercase transition-all shadow cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>RESTAURAR CUADRÍCULA</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'TODOS', label: '[ TODOS ]', badge: '(ALL)' },
              { id: 'RADIO 91.4', label: '[ RADIO 91.4 ]', badge: '+4' },
              { id: 'LOCAL', label: '[ LOCAL ]', badge: '+12' },
              { id: 'COMBATE / KILLS', label: '[ COMBATE / KILLS ]', badge: '+2' },
              { id: 'LOGS RCON', label: '[ LOGS RCON ]', badge: 'SYS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChatFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 border transition-all cursor-pointer ${
                  chatFilter === tab.id
                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                  chatFilter === tab.id ? 'bg-black/20 text-black' : 'text-zinc-500'
                }`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex items-center min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3" />
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171a1e] border border-zinc-800 rounded-lg pl-9 pr-16 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <span className="text-[9px] text-zinc-600 font-mono">[CTRL+F]</span>
              <Sliders className="w-3 h-3 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-[#101214] border border-zinc-800/90 rounded-xl p-4 overflow-hidden flex flex-col justify-between shadow-inner">
        <div 
          ref={chatScrollRef}
          onScroll={handleScrollDetect}
          className="flex-1 overflow-y-auto space-y-2 pr-2"
          style={{ maxHeight: '420px' }}
        >
          {filteredChatMessages.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs font-mono">
              No se encontraron transmisiones para los filtros actuales.
            </div>
          ) : (
            filteredChatMessages.map((m) => (
              <div key={m.id} className="leading-relaxed hover:bg-zinc-900/40 p-1.5 rounded transition-colors text-xs font-mono">
                <span className="text-zinc-600 mr-2">[{m.time}]</span>
                <span className={`px-1.5 py-0.5 mr-2 text-[9px] font-bold rounded ${
                  m.type === 'radio' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' :
                  m.type === 'local' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' :
                  m.type === 'kill' ? 'bg-red-950/60 text-red-400 border border-red-800/60' :
                  m.type === 'rcon' ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60' :
                  'bg-zinc-800 text-zinc-300'
                }`}>
                  {m.channel}
                </span>
                <span className="font-bold text-zinc-300 mr-2">
                  {highlightText(m.author, debouncedSearch)}:
                </span>
                <span className="text-zinc-400">
                  {highlightText(m.text, debouncedSearch)}
                </span>
              </div>
            ))
          )}
        </div>

        <AnimatePresence>
          {!autoScroll && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 right-6 z-30 flex items-center gap-2"
            >
              <div className="px-3 py-1.5 bg-[#171a1e]/95 border border-zinc-700 text-zinc-400 text-[10px] rounded-lg shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>AUTO-SCROLL: PAUSADO (Scroll manual detectado)</span>
              </div>

              <button
                onClick={scrollToBottom}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded-lg shadow-xl flex items-center gap-1.5 uppercase transition-colors cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>VOLVER AL ÚLTIMO {unreadCount > 0 ? `(+${unreadCount} NUEVOS)` : ''}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMacroMenu && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className="absolute bottom-2 left-4 right-4 z-40 bg-black/95 backdrop-blur-md border border-amber-900/60 rounded-xl p-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2 text-[10px]">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ COMANDOS RÁPIDOS [!]</span>
                </div>
                <div className="text-zinc-500 font-mono text-[9px] flex items-center gap-3">
                  <span>[ ↑ ↓ NAVEGAR ]</span>
                  <span>[ ↵ EJECUTAR ]</span>
                  <span>[ ESC CERRAR ]</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {MACROS.map((macro, idx) => (
                  <div
                    key={macro.id}
                    onClick={() => {
                      setChatInput(`${macro.cmd} `);
                      setShowMacroMenu(false);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs font-mono transition-colors ${
                      selectedMacroIdx === idx
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-zinc-800 text-amber-400 border border-zinc-700">
                        {macro.cmd}
                      </span>
                      <span className="font-bold text-zinc-200">{macro.param}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{macro.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
          <span>TRANSMISIÓN GLOBAL • Presiona [Enter] para transmitir | Tipea '!' o '/' para menú de comandos</span>
          <span className="text-emerald-500 font-bold">38 JUGADORES SINTONIZADOS // CANAL SEGURO</span>
        </div>

        <div className={`p-1.5 bg-[#14161a] border rounded-xl flex items-center gap-2.5 transition-colors shadow-lg ${
          chatIdentity === 'ADMIN' ? 'border-amber-500/80 focus-within:border-amber-400' :
          chatIdentity === 'SISTEMA' ? 'border-red-600/80 focus-within:border-red-500' :
          'border-blue-500/80 focus-within:border-blue-400'
        }`}>
          <div className="pl-3 text-zinc-500">
            <Radio className="w-4 h-4 text-amber-500" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe tu transmisión militar..."
            value={chatInput}
            onChange={handleChatInputChange}
            onKeyDown={handleChatKeyDown}
            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono"
          />

          <select
            value={chatIdentity}
            onChange={(e) => setChatIdentity(e.target.value)}
            className="bg-[#101214] border border-zinc-800 text-zinc-300 font-bold text-[10px] px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="ADMIN">ADMIN (AMARILLO)</option>
            <option value="SISTEMA">SISTEMA (ROJO)</option>
            <option value="MODERADOR">MODERADOR (AZUL)</option>
          </select>

          <button
            onClick={handleSendMessage}
            className={`px-5 py-2 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow cursor-pointer ${
              chatIdentity === 'ADMIN' ? 'bg-amber-500 hover:bg-amber-400 text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
              chatIdentity === 'SISTEMA' ? 'bg-red-700 hover:bg-red-600 text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]' :
              'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
          >
            <Send className="w-3 h-3 stroke-[2.5]" />
            <span>TRANSMITIR</span>
          </button>
        </div>
      </div>

    </div>
  );
}
