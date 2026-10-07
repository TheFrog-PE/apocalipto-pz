import React from 'react';
import WorksRoulette3D from './WorksRoulette3D';
import { WORKS_DATA } from '../../data/landingData';

export default function WorksSection({ onCursorEnter, onCursorLeave }) {
  return (
    <section 
      id="works" 
      className="w-full bg-[#07080a] relative flex items-center justify-center overflow-hidden select-none py-16 sm:py-20"
    >
      {/* DIFUMINADO SUPERIOR */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07080a] to-transparent pointer-events-none z-10" />
      {/* DIFUMINADO INFERIOR */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07080a] to-transparent pointer-events-none z-10" />
      
      {/* RULETA 3D */}
      <div className="w-full h-full flex items-center justify-center relative z-10">
        <WorksRoulette3D
          works={WORKS_DATA}
          onSelectProject={() => {}}
          onCursorEnter={onCursorEnter}
          onCursorLeave={onCursorLeave}
        />
      </div>
    </section>
  );
}
