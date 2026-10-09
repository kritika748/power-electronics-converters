import React from 'react';
import {
  ACSourceSymbol,
  DiodeSymbol,
  SCRSymbol,
  ResistorSymbol,
  InductorSymbol,
  GroundSymbol,
} from './CircuitSymbols';
import { ConverterParams, SimulationSample } from '../../types/converter';

interface HalfWaveCircuitProps {
  params: ConverterParams;
  currentSample: SimulationSample;
}

export const HalfWaveCircuit: React.FC<HalfWaveCircuitProps> = ({
  params,
  currentSample,
}) => {
  const isSCR = params.topology === 'half_wave_controlled';
  const hasFD = params.hasFreewheelingDiode || params.loadType === 'RL_FD';
  const hasL = params.loadType === 'RL' || params.loadType === 'RL_FD' || params.loadType === 'RLE';

  const isFdConducting = hasFD && currentSample.vSource < 0 && currentSample.iLoad > 0.05;
  const isMainConducting = currentSample.iLoad > 0.05 && !isFdConducting;
  const isGateFired = isSCR && currentSample.gatePulse > 1;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden">
      <svg
        viewBox="0 0 740 380"
        className="w-full h-auto max-h-[360px] drop-shadow-md text-slate-300"
      >
        {/* --- MAIN CIRCUIT WIRES --- */}
        <line x1="120" y1="110" x2="220" y2="110" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="280" y1="110" x2="480" y2="110" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="480" y1="110" x2="480" y2="140" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="480" y1="280" x2="480" y2="310" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="480" y1="310" x2="120" y2="310" stroke="#3d4260" strokeWidth="2.5" />

        <line x1="120" y1="110" x2="120" y2="186" stroke="#3d4260" strokeWidth="2.5" />
        <line x1="120" y1="234" x2="120" y2="310" stroke="#3d4260" strokeWidth="2.5" />

        {/* Optional Freewheeling Diode Branch */}
        {hasFD && (
          <>
            <line x1="380" y1="110" x2="380" y2="180" stroke="#3d4260" strokeWidth="2" />
            <line x1="380" y1="240" x2="380" y2="310" stroke="#3d4260" strokeWidth="2" />
            <circle cx="380" cy="110" r="3.5" fill="#a855f7" />
            <circle cx="380" cy="310" r="3.5" fill="#a855f7" />
          </>
        )}

        {/* Junction dots */}
        <circle cx="480" cy="110" r="3.5" fill="#a855f7" />
        <circle cx="480" cy="310" r="3.5" fill="#a855f7" />

        {/* --- DYNAMIC FLOW PATHS (ANIMATED) --- */}
        {isMainConducting && (
          <path
            d="M 120 210 L 120 110 L 480 110 L 480 310 L 120 310 Z"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_1s_linear_infinite] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          />
        )}

        {isFdConducting && (
          <path
            d="M 380 110 L 480 110 L 480 310 L 380 310 Z"
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_0.8s_linear_infinite] drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
        )}

        {/* --- COMPONENTS --- */}
        <ACSourceSymbol
          x={120}
          y={210}
          vRms={params.vSupplyRms}
          freq={params.frequency}
          instantaneousV={currentSample.vSource}
        />

        {/* Controlled SCR or Uncontrolled Diode */}
        {isSCR ? (
          <SCRSymbol
            x={250}
            y={110}
            label="T1 (SCR)"
            isConducting={isMainConducting}
            isGateTriggered={isGateFired}
          />
        ) : (
          <DiodeSymbol
            x={250}
            y={110}
            label="D1"
            isConducting={isMainConducting}
          />
        )}

        {/* Freewheeling Diode (if enabled) */}
        {hasFD && (
          <DiodeSymbol
            x={380}
            y={210}
            rotation={-90}
            label="FD"
            isConducting={isFdConducting}
          />
        )}

        {/* Load Elements */}
        {hasL ? (
          <>
            <InductorSymbol
              x={480}
              y={170}
              vertical={true}
              value={params.inductance}
              label="L"
              isEnergized={currentSample.iLoad > 0.05}
            />
            <ResistorSymbol
              x={480}
              y={245}
              vertical={true}
              value={params.resistance}
              label="R"
            />
          </>
        ) : (
          <ResistorSymbol
            x={480}
            y={210}
            vertical={true}
            value={params.resistance}
            label="R"
          />
        )}

        {/* Ground */}
        <GroundSymbol x={120} y={320} />

        {/* --- PROBES & METERS --- */}
        {/* Load Voltage Probe */}
        <g transform="translate(560, 210)">
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
        <line x1="480" y1="140" x2="515" y2="195" stroke="#a855f7" strokeDasharray="3 3" strokeWidth="1.5" />
        <line x1="480" y1="280" x2="515" y2="225" stroke="#a855f7" strokeDasharray="3 3" strokeWidth="1.5" />

        {/* Load Current Probe */}
        <g transform="translate(480, 75)">
          <circle cx="0" cy="0" r="18" className="fill-[#131526] stroke-emerald-500 stroke-1.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
          <text x="0" y="4" textAnchor="middle" className="text-[11px] font-mono fill-emerald-400 font-extrabold">
            A
          </text>
          <text x="0" y="-22" textAnchor="middle" className="text-[11px] font-mono fill-emerald-300 font-bold">
            i_o = {currentSample.iLoad.toFixed(2)} A
          </text>
        </g>

        {/* Device Voltage Probe */}
        <g transform="translate(250, 48)">
          <text x="0" y="0" textAnchor="middle" className="text-[10px] font-mono fill-purple-300">
            v_device = {currentSample.vDevice.toFixed(1)} V
          </text>
        </g>

        {/* Gate Indicator Banner if SCR */}
        {isSCR && (
          <g transform="translate(250, 155)">
            <rect
              x="-40"
              y="-10"
              width="80"
              height="20"
              rx="4"
              className={
                isGateFired
                  ? 'fill-fuchsia-500/30 stroke-fuchsia-400 stroke-1.5 animate-pulse drop-shadow-[0_0_8px_rgba(232,121,249,0.7)]'
                  : 'fill-[#131526] stroke-purple-900 stroke-1'
              }
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              className={`text-[9px] font-mono font-bold ${
                isGateFired ? 'fill-fuchsia-300 font-black' : 'fill-purple-400/80'
              }`}
            >
              GATE: {isGateFired ? 'TRIGGERED' : `α = ${params.firingAngle}°`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
