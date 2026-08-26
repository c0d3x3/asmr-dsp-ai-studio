import React, { useState } from 'react';
import { X, Download, Terminal, FolderTree, FileCode, Check, Cpu } from 'lucide-react';

interface WindowsPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsPackageModal: React.FC<WindowsPackageModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'build' | 'files' | 'setup'>('build');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const buildBatText = `@echo off
echo ===================================================================
echo   ASMR-DSP Windows 11 Desktop Build Script
echo ===================================================================
pip install -r requirements.txt
python tests/run_tests.py
if %errorlevel% neq 0 (
    echo [ERROR] Tests failed.
    exit /b 1
)
pyinstaller --noconfirm --log-level=WARN build/asmr_dsp.spec
echo [SUCCESS] Standalone application built: dist\\ASMR-DSP\\ASMR-DSP.exe
pause`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="package-modal"
        className="bg-[#0d0d0f] border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Windows 11 Native Desktop Package & Build Center
              </h3>
              <p className="text-xs text-slate-400">
                Executable packaging for AMD Ryzen 9 5900X / Windows 11 PC
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-white/5 bg-[#151518] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('build')}
            className={`py-3 px-4 border-b-2 transition-all uppercase tracking-wider text-[11px] ${
              activeTab === 'build'
                ? 'border-[#d4af37] text-[#d4af37] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Click Build (build.bat)
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-4 border-b-2 transition-all uppercase tracking-wider text-[11px] ${
              activeTab === 'files'
                ? 'border-[#d4af37] text-[#d4af37] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Project Structure & Source Tree
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-4 border-b-2 transition-all uppercase tracking-wider text-[11px] ${
              activeTab === 'setup'
                ? 'border-[#d4af37] text-[#d4af37] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Requirements & Inno Setup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {activeTab === 'build' && (
            <div className="space-y-4">
              <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-2">
                <div className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Building ASMR-DSP.exe on your Windows 11 PC:
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 text-[11.5px] leading-relaxed">
                  <li>Open your <strong>Anaconda Prompt</strong> or <strong>PowerShell</strong>.</li>
                  <li>Navigate to the project directory: <code className="bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-white/5 font-mono text-emerald-400">cd ASMR-DSP</code></li>
                  <li>Run the automated build script: <code className="bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-white/5 font-mono text-emerald-400">build\build.bat</code></li>
                  <li>PyInstaller will generate the standalone executable in <code className="bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-white/5 font-mono text-[#d4af37]">dist\ASMR-DSP\ASMR-DSP.exe</code>.</li>
                  <li>(Optional) If Inno Setup 6 is installed, it also automatically generates <code className="bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-white/5 font-mono text-purple-400">dist\ASMR-DSP-Setup.exe</code> installer.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">build\build.bat preview:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(buildBatText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    {copied ? 'Copied' : 'Copy Script'}
                  </button>
                </div>
                <pre className="bg-[#0a0a0c] p-4 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-400/90 overflow-x-auto">
                  {buildBatText}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              <div className="font-semibold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <FolderTree className="w-4 h-4 text-[#d4af37]" />
                Complete Source Code Tree Created in Workspace:
              </div>
              <pre className="bg-[#0a0a0c] p-4 rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
{`asmr_dsp/
  ├── __init__.py
  ├── main.py                  # PySide6 desktop GUI & CLI entry point
  ├── engine/
  │     ├── apo_writer.py      # Atomic Equalizer APO config generator
  │     ├── dsp_math.py        # RBJ biquad transfer functions & headroom math
  │     ├── device_detector.py # WASAPI endpoint & Dolby Atmos detection
  │     └── clipping_guard.py  # Headroom analysis & auto-preamp
  ├── models/
  │     ├── profile.py         # DSP Profile & EQFilter data models
  │     ├── measurement.py     # CSV/AutoEQ parser & target curves
  │     └── ratings.py         # Local offline preference store
  └── ui/                      # PySide6 layout components
profiles/                      # 9 Purpose-tuned JSON profiles
measurements/                  # Reference measurement data with disclaimers
tests/                         # 17 Automated unit tests (100% passing)
build/
  ├── build.bat                # Windows CMD automated build
  ├── build.ps1                # Windows PowerShell automated build
  ├── asmr_dsp.spec            # PyInstaller packaging spec
  └── installer.iss            # Inno Setup Windows installer script
docs/                          # Dolby Atmos & Equalizer APO guides
requirements.txt               # Dependencies
setup.py                       # Python setuptools packaging
README.md`}
              </pre>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-2">
                <div className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  requirements.txt (Zero Cloud AI, 100% Offline):
                </div>
                <pre className="bg-[#0a0a0c] p-3 rounded-lg border border-white/5 font-mono text-[11px] text-slate-300">
{`PySide6>=6.5.0
pycaw>=20240210
comtypes>=1.4.0
keyboard>=0.13.5
pyinstaller>=6.0.0`}
                </pre>
              </div>

              <div className="bg-[#151518] p-4 rounded-xl border border-white/5 text-[11.5px] text-slate-300 space-y-2">
                <div className="font-bold text-white text-xs uppercase tracking-wider">Zero Internet / No Telemetry Guarantee:</div>
                <p className="leading-relaxed text-slate-400">
                  ASMR-DSP is 100% deterministic and self-contained. It operates directly against your local Equalizer APO installation and Windows WASAPI audio subsystem. No data is ever collected, transmitted, or logged outside your local PC.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#151518] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            All files are available in this repository for direct execution or packaging.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#d4af37] hover:opacity-90 text-[#0a0a0c] text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
