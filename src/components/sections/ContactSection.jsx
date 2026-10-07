import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowUp, Send, CheckCircle2, X, Shield, Radio, Terminal } from 'lucide-react';
import { COMPANY_INFO } from '../../data/landingData';

export default function ContactSection({
  isContactModalOpen,
  setIsContactModalOpen,
  onCursorEnter,
  onCursorLeave
}) {
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faction: '',
    category: 'Soporte Técnico Launcher',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setIsContactModalOpen(false);
      setFormData({ name: '', email: '', faction: '', category: 'Soporte Técnico Launcher', message: '' });
    }, 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="contact" className="bg-[#050608] text-zinc-400 font-mono text-xs border-b border-zinc-900 relative">
      
      {/* ── BANNER PRINCIPAL DE CONTACTO / ESTABLECER TRANSMISIÓN ── */}
      <div className="py-24 sm:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase text-white font-syne tracking-tight leading-[1.0]">
              ESTABLECER <br />
              <span className="text-zinc-600 hover:text-emerald-400 transition-colors duration-300 cursor-pointer drop-shadow-sm select-none">
                TRANSMISIÓN.
              </span>
            </h2>
            <p className="text-sm font-sans text-zinc-300 max-w-lg font-light leading-relaxed">
              Comunícate con la administración central de Apocalipto PZ. Soporte de Launcher, auditorías de Whitelist y coordinación de facciones en tiempo real.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsContactModalOpen(true)}
              onMouseEnter={() => onCursorEnter?.('COMMS')}
              onMouseLeave={() => onCursorLeave?.()}
              className="px-10 py-5 bg-[#e6fb04] hover:bg-white text-black font-extrabold text-sm tracking-[0.25em] uppercase rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(230,251,4,0.4)] cursor-pointer hover:scale-105 flex items-center gap-3"
            >
              <span>CONTACT / SOPORTE</span>
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </div>

      {/* ── MODAL INTERACTIVO DE CONTACTO / SOPORTE TÁCTICO ── */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 font-mono text-xs text-zinc-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0e1015] border border-zinc-700 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-zinc-800 bg-[#14161f] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e6fb04] animate-pulse" />
                  <span className="font-bold uppercase tracking-wider text-white">
                    [ APOCALIPTO PZ // TRANSMISIÓN DE SOPORTE &amp; WHITELIST ]
                  </span>
                </div>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">NOMBRE DE SUPERVIVIENTE / STEAMID:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Victor Knox / 76561198..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#08090b] border border-zinc-800 focus:border-[#e6fb04] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">CORREO ELECTRÓNICO:</label>
                    <input
                      type="email"
                      required
                      placeholder="survivor@apocaliptopz.pe"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#08090b] border border-zinc-800 focus:border-[#e6fb04] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">FACCIÓN / ORGANIZACIÓN:</label>
                    <input
                      type="text"
                      placeholder="e.g. Milicia de Rosewood / Independiente"
                      value={formData.faction}
                      onChange={(e) => setFormData({ ...formData, faction: e.target.value })}
                      className="w-full bg-[#08090b] border border-zinc-800 focus:border-[#e6fb04] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">TIPO DE SOLICITUD:</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#08090b] border border-zinc-800 focus:border-[#e6fb04] rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="Soporte Técnico Launcher">Soporte Técnico Launcher</option>
                      <option value="Solicitud de Whitelist Comunitaria">Solicitud de Whitelist Comunitaria</option>
                      <option value="Alianza de Facciones">Alianza de Facciones</option>
                      <option value="Auditoría de Nodo Enjambre">Auditoría de Nodo Enjambre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1.5">MENSAJE DE TRANSMISIÓN:</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detalles de la consulta, reporte técnico o solicitud de facción..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#08090b] border border-zinc-800 focus:border-[#e6fb04] rounded-xl p-3 text-xs text-white focus:outline-none resize-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formSent}
                    className={`w-full py-3.5 font-extrabold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                      formSent
                        ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-[#e6fb04] hover:bg-white text-black shadow-[0_0_20px_rgba(230,251,4,0.4)]'
                    }`}
                  >
                    {formSent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>TRANSMISIÓN ENVIADA A CENTRAL RCON</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>TRANSMITIR REPORTE</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}

