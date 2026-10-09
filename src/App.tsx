import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ConverterParams,
  ConverterTopology,
  SimulationSample,
  ExperimentPreset,
  CONVERTER_TOPOLOGY_DEFAULTS,
} from './types/converter';
import { simulateConverter } from './physics/converterEngine';
import { Navbar } from './components/header/Navbar';
import { CircuitViewer } from './components/circuits/CircuitViewer';
import { Oscilloscope } from './components/oscilloscope/Oscilloscope';
import { ParameterControls } from './components/controls/ParameterControls';
import { LabManualModal } from './components/manual/LabManualModal';
import {
  Check,
  Zap,
  Activity,
  Split,
  Layers,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Sparkles,
} from 'lucide-react';

const SWEEP_DURATION_SEC = 3.5; // Smooth educational sweep time (3.5 seconds across 2 cycles)

type WorkbenchViewMode = 'side_by_side' | 'stacked' | 'circuit_only' | 'waveform_only';

export default function App() {
  const [params, setParams] = useState<ConverterParams>(
    CONVERTER_TOPOLOGY_DEFAULTS.half_wave_controlled
  );
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [timeScaleMs, setTimeScaleMs] = useState<number>(40);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<WorkbenchViewMode>('side_by_side');
  const [activeProbe, setActiveProbe] = useState<string>('vOutput');
  const [showParametersDesk, setShowParametersDesk] = useState<boolean>(true);

  // Compute simulation samples whenever parameters change
  const simulation = useMemo(() => {
    return simulateConverter(params);
  }, [params]);

  const maxTotalWindowMs = simulation.samples.length
    ? simulation.samples[simulation.samples.length - 1].time
    : 40;

  // Smooth, stable educational sweep animation loop
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isRunning && maxTotalWindowMs > 0) {
        setCurrentTimeMs((prev) => {
          const advanceMs =
            (deltaSec / SWEEP_DURATION_SEC) * maxTotalWindowMs * playbackSpeed;
          const next = prev + advanceMs;
          return next % maxTotalWindowMs;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, playbackSpeed, maxTotalWindowMs]);

  // Find sample corresponding to current time
  const currentSample: SimulationSample = useMemo(() => {
    const samples = simulation.samples;
    if (!samples.length) {
      return {
        time: 0,
        angleDeg: 0,
        vSource: 0,
        vOutput: 0,
        iLoad: 0,
        vDevice: 0,
        gatePulse: 0,
        iSource: 0,
      };
    }
    const tMod = maxTotalWindowMs > 0 ? currentTimeMs % maxTotalWindowMs : 0;
    let best = samples[0];
    let minDiff = Infinity;
    for (const s of samples) {
      const diff = Math.abs(s.time - tMod);
      if (diff < minDiff) {
        minDiff = diff;
        best = s;
      }
    }
    return best;
  }, [simulation.samples, currentTimeMs, maxTotalWindowMs]);

  // Parameter update handler: changing any parameter updates circuit and waveforms immediately
  const handleParamChange = (updated: Partial<ConverterParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  // Direct topology switch handler: guarantees instantaneous waveform and schematic change
  const handleSelectTopology = (top: ConverterTopology) => {
    const defaults = CONVERTER_TOPOLOGY_DEFAULTS[top];
    setParams({ ...defaults });
    setCurrentTimeMs(0);
  };

  // Preset selection handler
  const handleSelectExperiment = (exp: ExperimentPreset) => {
    const top = exp.params.topology || params.topology;
    const defaults = CONVERTER_TOPOLOGY_DEFAULTS[top];
    setParams({
      ...defaults,
      ...exp.params,
    });
    setCurrentTimeMs(0);
    setIsRunning(true);
  };

  // Reset defaults handler
  const handleResetDefaults = () => {
    const defaults = CONVERTER_TOPOLOGY_DEFAULTS[params.topology];
    setParams({ ...defaults });
    setCurrentTimeMs(0);
  };

  // Step simulation forward/backward
  const handleStep = (stepMs: number) => {
    setIsRunning(false);
    setCurrentTimeMs((prev) => {
      let next = prev + stepMs;
      if (next < 0) next = maxTotalWindowMs + next;
      return next % maxTotalWindowMs;
    });
  };

  // Active conducting device description text
  const getConductingStateText = () => {
    const { iLoad, gatePulse, vSource } = currentSample;
    const isConducting = Math.abs(iLoad) > 0.05;

    if (params.topology.includes('inverter')) {
      return isConducting
        ? '⚡ Inverter switches conducting AC load current'
        : '⛔ Inverter dead-time interval';
    }
    if (params.topology.includes('buck') || params.topology.includes('boost')) {
      return gatePulse > 1
        ? '⚡ Main MOSFET switch ON (Inductor charging)'
        : isConducting
        ? '🔄 Freewheeling Diode ON (Inductor discharging)'
        : '⛔ DCM: Zero inductor current';
    }
    if (params.topology === 'half_wave_controlled') {
      if (gatePulse > 1) return '⚡ Thyristor T1 Gate fired at α!';
      if (isConducting && vSource >= 0) return '⚡ Thyristor T1 conducting in positive half-cycle';
      if (isConducting && vSource < 0) return '⚡ Thyristor T1 conducting past 180° due to inductance L (Extinction β)';
      return '⛔ Thyristor T1 blocking (OFF)';
    }
    if (params.topology === 'half_wave_uncontrolled') {
      if (params.hasFreewheelingDiode && vSource < 0 && isConducting)
        return '🔄 Freewheeling Diode FD active (Load voltage clamped to 0V)';
      if (isConducting) return '⚡ Diode D1 forward conducting';
      return '⛔ Diode D1 reverse blocking';
    }
    if (params.topology === 'full_wave_bridge_uncontrolled') {
      return isConducting
        ? vSource >= 0
          ? '⚡ Diodes D1 & D2 conducting (+ cycle)'
          : '⚡ Diodes D3 & D4 conducting (- cycle)'
        : '⛔ Bridge diodes blocking';
    }
    if (params.topology === 'full_wave_bridge_controlled') {
      return isConducting
        ? vSource >= 0
          ? '⚡ Thyristors T1 & T2 conducting'
          : '⚡ Thyristors T3 & T4 conducting'
        : '⛔ All thyristors blocking';
    }
    if (params.topology === 'semi_controlled_bridge') {
      return isConducting
        ? '⚡ Semi-bridge SCR & Diode pair conducting'
        : '⛔ All devices blocking';
    }
    return isConducting ? '⚡ Devices conducting' : '⛔ Devices blocking';
  };

  // Export report summary with student details
  const handleExportReport = () => {
    const reportText = `=====================================================
POWERSIM VIRTUAL LABORATORY EXPERIMENT REPORT
STUDENT: KRITIKA RATHOR
ROLL NO: 24EE10063
DATE: ${new Date().toLocaleString()}
=====================================================

1. CIRCUIT CONFIGURATION:
- Topology: ${params.topology}
- Load Configuration: ${params.loadType}
- Supply Voltage: ${params.vSupplyRms} V
- Frequency: ${params.frequency} Hz
- Firing Angle (α): ${params.firingAngle}°
- Load Resistance (R): ${params.resistance} Ω
- Load Inductance (L): ${params.inductance} mH
- Freewheeling Diode: ${params.hasFreewheelingDiode ? 'Enabled' : 'Disabled'}

2. WAVEFORM TIMING DATA:
- Window Duration: ${maxTotalWindowMs.toFixed(2)} ms
- Current Inspection Time: ${currentTimeMs.toFixed(2)} ms
- Current Phase Angle: ${currentSample.angleDeg.toFixed(1)}°
- Instantaneous vSource: ${currentSample.vSource.toFixed(2)} V
- Instantaneous vOutput: ${currentSample.vOutput.toFixed(2)} V
- Instantaneous iLoad: ${currentSample.iLoad.toFixed(3)} A
=====================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PowerSim_${params.topology}_KritikaRathor_24EE10063.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const topologies: { id: ConverterTopology; label: string; tag: string }[] = [
    { id: 'half_wave_uncontrolled', label: 'Half-Wave Diode', tag: 'AC-DC' },
    { id: 'half_wave_controlled', label: 'Half-Wave SCR', tag: 'AC-DC' },
    { id: 'full_wave_bridge_uncontrolled', label: 'Full Bridge Diode', tag: 'AC-DC' },
    { id: 'full_wave_bridge_controlled', label: 'Full Controlled SCR', tag: 'AC-DC' },
    { id: 'semi_controlled_bridge', label: 'Semi-Controlled', tag: 'AC-DC' },
    { id: 'buck_converter', label: 'Buck Converter', tag: 'DC-DC' },
    { id: 'boost_converter', label: 'Boost Converter', tag: 'DC-DC' },
    { id: 'inverter_full_bridge', label: 'H-Bridge Inverter', tag: 'DC-AC' },
  ];

  return (
    <div className="min-h-screen bg-[#080911] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Navbar */}
      <Navbar
        currentTopology={params.topology}
        onSelectExperiment={handleSelectExperiment}
        onOpenManual={() => setIsManualOpen(true)}
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onReset={() => setCurrentTimeMs(0)}
        onExportReport={handleExportReport}
      />

      {/* Main Workbench Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-5 space-y-4">
        {/* TOP CONVERTER TOPOLOGY QUICK-SWITCHER */}
        <section className="bg-[#0e101d] border border-[#23253d] rounded-xl p-2.5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between mb-2 px-1 gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-200">
                Converter Topologies
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Click any converter to switch schematic & waveforms immediately
              </span>
            </div>

            {/* Layout View Switcher (Side-by-Side Dual Analysis option) */}
            <div className="flex items-center gap-1 bg-[#121424] p-1 rounded-lg border border-[#23253d] text-xs font-mono">
              <button
                onClick={() => setViewMode('side_by_side')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition ${
                  viewMode === 'side_by_side'
                    ? 'bg-purple-600/35 text-purple-100 font-bold border border-purple-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Side-by-Side Dual Synchronized Analysis (Circuit + Waveform)"
              >
                <Split className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Side-by-Side Analysis</span>
                <span className="sm:hidden">Side-by-Side</span>
              </button>

              <button
                onClick={() => setViewMode('stacked')}
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition ${
                  viewMode === 'stacked'
                    ? 'bg-purple-600/35 text-purple-100 font-bold border border-purple-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Stacked Layout (Circuit on top, Waveform below)"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Stacked</span>
              </button>

              <button
                onClick={() => setViewMode('circuit_only')}
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition ${
                  viewMode === 'circuit_only'
                    ? 'bg-purple-600/35 text-purple-100 font-bold border border-purple-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Full Circuit Diagram View"
              >
                <span>Circuit</span>
              </button>

              <button
                onClick={() => setViewMode('waveform_only')}
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition ${
                  viewMode === 'waveform_only'
                    ? 'bg-purple-600/35 text-purple-100 font-bold border border-purple-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Full Oscilloscope Screen"
              >
                <span>Waveform</span>
              </button>
            </div>
          </div>

          {/* Topologies grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {topologies.map((t) => {
              const active = params.topology === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTopology(t.id)}
                  className={`flex flex-col items-start p-2 rounded-lg border text-left cursor-pointer transition text-xs font-mono relative overflow-hidden ${
                    active
                      ? 'bg-gradient-to-b from-purple-600/30 via-violet-800/20 to-purple-950/40 border-purple-400 text-purple-100 font-bold shadow-lg shadow-purple-950/70'
                      : 'bg-[#121424] border-[#22243d] text-slate-300 hover:bg-[#1a1c30] hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">
                      {t.tag}
                    </span>
                    {active && <Check className="w-3 h-3 text-purple-400" />}
                  </div>
                  <span className="font-semibold truncate w-full text-[11px] mt-0.5">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SYNCHRONIZED INTERACTIVE TIME & CONDUCTION SCRUBBER */}
        <section className="bg-[#0e101d] border border-purple-500/30 rounded-xl p-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-200">
                Synchronized Circuit & Waveform Analyzer
              </span>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                Live State: {getConductingStateText()}
              </span>
            </div>

            {/* Step Controls for Frame-by-Frame inspection */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => handleStep(-1)}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#141628] hover:bg-[#1f223a] text-slate-300 hover:text-white rounded border border-[#23253d] cursor-pointer transition"
                title="Step backward 1 ms / 18°"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-purple-400" />
                <span>-1ms</span>
              </button>
              <button
                onClick={() => handleStep(1)}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#141628] hover:bg-[#1f223a] text-slate-300 hover:text-white rounded border border-[#23253d] cursor-pointer transition"
                title="Step forward 1 ms / 18°"
              >
                <span>+1ms</span>
                <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
              </button>

              <button
                onClick={() => setShowParametersDesk(!showParametersDesk)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer transition ${
                  showParametersDesk
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 font-semibold'
                    : 'bg-[#141628] text-slate-400 border-[#23253d] hover:text-slate-200'
                }`}
                title="Toggle Circuit Parameters & Load Setup"
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                <span>Parameters Desk</span>
              </button>
            </div>
          </div>

          {/* Interactive Scrub Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              t = 0
            </span>
            <input
              type="range"
              min="0"
              max={maxTotalWindowMs}
              step={maxTotalWindowMs / 200}
              value={currentTimeMs % maxTotalWindowMs}
              onChange={(e) => {
                setIsRunning(false);
                setCurrentTimeMs(Number(e.target.value));
              }}
              className="flex-1 accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="text-[11px] font-mono text-purple-300 font-bold whitespace-nowrap bg-[#141628] px-2 py-1 rounded border border-purple-500/30">
              {currentTimeMs.toFixed(2)} ms ({currentSample.angleDeg.toFixed(1)}°)
            </span>
          </div>
        </section>

        {/* WORKBENCH: SIDE-BY-SIDE OR STACKED ANALYSIS */}
        {viewMode === 'side_by_side' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* Left: Circuit Schematic */}
            <div className="h-full min-h-[460px] flex flex-col">
              <CircuitViewer
                params={params}
                currentSample={currentSample}
                currentTimeMs={currentTimeMs}
                activeProbe={activeProbe}
                onSelectProbe={setActiveProbe}
                onParamChange={handleParamChange}
              />
            </div>

            {/* Right: Virtual Oscilloscope */}
            <div className="h-full min-h-[460px] flex flex-col">
              <Oscilloscope
                samples={simulation.samples}
                currentTimeMs={currentTimeMs}
                isRunning={isRunning}
                onToggleRun={() => setIsRunning(!isRunning)}
                onResetTime={() => setCurrentTimeMs(0)}
                onSeekTime={(t) => setCurrentTimeMs(t)}
                timeScaleMs={timeScaleMs}
                setTimeScaleMs={setTimeScaleMs}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                converterName={params.topology}
                highlightedProbe={activeProbe}
                onSelectProbe={setActiveProbe}
              />
            </div>
          </div>
        )}

        {viewMode === 'stacked' && (
          <div className="space-y-4">
            <div className="min-h-[400px]">
              <CircuitViewer
                params={params}
                currentSample={currentSample}
                currentTimeMs={currentTimeMs}
                activeProbe={activeProbe}
                onSelectProbe={setActiveProbe}
                onParamChange={handleParamChange}
              />
            </div>
            <div className="min-h-[460px]">
              <Oscilloscope
                samples={simulation.samples}
                currentTimeMs={currentTimeMs}
                isRunning={isRunning}
                onToggleRun={() => setIsRunning(!isRunning)}
                onResetTime={() => setCurrentTimeMs(0)}
                onSeekTime={(t) => setCurrentTimeMs(t)}
                timeScaleMs={timeScaleMs}
                setTimeScaleMs={setTimeScaleMs}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                converterName={params.topology}
                highlightedProbe={activeProbe}
                onSelectProbe={setActiveProbe}
              />
            </div>
          </div>
        )}

        {viewMode === 'circuit_only' && (
          <div className="min-h-[550px]">
            <CircuitViewer
              params={params}
              currentSample={currentSample}
              currentTimeMs={currentTimeMs}
              activeProbe={activeProbe}
              onSelectProbe={setActiveProbe}
              onParamChange={handleParamChange}
            />
          </div>
        )}

        {viewMode === 'waveform_only' && (
          <div className="min-h-[550px]">
            <Oscilloscope
              samples={simulation.samples}
              currentTimeMs={currentTimeMs}
              isRunning={isRunning}
              onToggleRun={() => setIsRunning(!isRunning)}
              onResetTime={() => setCurrentTimeMs(0)}
              onSeekTime={(t) => setCurrentTimeMs(t)}
              timeScaleMs={timeScaleMs}
              setTimeScaleMs={setTimeScaleMs}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              converterName={params.topology}
              highlightedProbe={activeProbe}
              onSelectProbe={setActiveProbe}
            />
          </div>
        )}

        {/* PARAMETERS CONTROL DESK (Without any calculated laboratory results or quality ripple metrics) */}
        {showParametersDesk && (
          <section className="bg-[#0b0c16] border border-[#23253d] rounded-xl overflow-hidden shadow-2xl">
            <ParameterControls
              params={params}
              onChange={handleParamChange}
              onResetDefaults={handleResetDefaults}
            />
          </section>
        )}
      </main>

      {/* Lab Manual Modal */}
      <LabManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
    </div>
  );
}
