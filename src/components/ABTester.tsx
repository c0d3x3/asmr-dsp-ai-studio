import React, { useState } from 'react';
import { Shuffle, Eye, EyeOff, Check, ArrowRightLeft, Sparkles } from 'lucide-react';
import { DSPProfile } from '../types';

interface ABTesterProps {
  profiles: DSPProfile[];
  activeProfile: DSPProfile;
  onSelectProfile: (profile: DSPProfile) => void;
}

export const ABTester: React.FC<ABTesterProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
}) => {
  const [profileAId, setProfileAId] = useState<string>(profiles[0]?.id || '');
  const [profileBId, setProfileBId] = useState<string>(profiles[1]?.id || '');
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [blindState, setBlindState] = useState<'A' | 'B'>('A');
  const [blindMap, setBlindMap] = useState<{ A: string; B: string }>({ A: profileAId, B: profileBId });
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const profileA = profiles.find(p => p.id === profileAId) || profiles[0];
  const profileB = profiles.find(p => p.id === profileBId) || profiles[1];

  const handleStartBlindTest = () => {
    // Randomize which is A and B
    const isSwapped = Math.random() > 0.5;
    const map = isSwapped
      ? { A: profileBId, B: profileAId }
      : { A: profileAId, B: profileBId };

    setBlindMap(map);
    setIsBlindMode(true);
    setIsRevealed(false);
    setBlindState('A');

    const selectedProf = profiles.find(p => p.id === map.A);
    if (selectedProf) onSelectProfile(selectedProf);
  };

  const handleBlindSwitch = (slot: 'A' | 'B') => {
    setBlindState(slot);
    const targetId = blindMap[slot];
    const selectedProf = profiles.find(p => p.id === targetId);
    if (selectedProf) onSelectProfile(selectedProf);
  };

  return (
    <div id="ab-tester-panel" className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-6 space-y-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#d4af37]" />
            A/B & Blind Subjective Testing
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare two profiles back-to-back with zero latency or test in double-blind mode.
          </p>
        </div>

        {/* Blind mode trigger */}
        <button
          id="btn-blind-test"
          onClick={() => {
            if (isBlindMode) {
              setIsBlindMode(false);
              setIsRevealed(false);
            } else {
              handleStartBlindTest();
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            isBlindMode
              ? 'bg-[#d4af37] text-[#0a0a0c] border-[#d4af37] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:text-white'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5 text-[#d4af37]" />
          {isBlindMode ? 'Exit Blind Mode' : 'Start Blind Test'}
        </button>
      </div>

      {!isBlindMode ? (
        /* Standard A/B Switcher */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slot A */}
          <div
            id="slot-a-card"
            onClick={() => onSelectProfile(profileA)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeProfile.id === profileA.id
                ? 'bg-[#151518] border-[#d4af37]/60 ring-1 ring-[#d4af37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                : 'bg-[#151518]/50 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">
                Profile A (Reference)
              </span>
              {activeProfile.id === profileA.id && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Listening
                </span>
              )}
            </div>
            <select
              value={profileAId}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setProfileAId(e.target.value);
                const p = profiles.find(pr => pr.id === e.target.value);
                if (p) onSelectProfile(p);
              }}
              className="w-full bg-[#0a0a0c] text-white rounded-lg p-2.5 border border-white/10 font-medium text-xs focus:outline-none focus:border-[#d4af37] cursor-pointer"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} className="bg-[#151518] text-white">
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{profileA.description}</p>
          </div>

          {/* Slot B */}
          <div
            id="slot-b-card"
            onClick={() => onSelectProfile(profileB)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeProfile.id === profileB.id
                ? 'bg-[#151518] border-[#d4af37]/60 ring-1 ring-[#d4af37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                : 'bg-[#151518]/50 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Profile B (Test Target)
              </span>
              {activeProfile.id === profileB.id && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Listening
                </span>
              )}
            </div>
            <select
              value={profileBId}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setProfileBId(e.target.value);
                const p = profiles.find(pr => pr.id === e.target.value);
                if (p) onSelectProfile(p);
              }}
              className="w-full bg-[#0a0a0c] text-white rounded-lg p-2.5 border border-white/10 font-medium text-xs focus:outline-none focus:border-[#d4af37] cursor-pointer"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} className="bg-[#151518] text-white">
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{profileB.description}</p>
          </div>
        </div>
      ) : (
        /* Blind Mode Comparison Interface */
        <div className="bg-[#151518] p-5 rounded-xl border border-[#d4af37]/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Double-Blind Active: Profile identities are hidden to eliminate psychoacoustic bias.</span>
            </div>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 flex items-center gap-1 transition-colors"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#d4af37]" />}
              {isRevealed ? 'Hide Identities' : 'Reveal Identities'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              id="btn-blind-a"
              onClick={() => handleBlindSwitch('A')}
              className={`p-6 rounded-xl font-bold text-center border transition-all ${
                blindState === 'A'
                  ? 'bg-[#d4af37] text-[#0a0a0c] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'bg-[#0a0a0c] text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-3xl font-black mb-1">A</div>
              <div className="text-xs font-semibold opacity-90">
                {blindState === 'A' ? 'Currently Listening' : 'Click to Listen'}
              </div>
              {isRevealed && (
                <div className="mt-2 pt-2 border-t border-black/20 text-xs font-bold text-[#0a0a0c]">
                  {profiles.find(p => p.id === blindMap.A)?.name}
                </div>
              )}
            </button>

            <button
              id="btn-blind-b"
              onClick={() => handleBlindSwitch('B')}
              className={`p-6 rounded-xl font-bold text-center border transition-all ${
                blindState === 'B'
                  ? 'bg-[#d4af37] text-[#0a0a0c] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'bg-[#0a0a0c] text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-3xl font-black mb-1">B</div>
              <div className="text-xs font-semibold opacity-90">
                {blindState === 'B' ? 'Currently Listening' : 'Click to Listen'}
              </div>
              {isRevealed && (
                <div className="mt-2 pt-2 border-t border-black/20 text-xs font-bold text-[#0a0a0c]">
                  {profiles.find(p => p.id === blindMap.B)?.name}
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
