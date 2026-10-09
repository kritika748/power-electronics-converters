import React from 'react';
import { PresetSelector } from '../experiments/PresetSelector';
import { ExperimentPreset } from '../../types/converter';
import {
  Zap,
  BookOpen,
  RotateCcw,
  Play,
  Pause,
  Download,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  currentTopology: string;
  onSelectExperiment: (exp: ExperimentPreset) => void;
  onOpenManual: () => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onExportReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTopology,
  onSelectExperiment,
  onOpenManual,
  isRunning,
  onToggleRun,
  onReset,
  onExportReport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#090a12]/95 border-b border-[#22243a] backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Branding & Student Credential */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 text-white font-black shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/40">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-slate-100">
                PowerSim <span className="text-purple-400 font-normal">| Virtual Converter Lab</span>
              </h1>
              {/* Student Name & Roll No Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-200 border border-purple-500/30 font-semibold tracking-wide shadow-sm">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span>KRITIKA RATHOR · 24EE10063</span>
              </div>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden md:block">
              Power Electronics Laboratory · Rectifiers, DC-DC Choppers & Inverters
            </p>
          </div>
        </div>

        {/* Experiment presets & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Preset selector */}
          <PresetSelector
            currentTopology={currentTopology}
            onSelectExperiment={onSelectExperiment}
          />

          {/* Theory / Manual button */}
          <button
            onClick={onOpenManual}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121422] hover:bg-[#1a1c30] border border-[#2a2d48] rounded-lg text-xs font-mono text-purple-300 hover:text-purple-200 transition cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Lab Manual</span>
          </button>

          {/* Run / Pause toggle */}
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
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
            onClick={onReset}
            className="p-2 bg-[#121422] hover:bg-[#1a1c30] border border-[#2a2d48] rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Reset Simulation Time"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export Report */}
          <button
            onClick={onExportReport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#121422] hover:bg-[#1a1c30] border border-[#2a2d48] rounded-lg text-xs font-mono text-purple-300 hover:text-purple-200 transition cursor-pointer"
            title="Download Lab Report Summary"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
