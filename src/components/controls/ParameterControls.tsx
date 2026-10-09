import React from 'react';
import {
  ConverterParams,
  ConverterTopology,
  CONVERTER_TOPOLOGY_DEFAULTS,
} from '../../types/converter';
import { Settings2, RotateCcw, Zap, Layers } from 'lucide-react';

interface ParameterControlsProps {
  params: ConverterParams;
  onChange: (updated: Partial<ConverterParams>) => void;
  onResetDefaults: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChange,
  onResetDefaults,
}) => {
  const isScrConverter =
    params.topology === 'half_wave_controlled' ||
    params.topology === 'full_wave_bridge_controlled' ||
    params.topology === 'semi_controlled_bridge';

  const isDcDc =
    params.topology === 'buck_converter' || params.topology === 'boost_converter';

  const isInverter = params.topology === 'inverter_full_bridge';

  const firingPresets = [0, 30, 45, 60, 90, 120, 150];

  const topologyList: { id: ConverterTopology; label: string; group: string }[] = [
    { id: 'half_wave_uncontrolled', label: 'Half-Wave (Diode)', group: 'Rectifier' },
    { id: 'half_wave_controlled', label: 'Half-Wave (SCR)', group: 'Rectifier' },
    { id: 'full_wave_bridge_uncontrolled', label: 'Full Bridge (4 Diodes)', group: 'Rectifier' },
    { id: 'full_wave_bridge_controlled', label: 'Full Controlled (4 SCRs)', group: 'Rectifier' },
    { id: 'semi_controlled_bridge', label: 'Semi-Controlled Bridge', group: 'Rectifier' },
    { id: 'buck_converter', label: 'Buck Converter (Step-Down)', group: 'DC-DC' },
    { id: 'boost_converter', label: 'Boost Converter (Step-Up)', group: 'DC-DC' },
    { id: 'inverter_full_bridge', label: 'H-Bridge Inverter (DC-AC)', group: 'Inverter' },
  ];

  const handleTopologySelect = (top: ConverterTopology) => {
    const defaults = CONVERTER_TOPOLOGY_DEFAULTS[top];
    onChange({ ...defaults });
  };

  return (
    <div className="flex flex-col bg-[#0b0c16] border border-[#23253d] rounded-xl overflow-hidden shadow-2xl text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121424] border-b border-[#23253d]">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-purple-200">
            Laboratory Parameter Desk
          </h2>
        </div>
        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-purple-300 hover:bg-[#1a1c30] px-2 py-0.5 rounded transition cursor-pointer"
          title="Reset to current converter default parameters"
        >
          <RotateCcw className="w-3 h-3 text-purple-400" /> Defaults
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
        {/* TOPOLOGY QUICK SELECTOR BUTTONS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Select Circuit Topology
            </label>
            <span className="text-[10px] font-mono text-purple-300">
              Instant Waveform Switch
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {topologyList.map((item) => {
              const active = params.topology === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTopologySelect(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition text-xs font-mono flex flex-col justify-between ${
                    active
                      ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-bold shadow-md shadow-purple-950/50'
                      : 'bg-[#121424] border-[#22243d] text-slate-300 hover:border-purple-500/40 hover:bg-[#1a1c30]'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span className={`text-[9px] uppercase tracking-wider ${active ? 'text-purple-300' : 'text-slate-500'}`}>
                    {item.group}
                  </span>
                </button>
              );
            })}
          </div>

          <select
            value={params.topology}
            onChange={(e) => handleTopologySelect(e.target.value as ConverterTopology)}
            className="w-full bg-[#121424] border border-[#2a2d4a] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-purple-500 cursor-pointer"
          >
            {topologyList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.group})
              </option>
            ))}
          </select>
        </div>

        {/* LOAD TYPE SELECTION (For rectifiers) */}
        {!isDcDc && !isInverter && (
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5 font-semibold">
              Load Circuit Type
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() =>
                  onChange({ loadType: 'R', inductance: 0, hasFreewheelingDiode: false })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition ${
                  params.loadType === 'R'
                    ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-semibold shadow-xs'
                    : 'bg-[#121424] border-[#22243d] text-slate-400 hover:border-slate-700'
                }`}
              >
                R (Resistive)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    loadType: 'RL',
                    inductance: params.inductance > 0 ? params.inductance : 60,
                    hasFreewheelingDiode: false,
                  })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition ${
                  params.loadType === 'RL' && !params.hasFreewheelingDiode
                    ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-semibold shadow-xs'
                    : 'bg-[#121424] border-[#22243d] text-slate-400 hover:border-slate-700'
                }`}
              >
                R - L (Inductive)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    loadType: 'RL_FD',
                    inductance: params.inductance > 0 ? params.inductance : 60,
                    hasFreewheelingDiode: true,
                  })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition ${
                  params.loadType === 'RL_FD' || params.hasFreewheelingDiode
                    ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-semibold shadow-xs'
                    : 'bg-[#121424] border-[#22243d] text-slate-400 hover:border-slate-700'
                }`}
              >
                R - L + Freewheeling
              </button>
              {params.topology === 'full_wave_bridge_uncontrolled' ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      loadType: 'RC',
                      capacitance: params.capacitance > 0 ? params.capacitance : 220,
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition ${
                    params.loadType === 'RC'
                      ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-semibold shadow-xs'
                      : 'bg-[#121424] border-[#22243d] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  R - C (Filter Cap)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      loadType: 'RLE',
                      backEmf: params.backEmf > 0 ? params.backEmf : 30,
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition ${
                    params.loadType === 'RLE'
                      ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-semibold shadow-xs'
                      : 'bg-[#121424] border-[#22243d] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  R - L - E (Back EMF)
                </button>
              )}
            </div>
          </div>
        )}

        <hr className="border-[#22243d]" />

        {/* SUPPLY PARAMETERS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">
              {isDcDc || isInverter ? 'DC Supply Voltage (Vin)' : 'Supply Voltage (Vs,rms)'}
            </span>
            <span className="text-purple-300 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
              {params.vSupplyRms} V
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={isDcDc ? 100 : 400}
            step={2}
            value={params.vSupplyRms}
            onChange={(e) => onChange({ vSupplyRms: Number(e.target.value) })}
            className="w-full accent-purple-500 cursor-pointer"
          />

          {!isDcDc && (
            <>
              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-slate-300 font-semibold">AC Frequency (f)</span>
                <span className="text-purple-300 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                  {params.frequency} Hz
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={params.frequency}
                onChange={(e) => onChange({ frequency: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </>
          )}
        </div>

        {/* FIRING ANGLE CONTROL (FOR SCRs) */}
        {isScrConverter && (
          <div className="space-y-2 pt-2 border-t border-[#22243d]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Firing Angle (α)
              </span>
              <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {params.firingAngle}°
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={180}
              step={1}
              value={params.firingAngle}
              onChange={(e) => onChange({ firingAngle: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            {/* Quick angle chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {firingPresets.map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onChange({ firingAngle: deg })}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer transition ${
                    params.firingAngle === deg
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-[#121424] border-[#22243d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DC-DC CONVERTER CONTROLS */}
        {isDcDc && (
          <div className="space-y-3 pt-2 border-t border-[#22243d]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">Duty Cycle (D)</span>
              <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {(params.dutyCycle * 100).toFixed(0)}% ({params.dutyCycle.toFixed(2)})
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={params.dutyCycle}
              onChange={(e) => onChange({ dutyCycle: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-slate-300 font-semibold">Switching Freq (fs)</span>
              <span className="text-purple-300 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                {params.switchingFreq} kHz
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={params.switchingFreq}
              onChange={(e) => onChange({ switchingFreq: Number(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        )}

        {/* INVERTER CONTROLS */}
        {isInverter && (
          <div className="space-y-3 pt-2 border-t border-[#22243d]">
            <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
              Modulation Scheme
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => onChange({ inverterModulation: 'square' })}
                className={`px-2 py-1.5 rounded border text-center cursor-pointer transition ${
                  params.inverterModulation === 'square'
                    ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-bold'
                    : 'bg-[#121424] border-[#22243d] text-slate-400'
                }`}
              >
                Square (180°)
              </button>
              <button
                type="button"
                onClick={() => onChange({ inverterModulation: 'spwm' })}
                className={`px-2 py-1.5 rounded border text-center cursor-pointer transition ${
                  params.inverterModulation === 'spwm'
                    ? 'bg-purple-600/25 border-purple-400 text-purple-200 font-bold'
                    : 'bg-[#121424] border-[#22243d] text-slate-400'
                }`}
              >
                SPWM (Sine PWM)
              </button>
            </div>

            {params.inverterModulation === 'spwm' && (
              <>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-slate-300 font-semibold">Modulation Index (ma)</span>
                  <span className="text-purple-300 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                    {params.modulationIndex.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.2}
                  step={0.05}
                  value={params.modulationIndex}
                  onChange={(e) =>
                    onChange({ modulationIndex: Number(e.target.value) })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </>
            )}
          </div>
        )}

        {/* LOAD COMPONENT VALUES (R, L, C, E) */}
        <div className="space-y-3 pt-2 border-t border-[#22243d]">
          <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
            Passive Load Parameters
          </label>

          {/* Resistance R */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-300">Resistance (R)</span>
              <span className="text-amber-400 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                {params.resistance} Ω
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={200}
              step={1}
              value={params.resistance}
              onChange={(e) => onChange({ resistance: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Inductance L */}
          {(params.loadType.includes('L') || isDcDc || isInverter) && (
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Inductance (L)</span>
                <span className="text-emerald-400 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                  {params.inductance} mH
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={isDcDc ? 30 : 250}
                step={isDcDc ? 0.5 : 5}
                value={params.inductance}
                onChange={(e) => onChange({ inductance: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          )}

          {/* Capacitance C */}
          {(params.loadType === 'RC' || isDcDc) && (
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Capacitance (C)</span>
                <span className="text-purple-300 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                  {params.capacitance} µF
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={params.capacitance}
                onChange={(e) => onChange({ capacitance: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          )}

          {/* Back EMF (E) */}
          {params.loadType === 'RLE' && (
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Back-EMF Battery (E)</span>
                <span className="text-rose-400 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
                  {params.backEmf} V
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={params.backEmf}
                onChange={(e) => onChange({ backEmf: Number(e.target.value) })}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
