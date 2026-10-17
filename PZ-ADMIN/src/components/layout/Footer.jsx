import React from 'react';

export default function Footer() {
  return (
    <footer className="px-4 py-2.5 bg-[#121417] border border-zinc-800/90 rounded-xl flex flex-col md:flex-row items-center justify-between gap-2.5 text-[9px] font-mono text-zinc-500 shadow-md text-center md:text-left">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse shrink-0" />
        <span>• © 1993 KNOX COUNTY EVACUATION PROTOCOL // BENTO COMMAND OS</span>
      </div>
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-4">
        <span>BUILD VER. 42.20.4</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">ENJAMBRE P2P: ED25519</span>
        <div className="flex items-center gap-2 border-l border-zinc-800 pl-2.5">
          <a href="https://discord.gg/XtAPqKChr" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-indigo-400 transition-colors" title="Discord Oficial">DISCORD</a>
          <span>•</span>
          <a href="https://whatsapp.com/channel/0029Vb9IM1d5a242vteFM31F" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-emerald-400 transition-colors" title="Canal WhatsApp">WHATSAPP</a>
          <span>•</span>
          <a href="https://www.facebook.com/profile.php?id=61594472247909" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-400 transition-colors" title="Página Facebook">FACEBOOK</a>
          <span>•</span>
          <a href="https://www.instagram.com/apocaliptopz/" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-pink-400 transition-colors" title="Instagram Oficial">INSTAGRAM</a>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-l border-zinc-800 pl-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
          <span>EN LÍNEA</span>
        </div>
      </div>
    </footer>
  );
}
