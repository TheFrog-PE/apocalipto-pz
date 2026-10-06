import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, ChevronRight, ChevronDown } from 'lucide-react';
import blogImg from '../../assets/publicaciones-blog-pz.webp';
import { INITIAL_NEWS, ARCHIVED_NEWS } from '../../data/newsData';

export default function NewsTab({ onShowToast }) {
  const [newsList, setNewsList] = useState(INITIAL_NEWS);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [expandedNewsId, setExpandedNewsId] = useState(null);
  const [loadedArchived, setLoadedArchived] = useState(false);

  const handleFilter = (tag) => {
    setSelectedTag(tag);
  };

  const handleLoadMore = () => {
    if (loadedArchived) {
      onShowToast?.({
        type: 'info',
        title: '[ ARCHIVO COMPLETO ]',
        message: 'No existen más registros desclasificados en la base de datos de Knox.'
      });
      return;
    }
    setNewsList((prev) => [...prev, ...ARCHIVED_NEWS]);
    setLoadedArchived(true);
    onShowToast?.({
      type: 'success',
      title: '[ REGISTROS DESCLASIFICADOS ]',
      message: 'Se cargaron exitosamente 2 nuevos registros archivados.'
    });
  };

  const filteredNews = selectedTag === 'ALL'
    ? newsList
    : newsList.filter((item) => item.tag.toUpperCase() === selectedTag.toUpperCase());

  const toggleExpand = (id) => {
    setExpandedNewsId((prev) => (prev === id ? null : id));
  };

  return (
    <motion.div
      key="publicaciones"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* Columna Izquierda: Lore del Servidor */}
      <div className="lg:col-span-7 bg-[#141414]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-[#242f28] text-zinc-200 px-5 py-2.5 flex items-center justify-between text-[10px] font-mono tracking-wider border-b border-zinc-700/40">
          <span>[ LORE DEL SERVER ]</span>
          <span>EL FIN DEL MUNDO SONABA MEJOR</span>
        </div>

        <div className="p-6 flex flex-col">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-zinc-100 mb-4 leading-tight">
            UN NUEVO ORDEN SE FORMÓ LUEGO DEL FIN DEL MUNDO
          </h2>

          {/* Cuadro de Ilustración del Blog */}
          <div className="relative w-full h-72 bg-[#1a1a1a] border border-zinc-700/70 rounded-xl overflow-hidden flex items-center justify-center mb-5 group shadow-inner">
            <img
              src={blogImg}
              alt="Ilustración Apocalipto PZ - Primer Blog"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300">
              <span className="bg-black/80 px-2.5 py-1 rounded-md border border-zinc-800 backdrop-blur-sm shadow">
                [ FOTOGRAMA OFICIAL • ARCHIVO DE TRANSMISIÓN #01 ]
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono text-zinc-400 leading-relaxed text-justify">
            <p>
              Día 14 del Incidente de Knox. El olor a ozono quemado y carne en descomposición se ha convertido en el aire que respiramos. Las transmisiones de emergencia de Louisville cesaron hace 72 horas. Solo queda estática en las frecuencias altas.
            </p>
            <p>
              La civilización tal como la conocíamos se fracturó en cuatro frentes de poder nacidos de la necesidad extrema. La <strong className="text-zinc-200">DOE (División de Operaciones Especiales)</strong> mantiene su bastión a sangre y fuego bajo una férrea ley marcial. Los <strong className="text-zinc-200">MOK</strong> dominan el asfalto y el páramo con vehículos blindados de chatarra, viviendo para el saqueo. Los <strong className="text-zinc-200">KTO</strong> operan desde las sombras como un culto macabro que venera la infección. Y la <strong className="text-zinc-200">RIV</strong> resiste en el valle, unida por pactos de sangre para defender su territorio a cualquier costo. Aquí no hay leyes, solo supervivencia.
            </p>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Comunicados Oficiales (Limpio, sin luces de hover) */}
      <div className="lg:col-span-5 bg-[#141414]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl overflow-hidden p-6 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-4 text-zinc-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold tracking-widest uppercase">
              COMUNICADOS OFICIALES
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-700/80 px-2.5 py-0.5 rounded-full shadow-inner">
            {filteredNews.length} REGISTRO(S)
          </span>
        </div>

        {/* Filtros por Categoría */}
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-zinc-800/80 text-[10px] font-mono overflow-x-auto">
          {['ALL', 'URGENT', 'SYSTEM', 'INTEL'].map((tag) => (
            <button
              key={tag}
              onClick={() => handleFilter(tag)}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-zinc-800 text-white border-zinc-500 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {tag === 'ALL' ? 'TODOS' : tag}
            </button>
          ))}
        </div>

        {/* Feed de Noticias (Limpio y sobrio) */}
        <div className="flex flex-col gap-3.5 mb-6 max-h-[440px] overflow-y-auto pr-1">
          {filteredNews.map((item) => {
            const isExpanded = expandedNewsId === item.id;
            return (
              <div
                key={item.id}
                className="p-4 bg-[#181818]/90 border border-zinc-800/80 rounded-xl flex flex-col transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border ${item.tagColor}`}>
                    [ {item.tag} ]
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{item.date}</span>
                </div>

                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide mb-1.5">
                  {item.title}
                </h4>

                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed mb-2">
                  {isExpanded ? item.fullText : item.snippet}
                </p>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="text-[10px] font-mono font-semibold text-zinc-400 hover:text-white flex items-center transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        CONTRAER <ChevronDown className="w-3 h-3 ml-0.5" />
                      </>
                    ) : (
                      <>
                        LEER MÁS <ChevronRight className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Cargar Más */}
        <button
          onClick={handleLoadMore}
          className={`w-full py-3.5 font-bold text-xs tracking-widest uppercase transition-colors shadow rounded-xl ${
            loadedArchived
              ? 'bg-zinc-900/80 border border-zinc-800 text-zinc-500 cursor-default'
              : 'bg-red-700 hover:bg-red-600 text-white cursor-pointer'
          }`}
        >
          {loadedArchived ? 'TODOS LOS REGISTROS CARGADOS' : 'CARGAR REGISTROS ANTERIORES'}
        </button>
      </div>
    </motion.div>
  );
}
