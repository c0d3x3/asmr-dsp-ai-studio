import React from 'react';
import { Volume2, Activity, ShieldCheck, Download, Sliders, Sparkles, Terminal } from 'lucide-react';
import { AudioEndpoint, DSPProfile } from '../types';

interface HeaderProps {
  currentDevice: AudioEndpoint;
  activeProfile: DSPProfile;
  isTestActive: boolean;
  onRunTestEQ: () => void;
  onOpenDiagnostics: () => void;
  onOpenAPOConfig: () => void;
  onOpenPackage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDevice,
  activeProfile,
  isTestActive,
  onRunTestEQ,
  onOpenDiagnostics,
  onOpenAPOConfig,
  onOpenPackage,
}) => {
  return (
    <header id="app-header" className="bg-[#0d0d0f] border-b border-white/5 text-slate-300 px-6 py-4 shadow-2xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* App Title & Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#d4af37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)] text-[#0a0a0c]">
            <Sliders className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                ASMR-DSP
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
                PRO X SE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              Local Equalizer APO Engine • Windows 11 Native • Dolby Atmos
            </p>
          </div>
        </div>

        {/* Hardware & Pipeline Status Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#151518] px-3.5 py-2 rounded-xl border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-white font-medium px-2 py-1 bg-white/5 rounded-lg border border-white/5">
            <Volume2 className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{currentDevice.name}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">PCM</span>
            <span className="font-mono text-emerald-400 text-xs">{currentDevice.bitDepth}-bit / {currentDevice.sampleRate / 1000} kHz</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-medium px-2 py-1 bg-white/5 rounded-lg border border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs">{currentDevice.spatialAudioMode}</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-medium px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs">APO Active</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="btn-test-eq"
            onClick={onRunTestEQ}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border ${
              isTestActive
                ? 'bg-[#d4af37] text-[#0a0a0c] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-amber-300 border-amber-500/30 hover:border-amber-400/50'
            }`}
            title="Sends a safe +4dB 1kHz test pulse for 3 seconds to verify Equalizer APO pipeline attachment"
          >
            <Activity className="w-3.5 h-3.5" />
            {isTestActive ? 'Testing Pipeline (+4dB)...' : 'Test EQ (Safe Tone)'}
          </button>

          <button
            id="btn-diagnostics"
            onClick={onOpenDiagnostics}
            className="px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-[#d4af37]" />
            Diagnostics
          </button>

          <button
            id="btn-view-apo"
            onClick={onOpenAPOConfig}
            className="px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            config.txt
          </button>

          <button
            id="btn-package"
            onClick={onOpenPackage}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#d4af37] text-[#0a0a0c] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.15)] hover:opacity-90"
          >
            <Download className="w-3.5 h-3.5" />
            Windows .exe & Source
          </button>
        </div>
      </div>
    </header>
  );
};
