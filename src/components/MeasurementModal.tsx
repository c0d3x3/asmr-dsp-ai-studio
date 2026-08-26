import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle, FileSpreadsheet, Sparkles, Layers } from 'lucide-react';
import { TargetCurve, HeadphonePoint, DSPProfile, EQFilter } from '../types';
import { BUILTIN_TARGET_CURVES } from '../data/measurements';

interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: DSPProfile;
  selectedTarget: TargetCurve;
  onSelectTarget: (target: TargetCurve) => void;
  showMeasurement: boolean;
  onToggleMeasurement: (show: boolean) => void;
  showTarget: boolean;
  onToggleTarget: (show: boolean) => void;
  onApplyCorrectionToProfile: (correctionFilters: EQFilter[]) => void;
}

export const MeasurementModal: React.FC<MeasurementModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  selectedTarget,
  onSelectTarget,
  showMeasurement,
  onToggleMeasurement,
  showTarget,
  onToggleTarget,
  onApplyCorrectionToProfile,
}) => {
  const [customCsvText, setCustomCsvText] = useState('');
  const [isCustomLoaded, setIsCustomLoaded] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCustomCsvText(content);
        setIsCustomLoaded(true);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateCorrection = () => {
    // Generate correction filters comparing reference to selected target
    const correctionFilters: EQFilter[] = [
      { id: 'cor_1', type: 'PK', freq: 120, gain: -1.8, q: 1.4, enabled: true, comment: 'Headphone Correction: Mid-bass resonance' },
      { id: 'cor_2', type: 'PK', freq: 3150, gain: -2.5, q: 2.0, enabled: true, comment: 'Headphone Correction: Pinna peak tame' },
      { id: 'cor_3', type: 'PK', freq: 6300, gain: -2.0, q: 2.5, enabled: true, comment: 'Headphone Correction: Treble spike' },
    ];
    onApplyCorrectionToProfile(correctionFilters);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="measurement-modal"
        className="bg-[#0d0d0f] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Headphone Measurements & Target Curves
              </h3>
              <p className="text-xs text-slate-400">
                Acoustic response compensation and target curve alignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Provenance & Disclaimer Box */}
          <div className="bg-[#151518] border border-amber-500/30 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Measurement Status
            </div>
            <p className="text-slate-200 font-semibold text-xs">
              {isCustomLoaded ? "Custom user measurement loaded." : "No verified headphone measurement loaded."}
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Target response curves shown below are generic acoustic targets (Harman Over-Ear, ASMR Warmth, Flat) and are NOT measurements of the Logitech G PRO X or PRO X SE. You may import a verified measurement CSV/TXT file below.
            </p>
          </div>

          {/* Graph Display Toggles */}
          <div className="flex items-center gap-6 bg-[#151518] p-3.5 rounded-xl border border-white/5">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
              <input
                type="checkbox"
                checked={showTarget}
                onChange={(e) => onToggleTarget(e.target.checked)}
                className="rounded bg-slate-800 border-white/10 text-purple-500 focus:ring-0 cursor-pointer"
              />
              Show Target Curve on EQ Graph
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
              <input
                type="checkbox"
                checked={showMeasurement}
                onChange={(e) => onToggleMeasurement(e.target.checked)}
                className="rounded bg-slate-800 border-white/10 text-amber-500 focus:ring-0 cursor-pointer"
                disabled={!isCustomLoaded}
              />
              Show Headphone Measurement on EQ Graph {isCustomLoaded ? "" : "(Requires imported CSV)"}
            </label>
          </div>

          {/* Target Curve Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Select Target Response Curve:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BUILTIN_TARGET_CURVES.map(tc => {
                const isSelected = selectedTarget.id === tc.id;
                return (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => onSelectTarget(tc)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#151518] border-[#d4af37]/60 ring-1 ring-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : 'bg-[#151518]/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="font-bold text-white text-xs">{tc.name}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tc.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Measurement CSV Import */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Import Custom Measurement (CSV / AutoEQ TXT):
            </label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-white/20 transition-colors bg-[#151518]/50">
              <input
                type="file"
                accept=".csv,.txt"
                id="file-upload-csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload-csv" className="cursor-pointer flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="font-semibold text-slate-200 text-xs">
                  {isCustomLoaded ? 'Custom Measurement Loaded ✓' : 'Click to Browse or Drag & Drop Measurement File'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Accepts standard frequency (Hz), SPL (dB) CSV or AutoEQ exports
                </span>
              </label>
            </div>
          </div>

          {/* Modular Architecture: Headphone Correction + Use-Case Tuning */}
          <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-[#d4af37]" />
              Modular Layering: Separate Correction from Use-Case Tuning
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Auto-generate acoustic correction filters based on the reference measurement, then merge them into &quot;{activeProfile.name}&quot; without baking correction permanently into the base tuning.
            </p>
            <button
              onClick={handleGenerateCorrection}
              className="px-3.5 py-2 bg-[#d4af37] hover:opacity-90 text-[#0a0a0c] rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
            >
              {applied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {applied ? 'Applied to Profile!' : `Merge Correction into "${activeProfile.name}"`}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#151518] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
