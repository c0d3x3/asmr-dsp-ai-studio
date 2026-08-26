import React from 'react';
import { Check, AlertTriangle, ShieldCheck, Zap, Heart } from 'lucide-react';
import { DSPProfile } from '../types';
import { analyzeHeadroom } from '../utils/dspMath';

interface ProfileGridProps {
  profiles: DSPProfile[];
  activeProfile: DSPProfile;
  onSelectProfile: (profile: DSPProfile) => void;
  onOpenRatings: (profile: DSPProfile) => void;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenRatings,
}) => {
  return (
    <section id="profiles-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
            Purpose-Tuned Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant atomic activation through Equalizer APO. Zero reboot required.
          </p>
        </div>

        <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
          Active: <strong className="text-[#d4af37] font-semibold">{activeProfile.name}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map(profile => {
          const isActive = profile.id === activeProfile.id;
          const headroom = analyzeHeadroom(profile);

          return (
            <div
              key={profile.id}
              id={`profile-card-${profile.id}`}
              onClick={() => onSelectProfile(profile)}
              className={`relative text-left p-4 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between group ${
                isActive
                  ? 'bg-[#151518] border-[#d4af37]/60 ring-1 ring-[#d4af37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                  : 'bg-[#0d0d0f] border-white/5 hover:border-white/15 hover:bg-[#151518]'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" role="img" aria-label={profile.name}>
                      {profile.icon}
                    </span>
                    <div>
                      <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                          {profile.category}
                        </span>
                        {profile.isExperimental && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Experimental
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded-full border border-[#d4af37]/30">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRatings(profile);
                      }}
                      className="text-slate-500 hover:text-[#d4af37] p-1 rounded-md transition-colors"
                      title="Log listening rating / feedback for this profile"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {profile.description}
                </p>
              </div>

              {/* Headroom & Filter Status Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span>{profile.filters.length} filters</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-300">
                    Preamp {profile.preampDb >= 0 ? '+' : ''}{profile.preampDb.toFixed(1)} dB
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {headroom.isClippingRisk ? (
                    <span className="flex items-center gap-1 text-amber-400 font-medium" title="Peak boost exceeds digital headroom">
                      <AlertTriangle className="w-3 h-3" />
                      +{headroom.effectivePeakDb} dB
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium" title="Safe digital headroom guaranteed">
                      <ShieldCheck className="w-3 h-3" />
                      {headroom.headroomDb} dB headroom
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
