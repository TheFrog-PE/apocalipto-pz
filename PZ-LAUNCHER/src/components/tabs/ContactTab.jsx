import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  Share2, 
  Camera, 
  AlertOctagon,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function ContactTab({ onShowToast }) {
  const [reportForm, setReportForm] = useState({
    nombre: '',
    tipo: '',
    incidente: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const socialChannels = [
    {
      id: 'discord',
      title: 'DISCORD',
      badge: '[ SOPORTE Y ASISTENCIA ]',
      actionText: 'UNIRSE A LA COMUNIDAD',
      hoverStyle: 'hover:border-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:from-indigo-950/40 hover:to-[#161616]',
      badgeColor: 'text-indigo-400 group-hover:text-indigo-300',
      icon: MessageSquare,
      iconBg: 'bg-indigo-950/70 border-indigo-500/50 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]',
      bullet1: '> CANALES DE AYUDA PARA NUEVOS SUPERVIVIENTES.',
      bullet2: '> TRANSMISIONES, COMUNIDAD, EVENTOS Y MUCHO MÁS.',
      url: 'https://discord.gg/XtAPqKChr'
    },
    {
      id: 'whatsapp',
      title: 'WHATSAPP',
      badge: '[ SECURE LINE ]',
      actionText: 'ABRIR LÍNEA DIRECTA',
      hoverStyle: 'hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:from-emerald-950/40 hover:to-[#161616]',
      badgeColor: 'text-emerald-400 group-hover:text-emerald-300',
      icon: Radio,
      iconBg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      bullet1: '> ALERTAS DIRECTAS Y COMUNICADOS DE EMERGENCIA.',
      bullet2: '> ESTADO: CANAL DE COMUNICACIÓN EN STANDBY.',
      url: 'https://whatsapp.com/channel/0029Vb9IM1d5a242vteFM31F'
    },
    {
      id: 'facebook',
      title: 'FACEBOOK',
      badge: '[ PUBLIC LOG ]',
      actionText: 'VER COMUNICADOS',
      hoverStyle: 'hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:from-blue-950/40 hover:to-[#161616]',
      badgeColor: 'text-blue-400 group-hover:text-blue-300',
      icon: Share2,
      iconBg: 'bg-blue-950/70 border-blue-600/50 text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      bullet1: '> ACTUALIZACIONES DEL ENJAMBRE Y REPORTES DE INCIDENTES.',
      bullet2: '> TRANSMISIONES DE INFORMACIÓN GENERAL.',
      url: 'https://www.facebook.com/profile.php?id=61594472247909'
    },
    {
      id: 'instagram',
      title: 'INSTAGRAM',
      badge: '[ VISUAL INTEL ]',
      actionText: 'VER FOTOGRAMAS',
      hoverStyle: 'hover:border-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:from-pink-950/40 hover:to-[#161616]',
      badgeColor: 'text-pink-400 group-hover:text-pink-300',
      icon: Camera,
      iconBg: 'bg-pink-950/70 border-pink-600/50 text-pink-400 group-hover:bg-pink-600 group-hover:text-white group-hover:border-pink-400 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]',
      bullet1: '> METRAJE Y REGISTROS FOTOGRÁFICOS DE RECONOCIMIENTO.',
      bullet2: '> ESCENAS ARCHIVADAS DESDE LA ZONA DE CUARENTENA.',
      url: 'https://www.instagram.com/apocaliptopz/'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reportForm.nombre.trim()) {
      setErrorMessage('Debes indicar tu nombre o identificador de superviviente.');
      return;
    }
    if (!reportForm.tipo) {
      setErrorMessage('Selecciona el tipo de protocolo o incidente.');
      return;
    }
    if (!reportForm.incidente.trim() || reportForm.incidente.trim().length < 10) {
      setErrorMessage('Describe el incidente con al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onShowToast?.({
        type: 'success',
        title: '[ INFORME TRANSMITIDO ]',
        message: `El reporte #${Math.floor(1000 + Math.random() * 9000)} de ${reportForm.nombre} fue archivado para revisión administrativa.`
      });
      setReportForm({
        nombre: '',
        tipo: '',
        incidente: ''
      });
    }, 1000);
  };

  const handleOpenExternal = async (url) => {
    try {
      if (window.__TAURI__?.shell?.open) {
        await window.__TAURI__.shell.open(url);
        return;
      }
    } catch (e) {}

    try {
      const { open } = await import('@tauri-apps/api/shell');
      await open(url);
      return;
    } catch (e) {}

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      key="contacto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* Columna Izquierda: Redes y Estado de Señal */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="bg-[#141414]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-100">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                LA SEÑAL SE PIERDE
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-300 bg-zinc-900/90 border border-zinc-700 px-3 py-1 rounded-full shadow-inner flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              TRANSMITIENDO...
            </span>
          </div>

          <p className="text-xs text-zinc-400 font-mono leading-relaxed text-justify mb-4">
            El gobierno mantiene los canales de comunicación abiertos y el suministro de recursos activo hacia las zonas. Aunque la estática intermitente fragmenta los reportes, el control central jamás pierde el rastro.
          </p>

          <div className="text-[11px] font-mono text-zinc-400 font-bold tracking-wider">
            [ REDES DE ENLACE DIRECTO ]
          </div>
        </div>

        {/* Canales Sociales con efecto HOVER brillante y puntero táctico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {socialChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                onClick={() => handleOpenExternal(channel.url)}
                role="button"
                tabIndex={0}
                className={`relative bg-gradient-to-b from-[#161616]/95 to-[#121212]/95 backdrop-blur-md border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between transition-all duration-300 group shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] cursor-pointer ${channel.hoverStyle}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 ${channel.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-zinc-200 group-hover:text-white transition-colors">
                        {channel.title}
                      </span>
                    </div>
                    
                    {/* Badge interactivo al pasar el mouse */}
                    <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 group-hover:text-white transition-colors bg-black/40 group-hover:bg-black/80 px-2 py-0.5 rounded border border-transparent group-hover:border-zinc-700">
                      <span>ENLACE</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className={`text-[9px] font-mono tracking-wider mb-3 transition-colors ${channel.badgeColor}`}>
                    {channel.badge}
                  </div>

                  <ul className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-300 space-y-1 transition-colors">
                    <li>{channel.bullet1}</li>
                    <li>{channel.bullet2}</li>
                  </ul>
                </div>

                {/* Micro indicador de acción al fondo de la tarjeta */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/60 group-hover:border-zinc-700/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-zinc-200 transition-colors">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all" />
                    CANAL ACTIVO
                  </span>
                  <span className="text-zinc-400 group-hover:text-white font-bold tracking-wider">
                    {channel.actionText} →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Formulario de Reporte con hover interactivo */}
      <div className="lg:col-span-5 bg-[#141414]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-zinc-100">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold tracking-widest uppercase">REPORTA ERROR</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 tracking-wider bg-red-950/50 border border-red-800/80 px-2.5 py-0.5 rounded-full">
            <span>[ REC</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            <span>]</span>
          </div>
        </div>

        <div className="p-5 flex flex-col">
          <p className="text-[11px] font-mono text-zinc-400 mb-5 leading-relaxed">
            &gt; REPORTA CUALQUIER INCIDENTE, BUG, ACTITUD O CUALQUIER COMPORTAMIENTO QUE ROMPA LOS PROTOCOLOS YA ESTABLECIDOS.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-[11px] font-mono">
              [ ERROR ]: {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-400 mb-1.5 uppercase">
                NOMBRE / IDENTIFICADOR
              </label>
              <input
                type="text"
                placeholder="> ej. ALPHA-01 o Sobreviviente_93"
                value={reportForm.nombre}
                onChange={(e) => {
                  setErrorMessage('');
                  setReportForm({ ...reportForm, nombre: e.target.value });
                }}
                className="w-full bg-[#181818] border border-zinc-800 hover:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.25)] focus:bg-[#1f1f1f] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-400 mb-1.5 uppercase">
                TIPO DE INCIDENTE
              </label>
              <select
                value={reportForm.tipo}
                onChange={(e) => {
                  setErrorMessage('');
                  setReportForm({ ...reportForm, tipo: e.target.value });
                }}
                className="w-full bg-[#181818] border border-zinc-800 hover:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.25)] focus:bg-[#1f1f1f] transition-all"
              >
                <option value="">[ SELECCIONA EL TIPO DE PROTOCOLO ]</option>
                <option value="bug">BUG / FALLO TÉCNICO EN CLIENTE</option>
                <option value="report">REPORTE DE JUGADOR (METAGAMING/HACK)</option>
                <option value="connection">ERROR DE CONEXIÓN O DESYNC</option>
                <option value="other">OTRO PROTOCOLO DE REVISIÓN</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-400 mb-1.5 uppercase">
                DETALLES DEL INCIDENTE:
              </label>
              <textarea
                rows={4}
                placeholder="Describe hora, lugar y coordenadas o circunstancias del suceso..."
                value={reportForm.incidente}
                onChange={(e) => {
                  setErrorMessage('');
                  setReportForm({ ...reportForm, incidente: e.target.value });
                }}
                className="w-full bg-[#181818] border border-zinc-800 hover:border-zinc-600 rounded-lg p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.25)] focus:bg-[#1f1f1f] transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 border font-mono font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 mt-2 shadow-lg cursor-pointer rounded-xl ${
                isSubmitting
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400 cursor-wait'
                  : 'bg-zinc-900 hover:bg-red-950/70 border-zinc-700 hover:border-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.35)] text-zinc-200 hover:text-white hover:scale-[1.01] active:scale-99'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                  <span>TRANSMITIENDO REPORTE...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>&gt; ENVIAR REPORTE OFICIAL</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
