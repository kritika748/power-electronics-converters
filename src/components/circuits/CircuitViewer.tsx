import React, { useState } from 'react';
import { ConverterParams, SimulationSample } from '../../types/converter';
import { HalfWaveCircuit } from './HalfWaveCircuit';
import { FullWaveBridgeCircuit } from './FullWaveBridgeCircuit';
import { FullControlledBridgeCircuit } from './FullControlledBridgeCircuit';
import { SemiControlledCircuit } from './SemiControlledCircuit';
import { BuckConverterCircuit } from './BuckConverterCircuit';
import { BoostConverterCircuit } from './BoostConverterCircuit';
import { InverterCircuit } from './InverterCircuit';
import {
  Sliders,
  Radio,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CircuitViewerProps {
  params: ConverterParams;
  currentSample: SimulationSample;
  currentTimeMs: number;
  activeProbe?: string;
  onSelectProbe?: (probeId: string) => void;
  onParamChange?: (updated: Partial<ConverterParams>) => void;
}

export const CircuitViewer: React.FC<CircuitViewerProps> = ({
  params,
  currentSample,
  currentTimeMs,
  activeProbe = 'vOutput',
  onSelectProbe,
  onParamChange,
}) => {
  const [showQuickTune, setShowQuickTune] = useState<boolean>(true);

  const getCircuitTitle = () => {
    switch (params.topology) {
      case 'half_wave_uncontrolled':
        return 'Half-Wave Uncontrolled Rectifier (Diode)';
      case 'half_wave_controlled':
        return 'Half-Wave Controlled Rectifier (SCR / Thyristor)';
      case 'full_wave_bridge_uncontrolled':
        return 'Single-Phase Full-Wave Bridge Rectifier (4 Diodes)';
      case 'full_wave_bridge_controlled':
        return 'Single-Phase Fully Controlled Bridge Rectifier (4 SCRs)';
      case 'semi_controlled_bridge':
        return 'Single-Phase Semi-Controlled Rectifier (Half-Bridge)';
      case 'buck_converter':
        return 'DC-DC Buck Converter (Step-Down Chopper)';
      case 'boost_converter':
        return 'DC-DC Boost Converter (Step-Up Chopper)';
      case 'inverter_full_bridge':
        return 'Single-Phase Full-Bridge DC-AC Inverter';
    }
  };

  const isScrConverter =
    params.topology === 'half_wave_controlled' ||
    params.topology === 'full_wave_bridge_controlled' ||
    params.topology === 'semi_controlled_bridge';

  const isDcDc =
    params.topology === 'buck_converter' || params.topology === 'boost_converter';

  // Determine current active conduction state
  const isConducting = Math.abs(currentSample.iLoad) > 0.05;
  const isGateActive = currentSample.gatePulse > 1;

  const probePoints = [
    { id: 'vSource', label: 'vs Supply', color: '#f59e0b' },
    { id: 'vOutput', label: 'vo Load V', color: '#c084fc' },
    { id: 'iLoad', label: 'io Current', color: '#10b981' },
    { id: 'gatePulse', label: 'vg Gate', color: '#f43f5e' },
    { id: 'vDevice', label: 'vT Device', color: '#38bdf8' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0c0d18] border border-[#23253e] rounded-xl overflow-hidden shadow-2xl">
      {/* Schematic Header */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-[#121424] border-b border-[#23253e] gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-200">
            {getCircuitTitle()}
          </h3>
        </div>

        {/* Live synchronized instant angle & time */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="text-slate-400">
            t: <strong className="text-purple-300">{currentTimeMs.toFixed(2)} ms</strong>
          </span>
          <span className="text-slate-400">
            θ: <strong className="text-amber-400">{currentSample.angleDeg.toFixed(1)}°</strong>
          </span>

          {/* Quick Tune Toggle */}
          <button
            onClick={() => setShowQuickTune(!showQuickTune)}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#1a1c32] hover:bg-[#232644] text-purple-300 border border-purple-500/30 transition cursor-pointer"
            title="Toggle Quick Interactive Parameter Tuning"
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>Tune</span>
            {showQuickTune ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Interactive Probe Selector Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#0e101d] border-b border-[#23253e] text-xs font-mono gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span>Interactive Probe:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {probePoints.map((p) => {
            const isSelected = activeProbe === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProbe?.(p.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  isSelected
                    ? 'font-bold shadow-sm'
                    : 'bg-[#141628] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                style={{
                  backgroundColor: isSelected ? `${p.color}25` : undefined,
                  color: isSelected ? p.color : undefined,
                  border: isSelected ? `1px solid ${p.color}88` : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Interactive Parameter Tuning Bar (Collapsible) */}
      {showQuickTune && onParamChange && (
        <div className="px-3.5 py-2 bg-[#121528] border-b border-purple-500/20 text-xs font-mono text-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Firing Angle Slider (if SCR) */}
          {isScrConverter && (
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-amber-400 font-bold text-[11px] whitespace-nowrap">
                Firing Angle α: {params.firingAngle}°
              </span>
              <input
                type="range"
                min="0"
                max="175"
                step="5"
                value={params.firingAngle}
                onChange={(e) => onParamChange({ firingAngle: Number(e.target.value) })}
                className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          )}

          {/* Duty Cycle Slider (if Buck/Boost) */}
          {isDcDc && (
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-purple-300 font-bold text-[11px] whitespace-nowrap">
                Duty Cycle D: {(params.dutyCycle * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={params.dutyCycle}
                onChange={(e) => onParamChange({ dutyCycle: Number(e.target.value) })}
                className="flex-1 accent-purple-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          )}

          {/* Quick Load Toggle */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Load:</span>
            {(['R', 'RL', 'RL_FD'] as const).map((lType) => {
              const active = params.loadType === lType;
              return (
                <button
                  key={lType}
                  onClick={() =>
                    onParamChange({
                      loadType: lType,
                      hasFreewheelingDiode: lType === 'RL_FD',
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition ${
                    active
                      ? 'bg-purple-600/40 text-purple-200 font-bold border border-purple-500/50'
                      : 'bg-[#16182c] text-slate-400 hover:text-slate-200 border border-[#23253e]'
                  }`}
                >
                  {lType === 'RL_FD' ? 'RL + FD' : lType}
                </button>
              );
            })}
          </div>

          {/* Resistance Quick Tuning */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">R:</span>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={params.resistance}
              onChange={(e) => onParamChange({ resistance: Number(e.target.value) })}
              className="w-20 accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
            <span className="text-emerald-400 font-bold text-[11px] w-9">
              {params.resistance}Ω
            </span>
          </div>
        </div>
      )}

      {/* Interactive Circuit Canvas with subtle dark-radial glow */}
      <div className="flex-1 min-h-[300px] flex items-center justify-center p-2 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#17182c] via-[#0c0d18] to-[#080911]">
        {params.topology === 'half_wave_uncontrolled' && (
          <HalfWaveCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'half_wave_controlled' && (
          <HalfWaveCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'full_wave_bridge_uncontrolled' && (
          <FullWaveBridgeCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'full_wave_bridge_controlled' && (
          <FullControlledBridgeCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'semi_controlled_bridge' && (
          <SemiControlledCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'buck_converter' && (
          <BuckConverterCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'boost_converter' && (
          <BoostConverterCircuit params={params} currentSample={currentSample} />
        )}
        {params.topology === 'inverter_full_bridge' && (
          <InverterCircuit params={params} currentSample={currentSample} />
        )}
      </div>

      {/* Schematic Footer Legend & Active Flow Telemetry */}
      <div className="px-3.5 py-2 bg-[#121424] border-t border-[#23253e] flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-sm ${
                isConducting
                  ? 'bg-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
            <span className={isConducting ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
              {isConducting ? 'Conducting (ON)' : 'Blocking (OFF)'}
            </span>
          </span>

          {isScrConverter && (
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-sm ${
                  isGateActive
                    ? 'bg-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-ping'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
              <span className={isGateActive ? 'text-rose-300 font-bold' : 'text-slate-500'}>
                Gate: {isGateActive ? 'TRIGGERED (α)' : 'Waiting'}
              </span>
            </span>
          )}
        </div>

        {/* Instantaneous Values Display */}
        <div className="text-slate-400">
          Instant:{' '}
          <span className="text-amber-400 font-semibold">vs = {currentSample.vSource.toFixed(1)}V</span>{' '}
          · <span className="text-purple-300 font-semibold">vo = {currentSample.vOutput.toFixed(1)}V</span>{' '}
          · <span className="text-emerald-400 font-semibold">io = {currentSample.iLoad.toFixed(2)}A</span>
        </div>
      </div>
    </div>
  );
};
