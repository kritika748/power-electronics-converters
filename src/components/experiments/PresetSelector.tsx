import React, { useState } from 'react';
import { LAB_EXPERIMENTS } from './PresetExperiments';
import { ExperimentPreset } from '../../types/converter';
import { FlaskConical, ChevronDown, Check } from 'lucide-react';

interface PresetSelectorProps {
  currentTopology: string;
  onSelectExperiment: (exp: ExperimentPreset) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentTopology,
  onSelectExperiment,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#121424] hover:bg-[#1a1d33] border border-[#2a2d4a] rounded-lg text-xs font-mono text-purple-200 transition cursor-pointer shadow-sm"
      >
        <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
        <span className="font-semibold">Lab Experiments</span>
        <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto bg-[#101222] border border-[#282b4a] rounded-xl shadow-2xl z-50 p-2 space-y-1 custom-scrollbar">
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-purple-400 font-bold border-b border-[#23253d] mb-1">
              Select Guided Laboratory Experiment
            </div>
            {LAB_EXPERIMENTS.map((exp) => {
              const isSelected = exp.params.topology === currentTopology;
              return (
                <button
                  key={exp.id}
                  onClick={() => {
                    onSelectExperiment(exp);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer text-xs font-mono flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-100'
                      : 'bg-[#151728]/80 border-[#23253d] text-slate-300 hover:bg-[#1e2038] hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-purple-300">{exp.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {exp.description}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
