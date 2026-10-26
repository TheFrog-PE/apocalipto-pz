import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, ChevronRight, BookOpen, Check } from 'lucide-react';
import blogImg from '../../assets/publicaciones-blog-pz.webp';
import { INITIAL_NEWS, ARCHIVED_NEWS, LORE_ARTICLE } from '../../data/newsData';

export default function NewsTab({ onShowToast }) {
  const [newsList, setNewsList] = useState(INITIAL_NEWS);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [activeArticle, setActiveArticle] = useState(LORE_ARTICLE);
  const [loadedArchived, setLoadedArchived] = useState(false);

  const handleFilter = (tag) => {
    setSelectedTag(tag);
  };

  const handleSelectArticle = (item) => {
    setActiveArticle(item);
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

  return (
    <motion.div
      key="publicaciones"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* Columna Izquierda: Noticia Seleccionada / Lore Activo */}
      <div className="lg:col-span-7 bg-[#141414]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all">
        {/* Header superior de la publicación */}
        <div className="bg-[#242f28] text-zinc-200 px-5 py-2.5 flex items-center justify-between text-[10px] font-mono tracking-wider border-b border-zinc-700/40">
          <span className="font-bold text-emerald-400">{activeArticle.headerTag || `[ ${activeArticle.tag} ]`}</span>
          <span className="text-zinc-300">{activeArticle.headerDate || activeArticle.date}</span>
        </div>

        <div className="p-6 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeArticle.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-zinc-100 mb-4 leading-tight">
                {activeArticle.title}
              </h2>

              {/* Cuadro de Ilustración */}
              <div className="relative w-full h-72 bg-[#1a1a1a] border border-zinc-700/70 rounded-xl overflow-hidden flex items-center justify-center mb-5 group shadow-inner">
                <img
                  src={blogImg}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                  <span className="bg-black/85 px-2.5 py-1 rounded-md border border-zinc-800 backdrop-blur-sm shadow">
                    {activeArticle.caption || '[ FOTOGRAMA OFICIAL • ARCHIVO DE TRANSMISIÓN ]'}
                  </span>
                </div>
              </div>

              {/* Párrafos del texto */}
              <div className="space-y-4 text-xs font-mono text-zinc-400 leading-relaxed text-justify mb-4">
                {(activeArticle.paragraphs || [activeArticle.fullText || activeArticle.snippet]).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Botón para volver al Lore principal si se está viendo otra noticia */}
              {activeArticle.id !== 'lore' && (
                <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveArticle(LORE_ARTICLE)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/60 text-zinc-300 hover:text-emerald-400 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>VOLVER AL LORE DEL SERVIDOR</span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Columna Derecha: Comunicados Oficiales */}
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

        {/* Feed de Noticias interactivo */}
        <div className="flex flex-col gap-3.5 mb-6 max-h-[440px] overflow-y-auto pr-1">
          {filteredNews.map((item) => {
            const isSelected = activeArticle.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectArticle(item)}
                className={`p-4 rounded-xl flex flex-col transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a1c23] border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                    : 'bg-[#181818]/90 border border-zinc-800/80 hover:border-zinc-700 hover:bg-[#1c1c1c]'
                }`}
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
                  {item.snippet}
                </p>

                <div className="flex justify-end pt-1">
                  <div
                    className={`text-[10px] font-mono font-semibold flex items-center transition-colors ${
                      isSelected
                        ? 'text-amber-400'
                        : 'text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-emerald-400" />
                        <span>MOSTRANDO EN LADO IZQUIERDO</span>
                      </>
                    ) : (
                      <>
                        <span>LEER NOTICIA</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                  </div>
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
