import React from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, Activity, Cpu, Layers, AlertCircle } from 'lucide-react';
import { AudioEndpoint, DSPProfile } from '../types';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: AudioEndpoint;
  activeProfile: DSPProfile;
  isTestActive: boolean;
  onRunTestEQ: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  device,
  activeProfile,
  isTestActive,
  onRunTestEQ,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="diagnostics-modal"
        className="bg-[#0d0d0f] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Windows 11 Audio Pipeline Diagnostics
            </h3>
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
          {/* Hardware & Driver Inspection Card */}
          <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#d4af37]" />
                Endpoint Inspection
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                {device.name.includes('PRO X') ? 'PRO X SE / G PRO X' : 'Selected Endpoint'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0a0a0c] p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-400">Windows Device Name</div>
                <div className="font-semibold text-white mt-0.5">{device.name}</div>
              </div>
              <div className="bg-[#0a0a0c] p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-400">Audio Provider</div>
                <div className="font-semibold text-blue-400 mt-0.5">WASAPI (Windows Audio)</div>
              </div>
              <div className="bg-[#0a0a0c] p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-400">PCM Audio Format</div>
                <div className="font-mono text-white mt-0.5">{device.bitDepth}-bit / {device.sampleRate} Hz ({device.channels} ch)</div>
              </div>
              <div className="bg-[#0a0a0c] p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-400">Endpoint ID</div>
                <div className="font-mono text-[10px] text-slate-300 truncate mt-0.5" title={device.id}>{device.id || 'Default Endpoint'}</div>
              </div>
            </div>
          </div>

          {/* Spatial Audio Status */}
          <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Spatial Audio Status
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
                {device.spatialAudioMode}
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              Windows does not provide an open user-mode COM API to query active spatial object rendering. Dolby Atmos status reflects user OS configuration and is not independently verified at runtime.
            </p>

            <div className="flex items-center gap-2 text-slate-300 bg-white/5 p-2.5 rounded-lg border border-white/10 text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Equalizer APO applies filter configurations to the selected endpoint. Spatial audio rendering order depends on Windows APO stage hooks (LFX/GFX).</span>
            </div>
          </div>

          {/* Equalizer APO Pipeline Stage */}
          <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Equalizer APO Processing Pipeline
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                LFX / GFX Hook
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] bg-[#0a0a0c] p-3 rounded-lg border border-white/5 text-slate-300">
              <div>• Active Target: Device: &quot;{device.name}&quot;</div>
              <div>• Active Profile: {activeProfile.name} ({activeProfile.filters.length} filters)</div>
              <div>• Digital Preamp: {activeProfile.preampDb.toFixed(2)} dB</div>
              <div>• Config Path: C:\Program Files\EqualizerAPO\config\config.txt</div>
            </div>
          </div>

          {/* Test EQ Section */}
          <div className="p-4 rounded-xl bg-[#151518] border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="font-bold text-amber-300 text-xs uppercase tracking-wider">Audible Verification Pulse</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Applies a safe +4 dB 1 kHz tone for 3 seconds to confirm hardware attachment.
              </div>
            </div>
            <button
              onClick={onRunTestEQ}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                isTestActive
                  ? 'bg-[#d4af37] text-[#0a0a0c] animate-pulse shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-[#d4af37] hover:opacity-90 text-[#0a0a0c]'
              }`}
            >
              {isTestActive ? 'Running (+4dB)...' : 'Run Test EQ'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#151518] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-white/10"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
