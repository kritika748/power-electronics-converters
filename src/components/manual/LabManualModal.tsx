import React, { useState } from 'react';
import { X, BookOpen, HelpCircle, GraduationCap } from 'lucide-react';

interface LabManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabManualModal: React.FC<LabManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'formulas' | 'viva'>('theory');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0d0f1c] border border-[#262846] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23253d] bg-[#121426]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-bold text-slate-100">
                  Power Electronics Virtual Laboratory Manual
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 font-semibold">
                  <GraduationCap className="w-3 h-3 text-purple-400" />
                  KRITIKA RATHOR · 24EE10063
                </span>
              </div>
              <p className="text-xs font-mono text-purple-300/80">
                Operating Principles, Analytical Formulations & Viva Quiz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1a1c32] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-[#23253d] px-6 bg-[#090a14] text-xs font-mono">
          <button
            onClick={() => setActiveTab('theory')}
            className={`py-3 px-4 border-b-2 font-bold cursor-pointer transition ${
              activeTab === 'theory'
                ? 'border-purple-400 text-purple-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Theory & Operation
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 px-4 border-b-2 font-bold cursor-pointer transition ${
              activeTab === 'formulas'
                ? 'border-purple-400 text-purple-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mathematical Formulas
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`py-3 px-4 border-b-2 font-bold cursor-pointer transition ${
              activeTab === 'viva'
                ? 'border-purple-400 text-purple-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Lab Viva Questions
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-mono text-slate-300 leading-relaxed custom-scrollbar">
          {activeTab === 'theory' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">
                  1. Half-Wave Rectifiers (Uncontrolled & Controlled)
                </h3>
                <p>
                  A half-wave rectifier allows only one half-cycle of an AC voltage waveform to pass through to the load. In uncontrolled rectifiers, a diode conducts whenever forward biased (v<sub>s</sub> &gt; 0). In controlled rectifiers, a Silicon Controlled Rectifier (SCR) blocks forward current until a gate pulse is delivered at firing angle <strong>α</strong>.
                </p>
                <div className="bg-[#121426] p-3 rounded-lg border border-[#23253d]">
                  <strong className="text-purple-200">Inductive Load (R-L Load) Effect:</strong>
                  <p className="mt-1 text-slate-400">
                    When the load contains inductance L, energy is stored in the magnetic field (½ L i<sup>2</sup>). When the input voltage goes negative at π (180°), the inductor reverses its induced voltage polarity (v<sub>L</sub> = -L di/dt) to maintain current flow. This forces the SCR/diode to remain in conduction beyond 180° until current reaches zero at the extinction angle <strong>β</strong> (where β &gt; π). Consequently, negative voltage appears across the load between π and β, reducing average DC voltage.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">
                  2. Role of the Freewheeling Diode (FD)
                </h3>
                <p>
                  Connecting a freewheeling diode across an inductive load prevents negative output voltage spikes. At ωt = π, the supply goes negative, forward-biasing the FD. The FD takes over conduction, clamping load voltage v<sub>o</sub> to 0 V, and the stored inductive current circulates through the closed FD-load loop until exhausted.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>Prevents negative output voltage excursions</li>
                  <li>Increases average DC output voltage V<sub>dc</sub></li>
                  <li>Improves input power factor by reducing reactive energy feedback</li>
                  <li>Protects upstream switches from high inductive reverse dV/dt</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">
                  3. Full-Wave Fully Controlled Bridge Converter (4 SCRs)
                </h3>
                <p>
                  Comprises 4 thyristors (T1, T2, T3, T4). T1 and T2 are triggered simultaneously at α; T3 and T4 are triggered at π + α. Under highly inductive loads (CCM), output voltage can be positive (rectification mode, α &lt; 90°) or negative with positive current (inversion mode, 90° &lt; α &lt; 180° when connected to an active DC load).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">
                  4. Semi-Controlled Bridge Converter (Half-Bridge)
                </h3>
                <p>
                  Replaces two thyristors with diodes (T1, T2, D1, D2). At ωt = π, the diode arm provides natural freewheeling action, clamping v<sub>o</sub> = 0. Therefore, output voltage can never become negative. It offers lower cost and higher power factor compared to the full converter for 1-quadrant drives.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">
                  5. DC-DC Converters (Buck & Boost)
                </h3>
                <p>
                  <strong>Buck Converter (Step-Down):</strong> V<sub>o</sub> = D · V<sub>in</sub> (where D is duty cycle). Inductor and capacitor form a 2nd-order low-pass filter providing clean DC output.
                  <br />
                  <strong>Boost Converter (Step-Up):</strong> V<sub>o</sub> = V<sub>in</sub> / (1 - D). Inductor stores energy during switch ON and releases it in series with the input supply during switch OFF, stepping up the output voltage.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className="bg-[#121426] p-4 rounded-xl border border-[#23253d] space-y-3">
                <h4 className="text-xs font-bold text-purple-300 uppercase">
                  Rectifier Analytical Formulas (Peak V<sub>m</sub> = √2 · V<sub>rms</sub>)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-[#090a14] rounded border border-[#23253d] space-y-1">
                    <span className="text-purple-200 font-bold">Half-Wave Uncontrolled (R Load)</span>
                    <p className="text-slate-400">V<sub>dc</sub> = V<sub>m</sub> / π ≈ 0.318 V<sub>m</sub></p>
                    <p className="text-slate-400">V<sub>rms</sub> = V<sub>m</sub> / 2 = 0.5 V<sub>m</sub></p>
                    <p className="text-slate-400">Ripple Factor RF = 1.21, η = 40.6%</p>
                  </div>

                  <div className="p-2.5 bg-[#090a14] rounded border border-[#23253d] space-y-1">
                    <span className="text-purple-200 font-bold">Half-Wave Controlled (SCR)</span>
                    <p className="text-slate-400">V<sub>dc</sub> = (V<sub>m</sub> / 2π) · (1 + cos α)</p>
                    <p className="text-slate-400">V<sub>rms</sub> = (V<sub>m</sub> / 2) · √[1 - α/π + (sin 2α)/(2π)]</p>
                  </div>

                  <div className="p-2.5 bg-[#090a14] rounded border border-[#23253d] space-y-1">
                    <span className="text-purple-200 font-bold">Full-Wave Bridge (4 Diodes)</span>
                    <p className="text-slate-400">V<sub>dc</sub> = (2 V<sub>m</sub>) / π ≈ 0.636 V<sub>m</sub></p>
                    <p className="text-slate-400">V<sub>rms</sub> = V<sub>m</sub> / √2 ≈ 0.707 V<sub>m</sub></p>
                    <p className="text-slate-400">Ripple Factor RF = 0.482, η = 81.2%</p>
                  </div>

                  <div className="p-2.5 bg-[#090a14] rounded border border-[#23253d] space-y-1">
                    <span className="text-purple-200 font-bold">Full-Wave Controlled (4 SCRs - CCM)</span>
                    <p className="text-slate-400">V<sub>dc</sub> = (2 V<sub>m</sub> / π) · cos α</p>
                    <p className="text-slate-400">V<sub>rms</sub> = V<sub>m</sub> / √2</p>
                    <p className="text-slate-400">V<sub>dc</sub> can be negative for α &gt; 90° (Inverter mode)</p>
                  </div>

                  <div className="p-2.5 bg-[#090a14] rounded border border-[#23253d] space-y-1">
                    <span className="text-purple-200 font-bold">Semi-Controlled Bridge</span>
                    <p className="text-slate-400">V<sub>dc</sub> = (V<sub>m</sub> / π) · (1 + cos α)</p>
                    <p className="text-slate-400">V<sub>rms</sub> = V<sub>m</sub> · √[(1/2π)(π - α + sin 2α / 2)]</p>
                  </div>

                  <div className="p-2.5 bg-[#090a14] rounded border border-[#23253d] space-y-1">
                    <span className="text-purple-200 font-bold">Performance & Quality Indices</span>
                    <p className="text-slate-400">Form Factor FF = V<sub>rms</sub> / V<sub>dc</sub></p>
                    <p className="text-slate-400">Ripple Factor RF = √(FF<sup>2</sup> - 1)</p>
                    <p className="text-slate-400">Efficiency η = (P<sub>dc</sub> / P<sub>ac</sub>) · 100%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'viva' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="bg-[#121426] p-3.5 rounded-lg border border-[#23253d]">
                  <div className="text-purple-300 font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    Q1: Why does output voltage go negative in a half-wave rectifier with RL load?
                  </div>
                  <p className="mt-2 text-slate-400 pl-6">
                    A: Because the inductor stores magnetic energy (½ L i<sup>2</sup>). When the AC voltage reverses, the collapsing magnetic field creates a back-EMF (v<sub>L</sub> = -L di/dt) that keeps the diode/SCR forward-biased until all stored energy is dissipated, causing negative output voltage during π to β.
                  </p>
                </div>

                <div className="bg-[#121426] p-3.5 rounded-lg border border-[#23253d]">
                  <div className="text-purple-300 font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    Q2: What is the primary function of a freewheeling diode (FD)?
                  </div>
                  <p className="mt-2 text-slate-400 pl-6">
                    A: The freewheeling diode provides an alternate path for the decaying inductor current when the supply voltage reverses. This clamps the load voltage to 0 V, prevents negative voltage spikes, improves average output voltage, and prevents energy from returning to the AC mains.
                  </p>
                </div>

                <div className="bg-[#121426] p-3.5 rounded-lg border border-[#23253d]">
                  <div className="text-purple-300 font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    Q3: What is the difference between CCM and DCM in converters?
                  </div>
                  <p className="mt-2 text-slate-400 pl-6">
                    A: In Continuous Conduction Mode (CCM), the inductor/load current never drops to zero during any part of the cycle. In Discontinuous Conduction Mode (DCM), the current drops to zero and stays at zero for a finite interval before the next cycle begins.
                  </p>
                </div>

                <div className="bg-[#121426] p-3.5 rounded-lg border border-[#23253d]">
                  <div className="text-purple-300 font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    Q4: How does firing angle α affect the average DC output in a full converter?
                  </div>
                  <p className="mt-2 text-slate-400 pl-6">
                    A: In a full converter with continuous conduction, V<sub>dc</sub> = (2 V<sub>m</sub> / π) cos α. For α &lt; 90°, cos α &gt; 0 (rectifier mode). For α = 90°, V<sub>dc</sub> = 0. For α &gt; 90°, cos α &lt; 0 (line-commutated inverter mode, power flows from DC load to AC source).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#23253d] bg-[#121426] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs rounded-lg transition cursor-pointer shadow-md shadow-purple-950"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
