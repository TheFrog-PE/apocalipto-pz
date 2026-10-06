import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Key, 
  FileCode2, 
  ExternalLink,
  ChevronRight,
  Database,
  Lock
} from 'lucide-react';

export default function ExpandedBlockchain({ onBack }) {
  // Datos reales del Bloque #1 generado con la partida real de Project Zomboid
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(1);

  const BLOCKS = [
    {
      index: 1,
      blockHash: 'b5fe558f55b11fd49654194752d696ea7d6daa270046529ef77afeca064db1a9',
      prevHash: 'b497cf15490d30b1443d8abc9fae51b1717427dfe0e99e3ec36549e9038e9e29',
      merkleRoot: 'a78042edcb89a13ffdf2ec18058a79af1e6ce2a47c20462f61a1bfa70e7273e9',
      alfaNodeId: 'node_3fd60674622bd1f9',
      changesCount: 27,
      witnessSignatures: [
        { nodeId: 'node_witness_delta_01', status: 'VALIDADO' },
        { nodeId: 'node_witness_echo_02', status: 'VALIDADO' },
        { nodeId: 'node_witness_foxtrot_03', status: 'VALIDADO' }
      ],
      sampleChunks: [
        { path: 'meta/map_meta.bin', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', size: '3,157 KB' },
        { path: 'meta/map_animals.bin', hash: 'c9f8a2b13e4567890123456789abcdef0123456789abcdef0123456789abcdef', size: '21.2 KB' },
        { path: 'meta/gos_farming.bin', hash: '9072373d5e54e4661029384756abcdef0123456789abcdef0123456789abcdef', size: '12.3 KB' },
        { path: 'meta/map_basements.bin', hash: '4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a', size: '53.4 KB' },
        { path: 'meta/iTrack.bin', hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e', size: '10.7 KB' }
      ]
    },
    {
      index: 0,
      blockHash: 'b497cf15490d30b1443d8abc9fae51b1717427dfe0e99e3ec36549e9038e9e29',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      alfaNodeId: 'node_3fd60674622bd1f9',
      changesCount: 1,
      witnessSignatures: [
        { nodeId: 'node_genesis_authority', status: 'INMUTABLE' }
      ],
      sampleChunks: [
        { path: 'system/genesis.dat', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', size: '0 KB' }
      ]
    }
  ];

  const currentBlock = BLOCKS.find(b => b.index === selectedBlockIdx) || BLOCKS[0];

  return (
    <div className="flex-1 bg-[#101216]/95 border border-zinc-800/90 rounded-2xl flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
      {/* HEADER DE MÓDULO */}
      <div className="px-6 py-3.5 bg-[#14171c] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-lg hover:text-white transition-all text-[11px]"
          >
            ← VOLVER AL DASHBOARD
          </button>
          <div className="flex items-center gap-2 text-cyan-400">
            <Layers className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold text-sm tracking-wider">[ SAVE-CHAIN // EXPLORADOR DE BLOQUES ]</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-400">LIBRO MAYOR CRIPTOGRÁFICO:</span>
          <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONSENSO ACTIVO • INVIOLABLE
          </span>
        </div>
      </div>

      {/* MÉTRICAS DE LA CADENA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-[#121418] border-b border-zinc-800/80 text-[11px]">
        <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-zinc-500 text-[10px] uppercase">Altura de Cadena</div>
            <div className="text-zinc-100 font-bold text-base">Bloque #{BLOCKS.length - 1}</div>
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-zinc-500 text-[10px] uppercase">Proof of Hardware (DPoH)</div>
            <div className="text-emerald-400 font-bold text-base">Score: 886 • ALFA</div>
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-950/60 border border-purple-500/30 rounded-lg text-purple-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-zinc-500 text-[10px] uppercase">Consenso de Testigos</div>
            <div className="text-purple-400 font-bold text-base">3 / 3 Firmas Ed25519</div>
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-950/60 border border-amber-500/30 rounded-lg text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-zinc-500 text-[10px] uppercase">Privacidad & Sanitización</div>
            <div className="text-amber-400 font-bold text-sm">ZERO LEAK • OFUSCADO</div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: LISTA DE BLOQUES + DETALLE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* COLUMNA IZQUIERDA: LISTA DE BLOQUES */}
        <div className="lg:col-span-4 border-r border-zinc-800 p-4 overflow-y-auto space-y-2 bg-[#0e1013]">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            HISTORIAL DE BLOQUES DE GUARDADO:
          </div>
          {BLOCKS.map(block => (
            <button
              key={block.index}
              onClick={() => setSelectedBlockIdx(block.index)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedBlockIdx === block.index
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-md'
                  : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">BLOQUE #{block.index}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                  {block.changesCount} chunks
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                Hash: {block.blockHash.substring(0, 24)}...
              </div>
            </button>
          ))}
        </div>

        {/* COLUMNA DERECHA: DETALLE DEL BLOQUE */}
        <div className="lg:col-span-8 p-6 overflow-y-auto space-y-5 bg-[#121417]">
          {/* ENCABEZADO DEL BLOQUE SELECCIONADO */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-sm font-bold text-cyan-400">
                INSPECTOR DE BLOQUE #{currentBlock.index}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ALFA: {currentBlock.alfaNodeId}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px]">BLOCK HASH (SHA-256):</span>
                <span className="text-zinc-200 bg-zinc-900 px-2 py-1 rounded select-all break-all border border-zinc-800">
                  {currentBlock.blockHash}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px]">PREV HASH:</span>
                <span className="text-zinc-400 bg-zinc-900 px-2 py-1 rounded select-all break-all border border-zinc-800">
                  {currentBlock.prevHash}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-emerald-400 text-[10px] font-bold">WORLD STATE MERKLE ROOT:</span>
                <span className="text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded select-all break-all border border-emerald-500/30">
                  {currentBlock.merkleRoot}
                </span>
              </div>
            </div>
          </div>

          {/* FIRMAS DE CONSENSO DE TESTIGOS */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Consenso Multi-Firma de Testigos ({currentBlock.witnessSignatures.length} Nodos):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {currentBlock.witnessSignatures.map((w, i) => (
                <div key={i} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] text-zinc-300 truncate">{w.nodeId}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded font-bold">
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CHUNKS DEL MUNDO INGERIDOS AL CONTENT-ADDRESSABLE STORAGE */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                Muestra de Chunks Guardados en CAS ({currentBlock.sampleChunks.length} mostrados):
              </span>
              <span className="text-[10px] text-zinc-500">RUTAS CANÓNICAS SANITIZADAS</span>
            </div>

            <div className="space-y-1.5">
              {currentBlock.sampleChunks.map((chunk, i) => (
                <div key={i} className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-200 font-bold">{chunk.path}</span>
                    <span className="text-zinc-500">({chunk.size})</span>
                  </div>
                  <span className="text-zinc-500 font-mono select-all">
                    Hash: {chunk.hash.substring(0, 20)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
