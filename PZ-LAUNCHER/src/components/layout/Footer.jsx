import React from 'react';

export default function Footer() {
  return (
    <footer className="relative z-20 py-3 px-6 border-t border-zinc-800/60 bg-black/60 backdrop-blur-sm flex items-center justify-between text-[10px] text-zinc-500 font-mono">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
        <span className="tracking-widest uppercase">RED P2P 100% DESCENTRALIZADA ($0 CLOUD) // BUILD 42</span>
      </div>
      <div className="tracking-wider">
        Launcher desarrollado por <span className="text-zinc-300 font-bold">The Frog S.A.C.</span>
      </div>
    </footer>
  );
}
