import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Terminal } from 'lucide-react';
import { DSPProfile } from '../types';
import { generateAPOConfigText } from '../utils/dspMath';

interface APOConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DSPProfile;
}

export const APOConfigModal: React.FC<APOConfigModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [deviceTarget, setDeviceTarget] = useState('PRO X SE Gaming Headset');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const apoText = generateAPOConfigText(profile, deviceTarget);

  const handleCopy = () => {
    navigator.clipboard.writeText(apoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([apoText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="apo-config-modal"
        className="bg-[#0d0d0f] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Equalizer APO Syntax & config.txt
              </h3>
              <p className="text-xs text-slate-400">
                Direct parametric DSP output for &quot;{profile.name}&quot;
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Target Device Selector & Path */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151518] p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Target Device Directive:</span>
              <select
                value={deviceTarget}
                onChange={(e) => setDeviceTarget(e.target.value)}
                className="bg-white/5 text-white rounded-lg px-2.5 py-1 border border-white/10 font-medium text-xs focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="PRO X SE Gaming Headset" className="bg-[#151518] text-white">PRO X SE Gaming Headset</option>
                <option value="Generic USB Audio" className="bg-[#151518] text-white">Generic USB Audio</option>
                <option value="Realtek High Definition Audio" className="bg-[#151518] text-white">Realtek Analog (3.5mm)</option>
                <option value="All Devices" className="bg-[#151518] text-white">All Devices (Global)</option>
              </select>
            </div>

            <div className="font-mono text-[10px] text-slate-400 bg-[#0a0a0c] px-2.5 py-1 rounded-lg border border-white/5">
              C:\Program Files\EqualizerAPO\config\config.txt
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <pre className="bg-[#0a0a0c] p-4 rounded-xl border border-white/5 font-mono text-[11px] leading-relaxed text-emerald-400/90 overflow-x-auto max-h-80 select-all">
              {apoText}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#151518] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            ASMR-DSP updates this automatically when profiles are modified.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-[#d4af37] hover:opacity-90 text-[#0a0a0c] text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
            >
              <Download className="w-4 h-4" />
              Download config.txt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
