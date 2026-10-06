import doeImg from '../assets/doe-pz-facciones.webp';
import mokImg from '../assets/mok-pz-facciones.webp';
import ktoImg from '../assets/kto-pz-facciones.webp';
import rivImg from '../assets/riv-pz-facciones.webp';

export const FACTIONS = [
  {
    id: 'doe',
    tag: 'DOE',
    name: 'DIVISIÓN DE OPERACIONES ESPECIALES',
    description: 'RESTOS DEL GOBIERNO; IMPONEN LEY MARCIAL Y ORDEN A SANGRE Y FUEGO EN SU BASTIÓN.',
    image: doeImg,
    imagePosition: 'object-[center_32%]',
    current: 0,
    max: 10,
    accentColor: 'border-blue-500 text-blue-400',
    hoverGlow: 'hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]',
    selectedStyle: 'border-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.45)] bg-gradient-to-b from-blue-950/40 to-[#141414]',
    activeBadge: 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]',
    activeDot: 'bg-blue-400',
    topBarColor: 'bg-blue-500',
    barFill: 'bg-blue-500',
    bannerGradient: 'from-blue-950/40 to-transparent'
  },
  {
    id: 'mok',
    tag: 'MOK',
    name: 'MERODEADORES OFENSIVOS KINÉTICOS',
    description: 'EL CRIMEN ORGANIZADO SOLO MUTÓ, UN GRUPO DE EXTORSIONADORES, ASESINOS Y DELINCUENTES.',
    image: mokImg,
    imagePosition: 'object-[center_30%]',
    current: 0,
    max: 10,
    accentColor: 'border-red-600 text-red-500',
    hoverGlow: 'hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.35)]',
    selectedStyle: 'border-red-600 shadow-[0_0_35px_rgba(239,68,68,0.45)] bg-gradient-to-b from-red-950/40 to-[#141414]',
    activeBadge: 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
    activeDot: 'bg-red-500',
    topBarColor: 'bg-red-600',
    barFill: 'bg-red-600',
    bannerGradient: 'from-red-950/40 to-transparent'
  },
  {
    id: 'kto',
    tag: 'KTO',
    name: 'KNOX TESTAMENTO OSCURO',
    description: 'CULTO MACABRO QUE VENERA EL METAL Y OPERA DESDE LAS SOMBRAS DE LA ZONA CERO.',
    image: ktoImg,
    imagePosition: 'object-[center_34%]',
    current: 0,
    max: 10,
    accentColor: 'border-amber-500 text-amber-400',
    hoverGlow: 'hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    selectedStyle: 'border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.45)] bg-gradient-to-b from-amber-950/40 to-[#141414]',
    activeBadge: 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    activeDot: 'bg-amber-400',
    topBarColor: 'bg-amber-500',
    barFill: 'bg-amber-500',
    bannerGradient: 'from-amber-950/40 to-transparent'
  },
  {
    id: 'riv',
    tag: 'RIV',
    name: 'RESISTENCIA INDIE VECINAL',
    description: 'UN GRUPO DE VECINOS UNIFICADOS SOBREVIVEN A LAS VIOLENTAS CALLES MUERTAS.',
    image: rivImg,
    imagePosition: 'object-[center_30%]',
    current: 0,
    max: 10,
    accentColor: 'border-emerald-500 text-emerald-400',
    hoverGlow: 'hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]',
    selectedStyle: 'border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.45)] bg-gradient-to-b from-emerald-950/40 to-[#141414]',
    activeBadge: 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    activeDot: 'bg-emerald-400',
    topBarColor: 'bg-emerald-500',
    barFill: 'bg-emerald-500',
    bannerGradient: 'from-emerald-950/40 to-transparent'
  }
];
