import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Minus, Lightbulb, Heart, Save, Check } from 'lucide-react';
import { DSPProfile, ProfileRating } from '../types';

interface RatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DSPProfile;
  ratings: ProfileRating[];
  onAddRating: (rating: ProfileRating) => void;
}

const AVAILABLE_TAGS = [
  'More Relaxing',
  'More Detailed',
  'More Natural',
  'Too Bright',
  'Too Dull',
  'Too Bass-Heavy',
  'Too Thin',
  'Too Harsh',
  'Too Distant',
  'Too Artificial',
];

export const RatingsModal: React.FC<RatingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  ratings,
  onAddRating,
}) => {
  const [result, setResult] = useState<'better' | 'worse' | 'same'>('better');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [soundMaterial, setSoundMaterial] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const profileRatings = ratings.filter(r => r.profileId === profile.id);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    const newRating: ProfileRating = {
      id: 'r_' + Date.now(),
      profileId: profile.id,
      profileName: profile.name,
      timestamp: new Date().toISOString(),
      result,
      tags: selectedTags,
      notes,
      soundType: soundMaterial,
    };
    onAddRating(newRating);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  // Generate offline deterministic suggestions
  const generateSuggestions = (): string[] => {
    const tagCounts: Record<string, number> = {};
    profileRatings.forEach(r => {
      r.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    // Include current selection in preview
    selectedTags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });

    const suggestions: string[] = [];
    if ((tagCounts['Too Bright'] || 0) + (tagCounts['Too Harsh'] || 0) >= 1) {
      suggestions.push('Apply a -1.5 dB high-shelf cut around 8.5 kHz or lower the Q on the 6-8 kHz peak filter to soften sibilance.');
    }
    if ((tagCounts['Too Dull'] || 0) >= 1) {
      suggestions.push('Gently boost the 4 kHz - 7 kHz air band by +1.0 dB (Q=1.2) to restore delicate brush/scissor texture.');
    }
    if ((tagCounts['Too Bass-Heavy'] || 0) >= 1) {
      suggestions.push('Enable or raise the high-pass filter cutoff to 35 Hz to eliminate chesty resonance and mic thumps.');
    }
    if ((tagCounts['Too Thin'] || 0) >= 1) {
      suggestions.push('Add a gentle +1.2 dB peaking boost at 180 Hz - 250 Hz to give whispering voices more body and intimate warmth.');
    }
    if ((tagCounts['Too Distant'] || 0) >= 1) {
      suggestions.push('Boost speech presence at 2.5 kHz - 3.5 kHz by +1.0 dB to pull close-up ear-to-ear whispers closer.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Listening impressions are well-balanced. No corrective tuning needed.');
    }
    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="ratings-modal"
        className="bg-[#0d0d0f] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Personal Preference Tuning: &quot;{profile.name}&quot;
              </h3>
              <p className="text-xs text-slate-400">
                Local offline feedback system to guide acoustic adjustments
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
          {/* Comparison Rating Buttons */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              How does this profile sound compared to reference/previous?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setResult('better')}
                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-xs uppercase tracking-wider ${
                  result === 'better'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-[#151518] text-slate-300 border-white/5 hover:border-white/15'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Better / Preferred
              </button>

              <button
                type="button"
                onClick={() => setResult('same')}
                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-xs uppercase tracking-wider ${
                  result === 'same'
                    ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'bg-[#151518] text-slate-300 border-white/5 hover:border-white/15'
                }`}
              >
                <Minus className="w-4 h-4" />
                About the Same
              </button>

              <button
                type="button"
                onClick={() => setResult('worse')}
                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-xs uppercase tracking-wider ${
                  result === 'worse'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : 'bg-[#151518] text-slate-300 border-white/5 hover:border-white/15'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Worse / Fatiguing
              </button>
            </div>
          </div>

          {/* Descriptive Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Select any tonal characteristics you notice:
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-[#d4af37] text-[#0a0a0c] font-bold border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                        : 'bg-[#151518] text-slate-300 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listening Material */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Video / Sound Material (Optional):
            </label>
            <input
              type="text"
              value={soundMaterial}
              placeholder="e.g. Angelo Shoe Shine, Haircut, Whispers, Tapping"
              onChange={(e) => setSoundMaterial(e.target.value)}
              className="w-full bg-[#151518] text-white rounded-lg p-2.5 border border-white/10 focus:outline-none focus:border-[#d4af37] text-xs placeholder:text-slate-600"
            />
          </div>

          {/* Offline Suggestion Box */}
          <div className="bg-[#151518] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#d4af37] text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-[#d4af37]" />
              Offline DSP Tuning Suggestions:
            </div>
            <ul className="space-y-1.5 text-[11.5px] text-slate-300 pl-5 list-disc">
              {suggestions.map((s, idx) => (
                <li key={idx} className="leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#151518] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {profileRatings.length} previous sessions logged locally.
          </span>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#d4af37] hover:opacity-90 text-[#0a0a0c] text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Listening Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};
