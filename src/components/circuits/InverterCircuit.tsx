import React from 'react';
import {
  DCSourceSymbol,
  SwitchSymbol,
  ResistorSymbol,
  InductorSymbol,
  GroundSymbol,
} from './CircuitSymbols';
import { ConverterParams, SimulationSample } from '../../types/converter';

interface InverterCircuitProps {
  params: ConverterParams;
  currentSample: SimulationSample;
}

export const InverterCircuit: React.FC<InverterCircuitProps> = ({
  params,
  currentSample,
}) => {
  const isPos = currentSample.vOutput > 0.5;
  const isNeg = currentSample.vOutput < -0.5;

  const s1_on = isPos;
  const s2_on = isPos;
  const s3_on = isNeg;
  const s4_on = isNeg;

  const hasL = params.inductance > 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden">
      <svg
        viewBox="0 0 780 400"
        className="w-full h-auto max-h-[380px] drop-shadow-md text-slate-300"
      >
        <line x1="80" y1="90" x2="520" y2="90" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="80" y1="310" x2="520" y2="310" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="80" y1="90" x2="80" y2="185" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="80" y1="215" x2="80" y2="310" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="260" y1="90" x2="260" y2="120" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="260" y1="180" x2="260" y2="220" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="260" y1="280" x2="260" y2="310" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="440" y1="90" x2="440" y2="120" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="440" y1="180" x2="440" y2="220" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="440" y1="280" x2="440" y2="310" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="260" y1="200" x2="310" y2="200" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="390" y1="200" x2="440" y2="200" stroke="#3d4260" strokeWidth="2.5" />

        <circle cx="260" cy="90" r="3.5" fill="#a855f7" />
        <circle cx="260" cy="200" r="4" fill="#a855f7" />
        <circle cx="260" cy="310" r="3.5" fill="#a855f7" />
        <circle cx="440" cy="90" r="3.5" fill="#a855f7" />
        <circle cx="440" cy="200" r="4" fill="#a855f7" />
        <circle cx="440" cy="310" r="3.5" fill="#a855f7" />

        {s1_on && (
          <path
            d="M 80 200 L 80 90 L 260 90 L 260 200 L 440 200 L 440 310 L 80 310 Z"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_1s_linear_infinite] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          />
        )}
        {s3_on && (
          <path
            d="M 80 200 L 80 90 L 440 90 L 440 200 L 260 200 L 260 310 L 80 310 Z"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_1s_linear_infinite] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          />
        )}

        <DCSourceSymbol x={80} y={200} voltage={params.vSupplyRms} label="Vdc" />

        <SwitchSymbol x={260} y={150} label="S1" isClosed={s1_on} />
        <SwitchSymbol x={260} y={250} label="S4" isClosed={s4_on} />

        <SwitchSymbol x={440} y={150} label="S3" isClosed={s3_on} />
        <SwitchSymbol x={440} y={250} label="S2" isClosed={s2_on} />

        {hasL ? (
          <>
            <InductorSymbol
              x={325}
              y={200}
              value={params.inductance}
              label="L"
              isEnergized={Math.abs(currentSample.iLoad) > 0.05}
            />
            <ResistorSymbol
              x={375}
              y={200}
              value={params.resistance}
              label="R"
            />
          </>
        ) : (
          <ResistorSymbol
            x={350}
            y={200}
            value={params.resistance}
            label="R Load"
          />
        )}

        <GroundSymbol x={80} y={320} />

        <g transform="translate(350, 140)">
          <rect
            x="-45"
            y="-16"
            width="90"
            height="32"
            rx="5"
            className="fill-[#131526]/95 stroke-purple-500/70 stroke-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"
          />
          <text x="0" y="4" textAnchor="middle" className="text-[12px] font-mono fill-purple-200 font-extrabold">
            v_o = {currentSample.vOutput.toFixed(1)} V
          </text>
        </g>

        <g transform="translate(350, 260)">
          <text x="0" y="0" textAnchor="middle" className="text-[11px] font-mono fill-emerald-300 font-bold">
            i_o = {currentSample.iLoad.toFixed(2)} A
          </text>
        </g>

        <g transform="translate(350, 360)">
          <rect
            x="-165"
            y="-12"
            width="330"
            height="24"
            rx="5"
            className="fill-[#131526] stroke-purple-500/50 stroke-1"
          />
          <text x="0" y="4" textAnchor="middle" className="text-[10px] font-mono fill-purple-200 font-bold">
            {params.inverterModulation === 'square'
              ? `Square Wave (180° mode) | Active: ${s1_on ? 'S1-S2 (+Vdc)' : s3_on ? 'S3-S4 (-Vdc)' : 'Deadtime'}`
              : `Sinusoidal PWM (SPWM) | ma = ${params.modulationIndex} | Active: ${s1_on ? 'S1-S2' : 'S3-S4'}`}
          </text>
        </g>
      </svg>
    </div>
  );
};
