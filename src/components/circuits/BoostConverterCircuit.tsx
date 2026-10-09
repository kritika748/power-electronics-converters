import React from 'react';
import {
  DCSourceSymbol,
  SwitchSymbol,
  DiodeSymbol,
  InductorSymbol,
  CapacitorSymbol,
  ResistorSymbol,
  GroundSymbol,
} from './CircuitSymbols';
import { ConverterParams, SimulationSample } from '../../types/converter';

interface BoostConverterCircuitProps {
  params: ConverterParams;
  currentSample: SimulationSample;
}

export const BoostConverterCircuit: React.FC<BoostConverterCircuitProps> = ({
  params,
  currentSample,
}) => {
  const isSwitchClosed = currentSample.gatePulse > 1;
  const isDiodeConducting = !isSwitchClosed;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden">
      <svg
        viewBox="0 0 760 380"
        className="w-full h-auto max-h-[360px] drop-shadow-md text-slate-300"
      >
        <line x1="100" y1="120" x2="200" y2="120" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="100" y1="120" x2="100" y2="190" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="100" y1="210" x2="100" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="260" y1="120" x2="330" y2="120" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="330" y1="120" x2="330" y2="180" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="330" y1="240" x2="330" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="330" y1="120" x2="400" y2="120" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="450" y1="120" x2="520" y2="120" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="520" y1="120" x2="520" y2="180" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="520" y1="220" x2="520" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="520" y1="120" x2="620" y2="120" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="620" y1="120" x2="620" y2="175" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="620" y1="235" x2="620" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="100" y1="290" x2="620" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <circle cx="330" cy="120" r="3.5" fill="#a855f7" />
        <circle cx="330" cy="290" r="3.5" fill="#a855f7" />
        <circle cx="520" cy="120" r="3.5" fill="#a855f7" />
        <circle cx="520" cy="290" r="3.5" fill="#a855f7" />
        <circle cx="620" cy="120" r="3.5" fill="#a855f7" />
        <circle cx="620" cy="290" r="3.5" fill="#a855f7" />

        {isSwitchClosed && (
          <path
            d="M 100 200 L 100 120 L 330 120 L 330 290 L 100 290 Z"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_1s_linear_infinite] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          />
        )}
        {isDiodeConducting && (
          <path
            d="M 100 200 L 100 120 L 620 120 L 620 290 L 100 290 Z"
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_0.8s_linear_infinite] drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
        )}

        <DCSourceSymbol x={100} y={200} voltage={params.vSupplyRms} label="Vin" />

        <InductorSymbol
          x={230}
          y={120}
          value={params.inductance}
          label="L (Boost)"
          isEnergized={true}
        />

        <SwitchSymbol
          x={330}
          y={210}
          label="MOSFET (S)"
          isClosed={isSwitchClosed}
        />

        <DiodeSymbol
          x={425}
          y={120}
          label="D (Boost)"
          isConducting={isDiodeConducting}
        />

        <CapacitorSymbol
          x={520}
          y={200}
          vertical={true}
          value={params.capacitance}
          label="C"
        />

        <ResistorSymbol
          x={620}
          y={205}
          vertical={true}
          value={params.resistance}
          label="R Load"
        />

        <GroundSymbol x={100} y={300} />

        <g transform="translate(685, 205)">
          <rect
            x="-40"
            y="-22"
            width="80"
            height="44"
            rx="6"
            className="fill-[#131526]/95 stroke-purple-500/70 stroke-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"
          />
          <text x="0" y="-6" textAnchor="middle" className="text-[10px] font-mono fill-purple-300 font-bold">
            V_BOOST
          </text>
          <text x="0" y="14" textAnchor="middle" className="text-[13px] font-mono fill-purple-200 font-extrabold">
            {currentSample.vOutput.toFixed(1)} V
          </text>
        </g>

        <g transform="translate(230, 75)">
          <text x="0" y="0" textAnchor="middle" className="text-[11px] font-mono fill-emerald-300 font-bold">
            i_L = {currentSample.iLoad.toFixed(2)} A
          </text>
        </g>

        <g transform="translate(370, 340)">
          <rect
            x="-155"
            y="-12"
            width="310"
            height="24"
            rx="5"
            className="fill-[#131526] stroke-purple-500/50 stroke-1"
          />
          <text x="0" y="4" textAnchor="middle" className="text-[10px] font-mono fill-purple-200 font-bold">
            {isSwitchClosed
              ? `SWITCH ON | Inductor Storing Energy | Duty: ${(params.dutyCycle * 100).toFixed(0)}%`
              : 'SWITCH OFF | Inductor Boosting & Discharging through Diode'}
          </text>
        </g>
      </svg>
    </div>
  );
};
