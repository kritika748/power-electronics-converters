import React, { useRef, useState, useMemo } from 'react';
import { SimulationSample } from '../../types/converter';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Layers,
  Columns,
  ShieldCheck,
  Ruler,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface OscilloscopeProps {
  samples: SimulationSample[];
  currentTimeMs: number;
  isRunning: boolean;
  onToggleRun: () => void;
  onResetTime: () => void;
  onSeekTime: (timeMs: number) => void;
  timeScaleMs: number;
  setTimeScaleMs: (scale: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  converterName: string;
  highlightedProbe?: string;
  onSelectProbe?: (probeId: string) => void;
}

export interface ChannelConfig {
  id: 'vSource' | 'vOutput' | 'iLoad' | 'vDevice' | 'gatePulse';
  name: string;
  unit: string;
  color: string;
  enabled: boolean;
  scaleFactor: number;
  offsetY: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  samples,
  currentTimeMs,
  isRunning,
  onToggleRun,
  onResetTime,
  onSeekTime,
  playbackSpeed,
  setPlaybackSpeed,
  converterName,
  highlightedProbe,
  onSelectProbe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'stacked' | 'overlay'>('stacked');
  const [showDelta, setShowDelta] = useState<boolean>(false);
  const [hoverSample, setHoverSample] = useState<SimulationSample | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [zoomFactor, setZoomFactor] = useState<number>(1);

  // Delta cursors position (fraction of window 0..1)
  const [cursorAFrac, setCursorAFrac] = useState<number>(0.25);
  const [cursorBFrac, setCursorBFrac] = useState<number>(0.75);
  const [draggingCursor, setDraggingCursor] = useState<'A' | 'B' | null>(null);

  const isDcDc = converterName.includes('buck') || converterName.includes('boost');
  const isInverter = converterName.includes('inverter');

  // Dynamic channel names based on converter type with distinctive palette:
  // Solar Gold (#f59e0b) | Neon Violet (#c084fc) | Emerald Mint (#10b981) | Rose (#f43f5e) | Sky Cyan (#38bdf8)
  const channelDefs = useMemo(() => {
    if (isDcDc) {
      return [
        { id: 'vSource' as const, name: 'Vin Supply DC', unit: 'V', color: '#f59e0b' },
        { id: 'vOutput' as const, name: 'Vo Output DC', unit: 'V', color: '#c084fc' },
        { id: 'iLoad' as const, name: 'iL Inductor Current', unit: 'A', color: '#10b981' },
        { id: 'gatePulse' as const, name: 'Gate PWM Pulses', unit: 'V', color: '#f43f5e' },
        { id: 'vDevice' as const, name: 'V_switch Voltage', unit: 'V', color: '#38bdf8' },
      ];
    } else if (isInverter) {
      return [
        { id: 'vSource' as const, name: 'Vdc Bus Input', unit: 'V', color: '#f59e0b' },
        { id: 'vOutput' as const, name: 'vo(t) AC Output', unit: 'V', color: '#c084fc' },
        { id: 'iLoad' as const, name: 'io(t) Load Current', unit: 'A', color: '#10b981' },
        { id: 'gatePulse' as const, name: 'Gate Trigger Pulses', unit: 'V', color: '#f43f5e' },
        { id: 'vDevice' as const, name: 'V_switch Voltage', unit: 'V', color: '#38bdf8' },
      ];
    } else {
      return [
        { id: 'vSource' as const, name: 'vs(t) AC Supply', unit: 'V', color: '#f59e0b' },
        { id: 'vOutput' as const, name: 'vo(t) Output Voltage', unit: 'V', color: '#c084fc' },
        { id: 'iLoad' as const, name: 'io(t) Load Current', unit: 'A', color: '#10b981' },
        { id: 'gatePulse' as const, name: 'vg(t) Gate Pulses', unit: 'V', color: '#f43f5e' },
        { id: 'vDevice' as const, name: 'vT(t) Device Voltage', unit: 'V', color: '#38bdf8' },
      ];
    }
  }, [isDcDc, isInverter]);

  const [disabledChannels, setDisabledChannels] = useState<Record<string, boolean>>({
    vDevice: true, // vDevice disabled by default to maintain clean focus
  });

  const channels: ChannelConfig[] = useMemo(() => {
    return channelDefs.map((def) => ({
      ...def,
      enabled: !disabledChannels[def.id],
      scaleFactor: 1,
      offsetY: 0,
    }));
  }, [channelDefs, disabledChannels]);

  const toggleChannel = (id: ChannelConfig['id']) => {
    setDisabledChannels((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    onSelectProbe?.(id);
  };

  // Find sample closest to current time
  const currentSample = useMemo(() => {
    if (!samples.length) return null;
    const maxT = samples[samples.length - 1].time || 1;
    const tMod = currentTimeMs % maxT;
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
  }, [samples, currentTimeMs]);

  // Calculate waveform bounds
  const rawMaxTime = samples.length ? samples[samples.length - 1].time : 40;
  const maxTime = rawMaxTime / zoomFactor;

  let maxV = 10;
  let minV = -10;
  let maxI = 1;
  let minI = 0;

  for (const s of samples) {
    if (s.vSource > maxV) maxV = s.vSource;
    if (s.vSource < minV) minV = s.vSource;
    if (s.vOutput > maxV) maxV = s.vOutput;
    if (s.vOutput < minV) minV = s.vOutput;
    if (s.vDevice > maxV) maxV = s.vDevice;
    if (s.vDevice < minV) minV = s.vDevice;
    if (s.iLoad > maxI) maxI = s.iLoad;
    if (s.iLoad < minI) minI = s.iLoad;
  }

  const vRange = Math.max(20, Math.max(Math.abs(maxV), Math.abs(minV)) * 1.15);
  const iRange = Math.max(1, maxI * 1.25);

  const activeChannels = channels.filter((c) => c.enabled);

  // Samples for delta cursor measurement
  const sampleA = useMemo(() => {
    if (!samples.length) return null;
    const t = cursorAFrac * rawMaxTime;
    return samples.reduce((prev, curr) =>
      Math.abs(curr.time - t) < Math.abs(prev.time - t) ? curr : prev
    );
  }, [samples, cursorAFrac, rawMaxTime]);

  const sampleB = useMemo(() => {
    if (!samples.length) return null;
    const t = cursorBFrac * rawMaxTime;
    return samples.reduce((prev, curr) =>
      Math.abs(curr.time - t) < Math.abs(prev.time - t) ? curr : prev
    );
  }, [samples, cursorBFrac, rawMaxTime]);

  // Delta calculations
  const deltaMetrics = useMemo(() => {
    if (!sampleA || !sampleB) return null;
    const dt = Math.abs(sampleB.time - sampleA.time);
    const dTheta = Math.abs(sampleB.angleDeg - sampleA.angleDeg);
    const dVo = Math.abs(sampleB.vOutput - sampleA.vOutput);
    const dIo = Math.abs(sampleB.iLoad - sampleA.iLoad);
    return { dt, dTheta, dVo, dIo };
  }, [sampleA, sampleB]);

  // Handle seeking / scrubbing by clicking or dragging on waveform
  const handleSeek = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const fraction = x / rect.width;

    if (showDelta && draggingCursor) {
      if (draggingCursor === 'A') setCursorAFrac(fraction);
      if (draggingCursor === 'B') setCursorBFrac(fraction);
      return;
    }

    if (samples.length > 0) {
      onSeekTime(fraction * rawMaxTime);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const fraction = x / rect.width;
    setHoverX(x);

    const t = fraction * rawMaxTime;
    if (samples.length > 0) {
      const best = samples.reduce((prev, curr) =>
        Math.abs(curr.time - t) < Math.abs(prev.time - t) ? curr : prev
      );
      setHoverSample(best);
    }

    if (draggingCursor === 'A') setCursorAFrac(fraction);
    if (draggingCursor === 'B') setCursorBFrac(fraction);
  };

  const handleMouseLeave = () => {
    setHoverSample(null);
    setHoverX(null);
    setDraggingCursor(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!samples.length) return;
    const header =
      'Time(ms),Angle(deg),v_Source(V),v_Output(V),i_Load(A),v_Device(V),Gate_Pulse(V)\n';
    const rows = samples
      .map(
        (s) =>
          `${s.time.toFixed(4)},${s.angleDeg.toFixed(2)},${s.vSource.toFixed(
            3
          )},${s.vOutput.toFixed(3)},${s.iLoad.toFixed(4)},${s.vDevice.toFixed(
            3
          )},${s.gatePulse.toFixed(1)}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${converterName.replace(/\s+/g, '_')}_waveforms.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to generate SVG polyline path for a channel
  const generatePath = (
    channelId: ChannelConfig['id'],
    width: number,
    height: number,
    yZero: number,
    yScale: number
  ) => {
    if (!samples.length) return '';
    return samples
      .map((s, idx) => {
        const x = (s.time / rawMaxTime) * width;
        const val = s[channelId] || 0;
        const y = yZero - val * yScale;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Current time cursor position
  const cursorFraction = rawMaxTime > 0 ? (currentTimeMs % rawMaxTime) / rawMaxTime : 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-[#0b0c16] border border-[#23253d] rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Oscilloscope Header Controls */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-[#121424] border-b border-[#23253d] gap-2">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Running State Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#090a12] rounded border border-[#23253d]">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning
                  ? 'bg-purple-400 animate-pulse shadow-[0_0_6px_rgba(192,132,252,0.8)]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
              {isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>

          {/* Run / Pause Button */}
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-mono font-semibold rounded transition cursor-pointer ${
              isRunning
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Run
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetTime}
            title="Reset Time Cursor to t = 0"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#1a1c30] rounded transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <span>Speed:</span>
            {[0.25, 0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-purple-500/25 text-purple-200 font-bold border border-purple-500/40'
                    : 'text-slate-400 hover:bg-[#1a1c30]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle, Delta cursors, Zoom & CSV export */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Delta Measurement Tool Button */}
          <button
            onClick={() => setShowDelta(!showDelta)}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border transition cursor-pointer ${
              showDelta
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 font-bold'
                : 'bg-[#121424] text-slate-400 border-[#23253d] hover:text-slate-200'
            }`}
            title="Toggle Δt & ΔV Measurement Cursors"
          >
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            <span>Δ Cursor</span>
          </button>

          {/* Stacked / Overlay switch */}
          <div className="flex items-center bg-[#090a12] p-0.5 rounded border border-[#23253d] text-[11px] font-mono">
            <button
              onClick={() => setViewMode('stacked')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ${
                viewMode === 'stacked'
                  ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stacked Channels View"
            >
              <Columns className="w-3 h-3 text-purple-400" /> Stacked
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ${
                viewMode === 'overlay'
                  ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Combined Overlay Screen"
            >
              <Layers className="w-3 h-3 text-purple-400" /> Overlay
            </button>
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium bg-[#1a1c30] hover:bg-[#232644] text-purple-200 rounded border border-purple-800/60 transition cursor-pointer"
            title="Export CSV Waveform Samples"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" /> CSV
          </button>
        </div>
      </div>

      {/* Channel Toggles Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#0e101c] border-b border-[#23253d] text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {channels.map((ch) => {
            const isHighlighted = highlightedProbe === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border cursor-pointer transition ${
                  ch.enabled
                    ? isHighlighted
                      ? 'bg-purple-500/30 text-purple-100 ring-1 ring-purple-400 shadow-md'
                      : 'bg-[#15172a] text-slate-200 shadow-xs'
                    : 'bg-transparent text-slate-600 border-transparent opacity-60'
                }`}
                style={{
                  borderColor: ch.enabled
                    ? isHighlighted
                      ? '#c084fc'
                      : `${ch.color}88`
                    : 'transparent',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-[0_0_4px_currentColor]"
                  style={{ backgroundColor: ch.color, color: ch.color }}
                />
                <span className="font-medium">{ch.name.split(' ')[0]}</span>
                {ch.enabled ? (
                  <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-600 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Live Instantaneous Probe Readout on Oscilloscope Header */}
        {currentSample && (
          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              v<sub>s</sub>:{' '}
              <strong className="text-amber-400">{currentSample.vSource.toFixed(1)}V</strong>
            </span>
            <span>
              v<sub>o</sub>:{' '}
              <strong className="text-purple-300">{currentSample.vOutput.toFixed(1)}V</strong>
            </span>
            <span>
              i<sub>o</sub>:{' '}
              <strong className="text-emerald-400">{currentSample.iLoad.toFixed(2)}A</strong>
            </span>
          </div>
        )}
      </div>

      {/* Delta Measurement HUD (When Enabled) */}
      {showDelta && deltaMetrics && sampleA && sampleB && (
        <div className="px-3.5 py-1.5 bg-[#141829] border-b border-amber-500/30 flex flex-wrap items-center justify-between text-xs font-mono text-amber-200 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold flex items-center gap-1 text-amber-300">
              <Ruler className="w-3.5 h-3.5" /> Δ Measurement:
            </span>
            <span>
              Δt: <strong className="text-white">{deltaMetrics.dt.toFixed(2)} ms</strong>
            </span>
            <span>
              Δθ: <strong className="text-white">{deltaMetrics.dTheta.toFixed(1)}°</strong>
            </span>
            <span>
              ΔVo: <strong className="text-white">{deltaMetrics.dVo.toFixed(1)} V</strong>
            </span>
            <span>
              ΔIo: <strong className="text-white">{deltaMetrics.dIo.toFixed(2)} A</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="text-amber-400">● Cursor A: {sampleA.time.toFixed(1)}ms</span>
            <span className="text-cyan-400">● Cursor B: {sampleB.time.toFixed(1)}ms</span>
            <span className="italic">(Click & drag markers to reposition)</span>
          </div>
        </div>
      )}

      {/* Main Oscilloscope Screen */}
      <div className="flex-1 relative bg-[#06070d] overflow-hidden p-2 select-none flex flex-col justify-between">
        {viewMode === 'overlay' ? (
          // --- COMBINED OVERLAY MODE ---
          <div className="relative w-full h-full flex flex-col justify-center">
            <svg
              viewBox="0 0 800 360"
              className="w-full h-full cursor-crosshair drop-shadow"
              onClick={handleSeek}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <pattern
                  id="scopeGrid"
                  width="80"
                  height="36"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 80 0 L 0 0 0 36"
                    fill="none"
                    stroke="#1c1f36"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </pattern>
              </defs>

              <rect width="800" height="360" fill="#06070d" />
              <rect width="800" height="360" fill="url(#scopeGrid)" />

              {/* Center Axes */}
              <line x1="0" y1="180" x2="800" y2="180" stroke="#2d3258" strokeWidth="1.5" />
              <line x1="400" y1="0" x2="400" y2="360" stroke="#2d3258" strokeWidth="1.5" />

              {/* Waveform Traces */}
              {channels.map((ch) => {
                if (!ch.enabled) return null;
                const isCurrent = ch.id === 'iLoad';
                const isGate = ch.id === 'gatePulse';
                const scale = isGate ? 14 : isCurrent ? 140 / iRange : 140 / vRange;
                const pathData = generatePath(ch.id, 800, 360, 180, scale);
                const isFocused = highlightedProbe === ch.id;

                return (
                  <path
                    key={ch.id}
                    d={pathData}
                    fill="none"
                    stroke={ch.color}
                    strokeWidth={isFocused ? '3.5' : '2.4'}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 ${isFocused ? '8px' : '5px'} ${ch.color}cc)`,
                    }}
                  />
                );
              })}

              {/* Hover Inspection Line */}
              {hoverX !== null && (
                <line
                  x1={hoverX}
                  y1="0"
                  x2={hoverX}
                  y2="360"
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              {/* Delta Cursors */}
              {showDelta && (
                <>
                  {/* Cursor A */}
                  <line
                    x1={cursorAFrac * 800}
                    y1="0"
                    x2={cursorAFrac * 800}
                    y2="360"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="cursor-ew-resize"
                    onMouseDown={() => setDraggingCursor('A')}
                  />
                  <rect
                    x={cursorAFrac * 800 - 14}
                    y="4"
                    width="28"
                    height="16"
                    rx="3"
                    fill="#f59e0b"
                    className="cursor-ew-resize"
                    onMouseDown={() => setDraggingCursor('A')}
                  />
                  <text
                    x={cursorAFrac * 800}
                    y="16"
                    textAnchor="middle"
                    fill="#000"
                    fontSize="10"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    A
                  </text>

                  {/* Cursor B */}
                  <line
                    x1={cursorBFrac * 800}
                    y1="0"
                    x2={cursorBFrac * 800}
                    y2="360"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="cursor-ew-resize"
                    onMouseDown={() => setDraggingCursor('B')}
                  />
                  <rect
                    x={cursorBFrac * 800 - 14}
                    y="4"
                    width="28"
                    height="16"
                    rx="3"
                    fill="#06b6d4"
                    className="cursor-ew-resize"
                    onMouseDown={() => setDraggingCursor('B')}
                  />
                  <text
                    x={cursorBFrac * 800}
                    y="16"
                    textAnchor="middle"
                    fill="#000"
                    fontSize="10"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    B
                  </text>
                </>
              )}

              {/* Synchronized Real-Time Cursor Line */}
              <line
                x1={cursorFraction * 800}
                y1="0"
                x2={cursorFraction * 800}
                y2="360"
                stroke="#c084fc"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <circle
                cx={cursorFraction * 800}
                cy="18"
                r="4"
                fill="#c084fc"
                className="animate-pulse drop-shadow-[0_0_6px_rgba(192,132,252,0.9)]"
              />
            </svg>
          </div>
        ) : (
          // --- STACKED VIEW MODE (Textbook Multi-Trace Style) ---
          <div className="flex-1 flex flex-col justify-around gap-1.5 h-full">
            {activeChannels.map((ch) => {
              const isCurrent = ch.id === 'iLoad';
              const isGate = ch.id === 'gatePulse';
              const scale = isGate ? 2.5 : isCurrent ? 26 / iRange : 26 / vRange;
              const pathData = generatePath(ch.id, 800, 65, 34, scale);
              const isFocused = highlightedProbe === ch.id;

              const liveVal = currentSample ? currentSample[ch.id] || 0 : 0;

              return (
                <div
                  key={ch.id}
                  className={`flex-1 min-h-[58px] relative rounded-lg border flex flex-col justify-center px-1 transition ${
                    isFocused
                      ? 'bg-[#121528] border-purple-500/70 shadow-md shadow-purple-950/40'
                      : 'bg-[#0b0d18] border-[#1e2136]'
                  }`}
                >
                  {/* Channel Header Tag */}
                  <div className="absolute top-1 left-2 flex items-center gap-2 z-10 pointer-events-none">
                    <span
                      className="text-[10px] font-mono font-bold tracking-wide uppercase px-1.5 py-0.2 rounded"
                      style={{
                        backgroundColor: `${ch.color}22`,
                        color: ch.color,
                        border: `1px solid ${ch.color}55`,
                      }}
                    >
                      {ch.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-200">
                      {liveVal.toFixed(2)} {ch.unit}
                    </span>
                  </div>

                  {/* Individual SVG trace */}
                  <svg
                    viewBox="0 0 800 68"
                    className="w-full h-full cursor-crosshair"
                    onClick={handleSeek}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Zero reference line */}
                    <line
                      x1="0"
                      y1="34"
                      x2="800"
                      y2="34"
                      stroke="#1c1f36"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Trace path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={ch.color}
                      strokeWidth={isFocused ? '3.0' : '2.3'}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{
                        filter: `drop-shadow(0 0 ${isFocused ? '6px' : '4px'} ${ch.color}aa)`,
                      }}
                    />

                    {/* Delta cursors if shown */}
                    {showDelta && (
                      <>
                        <line
                          x1={cursorAFrac * 800}
                          y1="0"
                          x2={cursorAFrac * 800}
                          y2="68"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1={cursorBFrac * 800}
                          y1="0"
                          x2={cursorBFrac * 800}
                          y2="68"
                          stroke="#06b6d4"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      </>
                    )}

                    {/* Hover line */}
                    {hoverX !== null && (
                      <line
                        x1={hoverX}
                        y1="0"
                        x2={hoverX}
                        y2="68"
                        stroke="#64748b"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Synchronized time cursor */}
                    <line
                      x1={cursorFraction * 800}
                      y1="0"
                      x2={cursorFraction * 800}
                      y2="68"
                      stroke="#c084fc"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        )}

        {/* Hover inspection tooltip */}
        {hoverSample && (
          <div className="absolute bottom-10 right-4 bg-[#14162a]/95 border border-purple-500/40 rounded-lg p-2 shadow-xl backdrop-blur-md text-[11px] font-mono text-slate-200 pointer-events-none z-20 flex items-center gap-3">
            <span className="text-purple-300 font-bold">
              t: {hoverSample.time.toFixed(2)}ms ({hoverSample.angleDeg.toFixed(1)}°)
            </span>
            <span className="text-amber-400">vs: {hoverSample.vSource.toFixed(1)}V</span>
            <span className="text-purple-300">vo: {hoverSample.vOutput.toFixed(1)}V</span>
            <span className="text-emerald-400">io: {hoverSample.iLoad.toFixed(2)}A</span>
          </div>
        )}

        {/* Oscilloscope Interactive Scrubber / Time Scale Bar */}
        <div className="mt-2 pt-2 border-t border-[#1e2136] flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Scale:{' '}
              <strong className="text-slate-200">
                {rawMaxTime < 1
                  ? `${(rawMaxTime * 100).toFixed(1)} µs/div`
                  : `${(rawMaxTime / 10).toFixed(1)} ms/div`}
              </strong>
            </span>
            <span>
              Window:{' '}
              <strong className="text-slate-200">
                {rawMaxTime < 1
                  ? `${(rawMaxTime * 1000).toFixed(1)} µs`
                  : `${rawMaxTime.toFixed(1)} ms`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Click/drag scope to seek</span>
            <span className="text-purple-300 font-bold bg-[#141628] px-2 py-0.5 rounded border border-[#2d3154]">
              t ={' '}
              {rawMaxTime < 1
                ? `${(currentTimeMs * 1000).toFixed(1)} µs`
                : `${currentTimeMs.toFixed(2)} ms`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
