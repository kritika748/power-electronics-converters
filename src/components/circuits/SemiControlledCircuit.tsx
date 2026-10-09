import React from 'react';
import {
  ACSourceSymbol,
  SCRSymbol,
  DiodeSymbol,
  ResistorSymbol,
  InductorSymbol,
  GroundSymbol,
} from './CircuitSymbols';
import { ConverterParams, SimulationSample } from '../../types/converter';

interface SemiControlledCircuitProps {
  params: ConverterParams;
  currentSample: SimulationSample;
}

export const SemiControlledCircuit: React.FC<SemiControlledCircuitProps> = ({
  params,
  currentSample,
}) => {
  const angle = currentSample.angleDeg;
  const alpha = params.firingAngle;

  const isT1Active = angle >= alpha && angle <= 180;
  const isT2Active = angle >= 180 + alpha && angle <= 360;
  const isFreewheeling =
    (angle > 180 && angle < 180 + alpha) || (angle < alpha);

  const t1_on = isT1Active;
  const d1_on = isT1Active || isFreewheeling;
  const t2_on = isT2Active;
  const d2_on = isT2Active || isFreewheeling;

  const isGate1Fired =
    angle >= alpha && angle <= alpha + 15 && currentSample.gatePulse > 1;
  const isGate2Fired =
    angle >= 180 + alpha && angle <= 180 + alpha + 15 && currentSample.gatePulse > 1;

  const hasL = params.loadType === 'RL';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden">
      <svg
        viewBox="0 0 760 400"
        className="w-full h-auto max-h-[380px] drop-shadow-md text-slate-300"
      >
        <line x1="100" y1="140" x2="100" y2="176" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="100" y1="224" x2="100" y2="260" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="100" y1="140" x2="210" y2="140" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="210" y1="140" x2="210" y2="200" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="210" y1="200" x2="250" y2="200" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="100" y1="260" x2="390" y2="260" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="390" y1="260" x2="390" y2="200" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="390" y1="200" x2="350" y2="200" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="300" y1="110" x2="540" y2="110" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="300" y1="290" x2="540" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="250" y1="200" x2="275" y2="140" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="325" y1="110" x2="300" y2="110" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="350" y1="200" x2="325" y2="140" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="250" y1="200" x2="275" y2="260" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="325" y1="290" x2="300" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="350" y1="200" x2="325" y2="260" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="540" y1="110" x2="540" y2="150" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="540" y1="250" x2="540" y2="290" stroke="#3d4260" strokeWidth="2.5" />

        <circle cx="300" cy="110" r="4" fill="#a855f7" />
        <circle cx="300" cy="290" r="4" fill="#a855f7" />
        <circle cx="540" cy="110" r="4" fill="#a855f7" />
        <circle cx="540" cy="290" r="4" fill="#a855f7" />

        {/* Dynamic flow */}
        {t1_on && (
          <path
            d="M 100 200 L 100 140 L 210 140 L 210 200 L 250 200 L 300 110 L 540 110 L 540 290 L 300 290 L 350 200 L 390 200 L 390 260 L 100 260 Z"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_1s_linear_infinite] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          />
        )}
        {isFreewheeling && (
          <path
            d="M 300 110 L 540 110 L 540 290 L 300 290 Z"
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_0.8s_linear_infinite] drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
        )}

        {/* AC Supply */}
        <ACSourceSymbol
          x={100}
          y={200}
          vRms={params.vSupplyRms}
          freq={params.frequency}
          instantaneousV={currentSample.vSource}
        />

        {/* Top Arm: 2 SCRs */}
        <SCRSymbol
          x={275}
          y={155}
          rotation={-60}
          label="T1 (SCR)"
          isConducting={t1_on}
          isGateTriggered={isGate1Fired}
        />

        <SCRSymbol
          x={325}
          y={155}
          rotation={-120}
          label="T2 (SCR)"
          isConducting={t2_on}
          isGateTriggered={isGate2Fired}
        />

        {/* Bottom Arm: 2 Diodes */}
        <DiodeSymbol
          x={275}
          y={245}
          rotation={120}
          label="D2"
          isConducting={d2_on}
        />

        <DiodeSymbol
          x={325}
          y={245}
          rotation={60}
          label="D1"
          isConducting={d1_on}
        />

        {/* Load branch */}
        {hasL ? (
          <>
            <InductorSymbol
              x={540}
              y={170}
              vertical={true}
              value={params.inductance}
              label="L"
              isEnergized={currentSample.iLoad > 0.05}
            />
            <ResistorSymbol
              x={540}
              y={235}
              vertical={true}
              value={params.resistance}
              label="R"
            />
          </>
        ) : (
          <ResistorSymbol
            x={540}
            y={200}
            vertical={true}
            value={params.resistance}
            label="R"
          />
        )}

        <GroundSymbol x={100} y={280} />

        {/* Voltmeter */}
        <g transform="translate(630, 200)">
          <rect
            x="-45"
            y="-22"
            width="90"
            height="44"
            rx="6"
            className="fill-[#131526]/95 stroke-purple-500/70 stroke-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"
          />
          <text x="0" y="-6" textAnchor="middle" className="text-[10px] font-mono fill-purple-300 font-bold">
            V_OUT (v_o)
          </text>
          <text x="0" y="14" textAnchor="middle" className="text-[13px] font-mono fill-purple-200 font-extrabold">
            {currentSample.vOutput.toFixed(1)} V
          </text>
        </g>
        <line x1="540" y1="140" x2="585" y2="185" stroke="#a855f7" strokeDasharray="3 3" strokeWidth="1.5" />
        <line x1="540" y1="260" x2="585" y2="215" stroke="#a855f7" strokeDasharray="3 3" strokeWidth="1.5" />

        {/* Ammeter */}
        <g transform="translate(540, 75)">
          <circle cx="0" cy="0" r="18" className="fill-[#131526] stroke-emerald-500 stroke-1.5" />
          <text x="0" y="4" textAnchor="middle" className="text-[11px] font-mono fill-emerald-400 font-extrabold">
            A
          </text>
          <text x="0" y="-22" textAnchor="middle" className="text-[11px] font-mono fill-emerald-300 font-bold">
            i_o = {currentSample.iLoad.toFixed(2)} A
          </text>
        </g>

        {/* Semi-Converter Status */}
        <g transform="translate(300, 345)">
          <rect
            x="-125"
            y="-12"
            width="250"
            height="24"
            rx="5"
            className="fill-[#131526] stroke-purple-500/50 stroke-1"
          />
          <text x="0" y="4" textAnchor="middle" className="text-[10px] font-mono fill-purple-200 font-bold">
            STATE: {isFreewheeling ? '⚡ FREEWHEELING (D1-D2, Vo=0)' : t1_on ? 'Active Rectification (T1-D1)' : 'Active Rectification (T2-D2)'}
          </text>
        </g>
      </svg>
    </div>
  );
};
