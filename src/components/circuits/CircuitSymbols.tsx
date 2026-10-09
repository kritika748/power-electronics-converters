import React from 'react';

// Diode Symbol
export const DiodeSymbol: React.FC<{
  x: number;
  y: number;
  rotation?: number;
  label?: string;
  isConducting?: boolean;
  voltageDrop?: number;
}> = ({ x, y, rotation = 0, label = 'D', isConducting = false }) => {
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      className="cursor-pointer transition-all duration-200"
    >
      {/* Conduction Glow Aura */}
      {isConducting && (
        <circle
          cx="0"
          cy="0"
          r="28"
          className="fill-emerald-400/25 stroke-emerald-400/80 stroke-2 animate-pulse drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
        />
      )}

      {/* Leads */}
      <line x1="-24" y1="0" x2="-14" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <line x1="14" y1="0" x2="24" y2="0" stroke="#64748b" strokeWidth="2.5" />

      {/* Diode Triangle */}
      <polygon
        points="-14,-13 -14,13 14,0"
        className={
          isConducting
            ? 'fill-emerald-500 stroke-emerald-300 stroke-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]'
            : 'fill-[#161828] stroke-slate-500 stroke-2'
        }
      />

      {/* Cathode Line */}
      <line
        x1="14"
        y1="-13"
        x2="14"
        y2="13"
        className={isConducting ? 'stroke-emerald-200 stroke-3' : 'stroke-slate-400 stroke-2.5'}
      />

      {/* Label */}
      <text
        x="0"
        y="-18"
        textAnchor="middle"
        className={`text-[11px] font-mono font-bold select-none ${
          isConducting ? 'fill-emerald-300 font-extrabold' : 'fill-slate-300'
        }`}
      >
        {label}
      </text>

      {/* State badge */}
      <text
        x="0"
        y="25"
        textAnchor="middle"
        className={`text-[9px] font-mono select-none ${
          isConducting ? 'fill-emerald-300 font-bold' : 'fill-slate-500'
        }`}
      >
        {isConducting ? 'ON' : 'OFF'}
      </text>
    </g>
  );
};

// Thyristor (SCR) Symbol
export const SCRSymbol: React.FC<{
  x: number;
  y: number;
  rotation?: number;
  label?: string;
  isConducting?: boolean;
  isGateTriggered?: boolean;
}> = ({
  x,
  y,
  rotation = 0,
  label = 'T1',
  isConducting = false,
  isGateTriggered = false,
}) => {
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      className="cursor-pointer transition-all duration-200"
    >
      {/* Conduction Glow Aura */}
      {isConducting && (
        <circle
          cx="0"
          cy="0"
          r="28"
          className="fill-emerald-400/25 stroke-emerald-400/80 stroke-2 animate-pulse drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
        />
      )}

      {/* Gate Firing Flash */}
      {isGateTriggered && (
        <circle
          cx="14"
          cy="12"
          r="12"
          className="fill-fuchsia-400/40 stroke-fuchsia-400 stroke-2 animate-ping"
        />
      )}

      {/* Anode / Cathode leads */}
      <line x1="-24" y1="0" x2="-14" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <line x1="14" y1="0" x2="24" y2="0" stroke="#64748b" strokeWidth="2.5" />

      {/* Gate Terminal lead */}
      <line
        x1="14"
        y1="5"
        x2="22"
        y2="14"
        className={
          isGateTriggered
            ? 'stroke-fuchsia-400 stroke-2.5 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)]'
            : 'stroke-purple-400/70 stroke-2'
        }
      />
      <circle
        cx="22"
        cy="14"
        r="2.5"
        className={isGateTriggered ? 'fill-fuchsia-300' : 'fill-purple-400'}
      />

      {/* Triangle */}
      <polygon
        points="-14,-13 -14,13 14,0"
        className={
          isConducting
            ? 'fill-emerald-500 stroke-emerald-300 stroke-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]'
            : 'fill-[#161828] stroke-slate-500 stroke-2'
        }
      />

      {/* Cathode line */}
      <line
        x1="14"
        y1="-13"
        x2="14"
        y2="13"
        className={isConducting ? 'stroke-emerald-200 stroke-3' : 'stroke-slate-400 stroke-2.5'}
      />

      {/* Label */}
      <text
        x="0"
        y="-18"
        textAnchor="middle"
        className={`text-[11px] font-mono font-bold select-none ${
          isConducting ? 'fill-emerald-300 font-extrabold' : 'fill-slate-300'
        }`}
      >
        {label}
      </text>

      {/* Gate indicator text */}
      <text
        x="24"
        y="25"
        textAnchor="middle"
        className={`text-[8px] font-mono font-bold select-none ${
          isGateTriggered ? 'fill-fuchsia-400 font-extrabold' : 'fill-purple-400/80'
        }`}
      >
        G
      </text>

      <text
        x="0"
        y="25"
        textAnchor="middle"
        className={`text-[9px] font-mono select-none ${
          isConducting ? 'fill-emerald-300 font-bold' : 'fill-slate-500'
        }`}
      >
        {isConducting ? 'ON' : 'OFF'}
      </text>
    </g>
  );
};

// MOSFET / Switch Symbol
export const SwitchSymbol: React.FC<{
  x: number;
  y: number;
  label?: string;
  isClosed?: boolean;
}> = ({ x, y, label = 'S1', isClosed = false }) => {
  return (
    <g transform={`translate(${x}, ${y})`} className="cursor-pointer">
      {isClosed && (
        <circle
          cx="0"
          cy="0"
          r="26"
          className="fill-emerald-400/25 stroke-emerald-400/80 stroke-2 animate-pulse drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
        />
      )}

      {/* Terminals */}
      <line x1="-24" y1="0" x2="-10" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <circle cx="-10" cy="0" r="3" className="fill-purple-300 stroke-[#161828] stroke-1.5" />
      <circle cx="10" cy="0" r="3" className="fill-purple-300 stroke-[#161828] stroke-1.5" />
      <line x1="10" y1="0" x2="24" y2="0" stroke="#64748b" strokeWidth="2.5" />

      {/* Switch Blade */}
      {isClosed ? (
        <line
          x1="-10"
          y1="0"
          x2="10"
          y2="0"
          className="stroke-emerald-400 stroke-3 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]"
        />
      ) : (
        <line x1="-10" y1="0" x2="8" y2="-12" className="stroke-rose-400 stroke-2.5" />
      )}

      <text
        x="0"
        y="-18"
        textAnchor="middle"
        className={`text-[11px] font-mono font-bold select-none ${
          isClosed ? 'fill-emerald-400' : 'fill-slate-300'
        }`}
      >
        {label}
      </text>

      <text
        x="0"
        y="22"
        textAnchor="middle"
        className={`text-[9px] font-mono select-none ${
          isClosed ? 'fill-emerald-300 font-bold' : 'fill-slate-500'
        }`}
      >
        {isClosed ? 'CLOSED' : 'OPEN'}
      </text>
    </g>
  );
};

// AC Source Symbol
export const ACSourceSymbol: React.FC<{
  x: number;
  y: number;
  vRms: number;
  freq: number;
  instantaneousV?: number;
}> = ({ x, y, vRms, freq, instantaneousV }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        cx="0"
        cy="0"
        r="24"
        className="fill-[#121324] stroke-purple-400 stroke-2.5 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
      />
      {/* Sine curve inside */}
      <path
        d="M -12 0 Q -6 -12 0 0 T 12 0"
        fill="none"
        className="stroke-purple-300 stroke-2"
      />
      <text
        x="-32"
        y="-4"
        textAnchor="end"
        className="text-[11px] font-mono font-bold fill-purple-300 select-none"
      >
        {vRms}V RMS
      </text>
      <text
        x="-32"
        y="12"
        textAnchor="end"
        className="text-[10px] font-mono fill-purple-400/80 select-none"
      >
        {freq}Hz
      </text>
      {instantaneousV !== undefined && (
        <text
          x="0"
          y="38"
          textAnchor="middle"
          className="text-[10px] font-mono font-bold fill-purple-300 select-none"
        >
          {instantaneousV.toFixed(1)}V
        </text>
      )}
    </g>
  );
};

// DC Voltage Source Symbol
export const DCSourceSymbol: React.FC<{
  x: number;
  y: number;
  voltage: number;
  label?: string;
}> = ({ x, y, voltage, label = 'Vin' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Long positive plate */}
      <line x1="-16" y1="-8" x2="16" y2="-8" stroke="#a855f7" strokeWidth="3" />
      {/* Short negative plate */}
      <line x1="-9" y1="8" x2="9" y2="8" stroke="#a855f7" strokeWidth="4" />
      <text
        x="18"
        y="-7"
        className="text-[11px] font-mono font-bold fill-purple-300 select-none"
      >
        +
      </text>
      <text
        x="12"
        y="11"
        className="text-[11px] font-mono font-bold fill-purple-400 select-none"
      >
        -
      </text>
      <text
        x="-24"
        y="4"
        textAnchor="end"
        className="text-[11px] font-mono font-bold fill-purple-200 select-none"
      >
        {label}: {voltage}V
      </text>
    </g>
  );
};

// Resistor Symbol
export const ResistorSymbol: React.FC<{
  x: number;
  y: number;
  vertical?: boolean;
  value: number;
  label?: string;
}> = ({ x, y, vertical = false, value, label = 'R' }) => {
  return (
    <g transform={`translate(${x}, ${y}) ${vertical ? 'rotate(90)' : ''}`}>
      <line x1="-25" y1="0" x2="-15" y2="0" stroke="#64748b" strokeWidth="2.5" />
      {/* Zig-zag */}
      <path
        d="M -15 0 L -10 -8 L -5 8 L 0 -8 L 5 8 L 10 -8 L 15 0"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="15" y1="0" x2="25" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <text
        x="0"
        y={vertical ? '22' : '-14'}
        textAnchor="middle"
        transform={vertical ? `rotate(-90)` : ''}
        className="text-[10px] font-mono font-bold fill-amber-300 select-none"
      >
        {label} ({value}Ω)
      </text>
    </g>
  );
};

// Inductor Symbol
export const InductorSymbol: React.FC<{
  x: number;
  y: number;
  vertical?: boolean;
  value: number;
  label?: string;
  isEnergized?: boolean;
}> = ({ x, y, vertical = false, value, label = 'L', isEnergized = false }) => {
  return (
    <g transform={`translate(${x}, ${y}) ${vertical ? 'rotate(90)' : ''}`}>
      <line x1="-30" y1="0" x2="-20" y2="0" stroke="#64748b" strokeWidth="2.5" />
      {/* 4 coiled loops */}
      <path
        d="M -20 0 A 5 7 0 0 1 -10 0 A 5 7 0 0 1 0 0 A 5 7 0 0 1 10 0 A 5 7 0 0 1 20 0"
        fill="none"
        className={
          isEnergized
            ? 'stroke-emerald-400 stroke-2.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
            : 'stroke-emerald-500/80 stroke-2'
        }
      />
      <line x1="20" y1="0" x2="30" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <text
        x="0"
        y={vertical ? '24' : '-14'}
        textAnchor="middle"
        transform={vertical ? `rotate(-90)` : ''}
        className="text-[10px] font-mono font-bold fill-emerald-300 select-none"
      >
        {label} ({value}mH)
      </text>
    </g>
  );
};

// Capacitor Symbol
export const CapacitorSymbol: React.FC<{
  x: number;
  y: number;
  vertical?: boolean;
  value: number;
  label?: string;
}> = ({ x, y, vertical = false, value, label = 'C' }) => {
  return (
    <g transform={`translate(${x}, ${y}) ${vertical ? 'rotate(90)' : ''}`}>
      <line x1="-20" y1="0" x2="-6" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <line x1="-6" y1="-12" x2="-6" y2="12" stroke="#c084fc" strokeWidth="3" />
      <line x1="6" y1="-12" x2="6" y2="12" stroke="#c084fc" strokeWidth="3" />
      <line x1="6" y1="0" x2="20" y2="0" stroke="#64748b" strokeWidth="2.5" />
      <text
        x="0"
        y={vertical ? '22' : '-16'}
        textAnchor="middle"
        transform={vertical ? `rotate(-90)` : ''}
        className="text-[10px] font-mono font-bold fill-purple-300 select-none"
      >
        {label} ({value}µF)
      </text>
    </g>
  );
};

// Ground Symbol
export const GroundSymbol: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1="0" y1="0" x2="0" y2="10" stroke="#64748b" strokeWidth="2.5" />
      <line x1="-12" y1="10" x2="12" y2="10" stroke="#64748b" strokeWidth="2.5" />
      <line x1="-7" y1="15" x2="7" y2="15" stroke="#64748b" strokeWidth="2" />
      <line x1="-2" y1="20" x2="2" y2="20" stroke="#64748b" strokeWidth="1.5" />
    </g>
  );
};
