import React from 'react';
import { ArrowUp, Shield } from 'lucide-react';
import { COMPANY_INFO } from '../../data/landingData';

export default function Footer({ onCursorEnter, onCursorLeave }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="bg-[#050608] text-zinc-400 font-mono text-xs border-t border-zinc-900 relative">
      {/* ── COORDENADAS DEL SERVIDOR Y REDES SOCIALES ── */}
      <div className="py-16 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 text-xs">
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <img 
              src="./isotipo.png" 
              alt="Apocalipto PZ" 
              className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] select-none" 
            />
            <span className="font-syne font-black text-white text-base uppercase">
              {COMPANY_INFO.name} // {COMPANY_INFO.subName}
            </span>
          </div>
          <p className="text-zinc-500 leading-relaxed text-[11px]">
            {COMPANY_INFO.legalName}<br />
            {COMPANY_INFO.location}<br />
            Red Descentralizada P2P // Protocolo Criptográfico ($0 Cloud).
          </p>
        </div>

        <div className="md:col-span-4 space-y-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-2">CANALES DE SUPERVIVENCIA</span>
          <div className="flex flex-col space-y-1.5 text-zinc-300">
            {[
              { label: 'DISCORD OFICIAL // COMUNIDAD PZ', url: 'https://discord.gg/XtAPqKChr' },
              { label: 'CANAL DE WHATSAPP // NOTICIAS', url: 'https://whatsapp.com/channel/0029Vb9IM1d5a242vteFM31F' },
              { label: 'FACEBOOK OFICIAL // APOCALIPTO PZ', url: 'https://www.facebook.com/profile.php?id=61594472247909' },
              { label: 'INSTAGRAM // @apocaliptopz', url: 'https://www.instagram.com/apocaliptopz/' }
            ].map((net) => (
              <a 
                key={net.label}
                href={net.url}
                target="_blank"
                rel="noopener noreferrer" 
                className="hover:text-[#e6fb04] transition-colors"
              >
                {net.label}
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end">
          <div>
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">CORREO DE ADMINISTRACIÓN</span>
            <a href={`mailto:${COMPANY_INFO.email}`} className="text-white font-bold hover:text-[#e6fb04] transition-colors">
              {COMPANY_INFO.email}
            </a>
          </div>

          <button
            onClick={scrollToTop}
            onMouseEnter={() => onCursorEnter?.('TOP')}
            onMouseLeave={() => onCursorLeave?.()}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#e6fb04]" />
          </button>
        </div>
      </div>

      {/* ── BARRA INFERIOR DE COPYRIGHT LEGAL ── */}
      <div className="py-6 px-6 md:px-12 border-t border-zinc-900 text-[10px] text-zinc-500 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 1993-2026 Knox County Evacuation Protocol. Todos los derechos reservados.</span>
        <span>POLÍTICA DE PRIVACIDAD DEL LAUNCHER Y TÉRMINOS DE SERVICIO RCON.</span>
      </div>
    </footer>
  );
}
