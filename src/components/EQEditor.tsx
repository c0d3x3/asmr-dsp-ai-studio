import React from 'react';
import { Plus, Trash2, ShieldCheck, AlertTriangle, Wand2, Info, HelpCircle } from 'lucide-react';
import { DSPProfile, EQFilter, FilterType } from '../types';
import { analyzeHeadroom } from '../utils/dspMath';

interface EQEditorProps {
  profile: DSPProfile;
  selectedFilterId: string | null;
  onUpdateProfile: (updated: DSPProfile) => void;
  onSelectFilter: (filterId: string | null) => void;
}

export const EQEditor: React.FC<EQEditorProps> = ({
  profile,
  selectedFilterId,
  onUpdateProfile,
  onSelectFilter,
}) => {
  const headroom = analyzeHeadroom(profile);

  const handleFilterFieldChange = (
    filterId: string,
    field: keyof EQFilter,
    value: unknown
  ) => {
    const updatedFilters = profile.filters.map(f => {
      if (f.id === filterId) {
        return { ...f, [field]: value };
      }
      return f;
    });
    onUpdateProfile({ ...profile, filters: updatedFilters, updatedAt: new Date().toISOString() });
  };

  const handleAddFilter = () => {
    const newFilter: EQFilter = {
      id: 'f_' + Date.now(),
      type: 'PK',
      freq: 1000,
      gain: 0.0,
      q: 1.414,
      enabled: true,
      comment: 'Custom filter',
    };
    onUpdateProfile({
      ...profile,
      filters: [...profile.filters, newFilter],
      updatedAt: new Date().toISOString(),
    });
    onSelectFilter(newFilter.id);
  };

  const handleDeleteFilter = (filterId: string) => {
    const updated = profile.filters.filter(f => f.id !== filterId);
    onUpdateProfile({ ...profile, filters: updated, updatedAt: new Date().toISOString() });
    if (selectedFilterId === filterId) {
      onSelectFilter(null);
    }
  };

  const handleApplySafePreamp = () => {
    onUpdateProfile({
      ...profile,
      preampDb: headroom.recommendedPreampDb,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div id="eq-editor-panel" className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Editor Header with Headroom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
            Parametric Equalizer & Headroom
            <span className="text-xs font-normal text-slate-500 lowercase tracking-normal">
              ({profile.filters.length} active bands)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biquad filter adjustments with automatic clipping prevention.
          </p>
        </div>

        {/* Headroom Status Card */}
        <div className="flex items-center gap-3 bg-[#151518] px-3.5 py-2 rounded-xl border border-white/5">
          <div className="text-right text-xs">
            <div className="text-slate-400">
              Peak Boost: <span className="font-mono font-semibold text-white">+{headroom.maxBoostDb} dB</span>
            </div>
            <div className={`font-medium ${headroom.isClippingRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
              {headroom.isClippingRisk ? '⚠️ Clipping Risk Detected' : '✓ Safe Headroom'}
            </div>
          </div>

          {headroom.isClippingRisk && (
            <button
              id="btn-auto-preamp"
              onClick={handleApplySafePreamp}
              className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#d4af37] hover:opacity-90 text-[#0a0a0c] rounded-lg transition-all flex items-center gap-1 shadow-sm"
              title={`Set Preamp to ${headroom.recommendedPreampDb} dB to safely offset positive boost`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Fix Preamp ({headroom.recommendedPreampDb} dB)
            </button>
          )}
        </div>
      </div>

      {/* Digital Preamp Slider */}
      <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            Digital Preamp / Attenuation
            <span className="text-slate-500 font-normal" title="Digital gain offset to prevent clipping when boosting frequencies">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </label>
          <span className="font-mono text-sm font-bold text-[#d4af37]">
            {profile.preampDb >= 0 ? '+' : ''}{profile.preampDb.toFixed(2)} dB
          </span>
        </div>
        <input
          type="range"
          min="-15"
          max="6"
          step="0.1"
          value={profile.preampDb}
          onChange={(e) => onUpdateProfile({ ...profile, preampDb: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>-15.0 dB (Max Safe)</span>
          <span>-6.0 dB</span>
          <span>0.0 dB (Unity)</span>
          <span>+6.0 dB</span>
        </div>
      </div>

      {/* Filter Bands Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Filter Bands
          </h4>
          <button
            id="btn-add-filter"
            onClick={handleAddFilter}
            className="px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#d4af37] rounded-lg border border-[#d4af37]/30 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Filter Band
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#151518] text-slate-400 border-b border-white/5 font-medium">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">On</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Frequency (Hz)</th>
                <th className="py-2.5 px-3">Gain (dB)</th>
                <th className="py-2.5 px-3">Q (Width)</th>
                <th className="py-2.5 px-3">Purpose / Notes</th>
                <th className="py-2.5 px-2 w-10 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0d0d0f]">
              {profile.filters.map((filter) => {
                const isSelected = filter.id === selectedFilterId;

                return (
                  <tr
                    key={filter.id}
                    onClick={() => onSelectFilter(filter.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#151518] border-l-2 border-l-[#d4af37]'
                        : 'hover:bg-[#151518]'
                    }`}
                  >
                    {/* Enable Checkbox */}
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={filter.enabled}
                        onChange={(e) => handleFilterFieldChange(filter.id, 'enabled', e.target.checked)}
                        className="rounded bg-slate-800 border-white/10 text-[#d4af37] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Filter Type */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={filter.type}
                        onChange={(e) => handleFilterFieldChange(filter.id, 'type', e.target.value as FilterType)}
                        className="bg-white/5 text-slate-200 rounded-lg px-2 py-1 border border-white/10 text-xs focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="PK" className="bg-[#151518] text-white">Peaking (PK)</option>
                        <option value="LS" className="bg-[#151518] text-white">Low Shelf (LS)</option>
                        <option value="HS" className="bg-[#151518] text-white">High Shelf (HS)</option>
                        <option value="HP" className="bg-[#151518] text-white">High Pass (HP)</option>
                        <option value="LP" className="bg-[#151518] text-white">Low Pass (LP)</option>
                        <option value="NO" className="bg-[#151518] text-white">Notch (NO)</option>
                        <option value="BP" className="bg-[#151518] text-white">Band Pass (BP)</option>
                      </select>
                    </td>

                    {/* Frequency */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="20"
                          max="20000"
                          step="10"
                          value={Math.round(filter.freq)}
                          onChange={(e) => handleFilterFieldChange(filter.id, 'freq', parseFloat(e.target.value) || 20)}
                          className="w-20 bg-white/5 text-white rounded-lg px-2 py-1 border border-white/10 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-slate-500">Hz</span>
                      </div>
                    </td>

                    {/* Gain */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      {filter.type === 'HP' || filter.type === 'LP' ? (
                        <span className="text-slate-600 italic">—</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="-24"
                            max="24"
                            step="0.1"
                            value={filter.gain}
                            onChange={(e) => handleFilterFieldChange(filter.id, 'gain', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-white/5 text-white rounded-lg px-2 py-1 border border-white/10 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                          />
                          <span className="text-slate-500">dB</span>
                        </div>
                      )}
                    </td>

                    {/* Q Factor */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={filter.q}
                        onChange={(e) => handleFilterFieldChange(filter.id, 'q', parseFloat(e.target.value) || 1.414)}
                        className="w-16 bg-white/5 text-white rounded-lg px-2 py-1 border border-white/10 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                      />
                    </td>

                    {/* Comment */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={filter.comment || ''}
                        placeholder="e.g. Speech presence"
                        onChange={(e) => handleFilterFieldChange(filter.id, 'comment', e.target.value)}
                        className="w-full bg-transparent text-slate-300 placeholder-slate-600 px-1 py-0.5 border-b border-transparent hover:border-white/20 focus:border-[#d4af37] focus:outline-none text-xs"
                      />
                    </td>

                    {/* Delete */}
                    <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteFilter(filter.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove filter band"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASMR Spatial & Anti-Fatigue Modulators */}
      <div className="bg-[#151518] p-4 rounded-xl border border-white/5 space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#d4af37]" />
          ASMR Acoustic Modulators & Anti-Fatigue DSP
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Anti-Fatigue High-End Smoothing */}
          <div className="flex items-start gap-2.5 bg-white/[0.03] p-3 rounded-lg border border-white/5">
            <input
              type="checkbox"
              id="chk-hf-smooth"
              checked={profile.spatial.hfSmoothingEnabled}
              onChange={(e) =>
                onUpdateProfile({
                  ...profile,
                  spatial: { ...profile.spatial, hfSmoothingEnabled: e.target.checked },
                })
              }
              className="mt-0.5 rounded bg-slate-800 border-white/10 text-[#d4af37] focus:ring-0 cursor-pointer"
            />
            <div>
              <label htmlFor="chk-hf-smooth" className="font-semibold text-slate-200 cursor-pointer">
                High-Frequency Anti-Fatigue Smoothing
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Applies a gentle -2.0 dB shelf above {profile.spatial.hfSmoothingCutoff} Hz to soften harsh sibilance and eliminate listening fatigue.
              </p>
            </div>
          </div>

          {/* Gentle Crossfeed Simulation */}
          <div className="flex items-start gap-2.5 bg-white/[0.03] p-3 rounded-lg border border-white/5">
            <input
              type="checkbox"
              id="chk-crossfeed"
              checked={profile.spatial.crossfeedEnabled}
              onChange={(e) =>
                onUpdateProfile({
                  ...profile,
                  spatial: { ...profile.spatial, crossfeedEnabled: e.target.checked },
                })
              }
              className="mt-0.5 rounded bg-slate-800 border-white/10 text-[#d4af37] focus:ring-0 cursor-pointer"
            />
            <div>
              <label htmlFor="chk-crossfeed" className="font-semibold text-slate-200 cursor-pointer">
                Bauer / Chu Moy Natural Crossfeed
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Subtly reduces extreme in-head stereo separation on binaural recordings without degrading Dolby Atmos spatial localization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
