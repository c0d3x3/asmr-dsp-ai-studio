import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Layers, RefreshCw, Sparkles, Check, Heart, FileSpreadsheet, Activity, Terminal, Download, Zap } from 'lucide-react';
import { BUILTIN_PROFILES } from './data/profiles';
import { BUILTIN_TARGET_CURVES, NO_VERIFIED_MEASUREMENT_LABEL } from './data/measurements';
import { DSPProfile, AudioEndpoint, ProfileRating, TargetCurve, EQFilter, HeadphonePoint } from './types';
import { Header } from './components/Header';
import { ProfileGrid } from './components/ProfileGrid';
import { EQGraph } from './components/EQGraph';
import { EQEditor } from './components/EQEditor';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ABTester } from './components/ABTester';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { APOConfigModal } from './components/APOConfigModal';
import { RatingsModal } from './components/RatingsModal';
import { MeasurementModal } from './components/MeasurementModal';
import { WindowsPackageModal } from './components/WindowsPackageModal';
import { dspAudioEngine } from './audio/dspEngine';

export function App() {
  const [profiles, setProfiles] = useState<DSPProfile[]>(BUILTIN_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('asmr-relaxation');
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);

  // Active Profile object
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Visual Graph settings
  const [selectedTarget, setSelectedTarget] = useState<TargetCurve>(BUILTIN_TARGET_CURVES[0]);
  const [showTarget, setShowTarget] = useState<boolean>(true);
  const [userMeasurementPoints, setUserMeasurementPoints] = useState<HeadphonePoint[]>([]);
  const [showMeasurement, setShowMeasurement] = useState<boolean>(false);
  const [showIndividualFilters, setShowIndividualFilters] = useState<boolean>(true);

  // Ratings store
  const [ratings, setRatings] = useState<ProfileRating[]>([]);
  const [ratingTargetProfile, setRatingTargetProfile] = useState<DSPProfile | null>(null);

  // Modal dialog states
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isAPOConfigOpen, setIsAPOConfigOpen] = useState(false);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [isPackageOpen, setIsPackageOpen] = useState(false);

  // Test EQ tone pulse state (+4dB 1kHz for 3 seconds)
  const [isTestActive, setIsTestActive] = useState(false);

  // Active View tabs: 'eq' (Curve & Parametric Editor) | 'ab' (A/B Comparator & Blind Testing)
  const [activeTab, setActiveTab] = useState<'eq' | 'ab'>('eq');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Hardware Endpoint State
  const currentDevice: AudioEndpoint = {
    id: '{0.0.0.00000000}.{a00102-prox-se-usb}',
    name: 'PRO X SE Gaming Headset',
    sampleRate: 48000,
    bitDepth: 16,
    channels: 2,
    connectionType: 'USB Audio (Generic)',
    spatialAudioMode: 'User-configured / not independently verified',
    isLogitechProX: true,
    isDolbyActive: false,
    isApoAttached: true,
    isDefault: true,
  };

  // Select profile handler
  const handleSelectProfile = useCallback((profile: DSPProfile) => {
    setActiveProfileId(profile.id);
    setSelectedFilterId(null);
    dspAudioEngine.applyProfile(profile);
    showToast(`Activated profile: ${profile.name}`);
  }, []);

  // Update profile handler
  const handleUpdateProfile = (updated: DSPProfile) => {
    setProfiles(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    if (updated.id === activeProfileId) {
      dspAudioEngine.applyProfile(updated);
    }
  };

  // Node drag handler on graph
  const handleGraphFilterChange = (filterId: string, newFreq: number, newGain: number) => {
    const updatedFilters = activeProfile.filters.map(f => {
      if (f.id === filterId) {
        return { ...f, freq: newFreq, gain: newGain };
      }
      return f;
    });
    handleUpdateProfile({
      ...activeProfile,
      filters: updatedFilters,
      updatedAt: new Date().toISOString(),
    });
  };

  // Run Test EQ Tone (+4dB 1kHz pulse for 3 seconds)
  const handleRunTestEQ = () => {
    if (isTestActive) return;
    setIsTestActive(true);
    dspAudioEngine.playTestPulse(4.0, 1000, 3000);
    showToast('Sent safe +4 dB 1 kHz test pulse to verify Equalizer APO attachment');
    setTimeout(() => {
      setIsTestActive(false);
    }, 3000);
  };

  // Keyboard shortcut listener (1-9 for instant profile switching)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= profiles.length) {
        const targetProf = profiles[keyNum - 1];
        if (targetProf) {
          handleSelectProfile(targetProf);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profiles, handleSelectProfile]);

  // Apply Acoustic Correction to Active Profile
  const handleApplyCorrectionToProfile = (correctionFilters: EQFilter[]) => {
    const mergedFilters = [...activeProfile.filters, ...correctionFilters];
    handleUpdateProfile({
      ...activeProfile,
      filters: mergedFilters,
      updatedAt: new Date().toISOString(),
    });
    showToast(`Merged headphone acoustic correction filters into "${activeProfile.name}"`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 flex flex-col font-sans selection:bg-[#d4af37] selection:text-[#0a0a0c]">
      {/* Top Bar Header */}
      <Header
        currentDevice={currentDevice}
        activeProfile={activeProfile}
        isTestActive={isTestActive}
        onRunTestEQ={handleRunTestEQ}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenAPOConfig={() => setIsAPOConfigOpen(true)}
        onOpenPackage={() => setIsPackageOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Audio Player & Live DSP Engine Simulator Bar */}
        <AudioPlayerBar activeProfile={activeProfile} />

        {/* 9 Built-in Purpose-Tuned Profiles */}
        <ProfileGrid
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onOpenRatings={(prof) => setRatingTargetProfile(prof)}
        />

        {/* Main Tuning Center: EQ Curve & Parametric Editor / A-B Testing */}
        <section id="tuning-center" className="space-y-4">
          {/* Sub-navigation tabs & Secondary Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <button
                id="tab-eq-editor"
                onClick={() => setActiveTab('eq')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'eq'
                    ? 'bg-[#d4af37] text-[#0a0a0c] shadow-[0_2px_10px_rgba(212,175,55,0.2)]'
                    : 'bg-[#151518] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Response Curve & Filters
              </button>

              <button
                id="tab-ab-tester"
                onClick={() => setActiveTab('ab')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'ab'
                    ? 'bg-[#d4af37] text-[#0a0a0c] shadow-[0_2px_10px_rgba(212,175,55,0.2)]'
                    : 'bg-[#151518] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                A/B & Blind Comparator
              </button>
            </div>

            {/* Quick Actions & Overlay Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMeasurementOpen(true)}
                className="px-3 py-1.5 text-xs font-medium bg-[#151518] hover:bg-white/10 text-amber-300 rounded-lg border border-white/5 transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Measurements & Targets
              </button>

              <button
                onClick={() => setRatingTargetProfile(activeProfile)}
                className="px-3 py-1.5 text-xs font-medium bg-[#151518] hover:bg-white/10 text-[#d4af37] rounded-lg border border-white/5 transition-colors flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                Rate Profile
              </button>
            </div>
          </div>

          {/* Tab 1: EQ Graph & Filter Bands */}
          {activeTab === 'eq' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Interactive HTML5 Frequency Response Curve */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] uppercase tracking-wider">
                    Interactive Frequency Response (20 Hz - 20,000 Hz) • Drag nodes to sculpt acoustic response
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 text-xs">
                      <input
                        type="checkbox"
                        checked={showIndividualFilters}
                        onChange={(e) => setShowIndividualFilters(e.target.checked)}
                        className="rounded bg-slate-800 border-white/10 text-[#d4af37] focus:ring-0 cursor-pointer"
                      />
                      Individual Bands
                    </label>
                  </div>
                </div>

                <EQGraph
                  profile={activeProfile}
                  selectedFilterId={selectedFilterId}
                  targetCurve={selectedTarget}
                  measurementPoints={userMeasurementPoints}
                  showTarget={showTarget}
                  showMeasurement={showMeasurement}
                  showIndividualFilters={showIndividualFilters}
                  onFilterChange={handleGraphFilterChange}
                  onSelectFilter={(id) => setSelectedFilterId(id)}
                />
              </div>

              {/* Parametric Equalizer Editor & Headroom Control */}
              <EQEditor
                profile={activeProfile}
                selectedFilterId={selectedFilterId}
                onUpdateProfile={handleUpdateProfile}
                onSelectFilter={(id) => setSelectedFilterId(id)}
              />
            </div>
          )}

          {/* Tab 2: A/B Quick Switcher & Blind Listening */}
          {activeTab === 'ab' && (
            <div className="animate-fadeIn">
              <ABTester
                profiles={profiles}
                activeProfile={activeProfile}
                onSelectProfile={handleSelectProfile}
              />
            </div>
          )}
        </section>
      </main>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151518] border border-[#d4af37]/40 text-white px-4 py-2.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-2.5 text-xs font-medium animate-bounce">
          <Check className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        device={currentDevice}
        activeProfile={activeProfile}
        isTestActive={isTestActive}
        onRunTestEQ={handleRunTestEQ}
      />

      <APOConfigModal
        isOpen={isAPOConfigOpen}
        onClose={() => setIsAPOConfigOpen(false)}
        profile={activeProfile}
      />

      <RatingsModal
        isOpen={ratingTargetProfile !== null}
        onClose={() => setRatingTargetProfile(null)}
        profile={ratingTargetProfile || activeProfile}
        ratings={ratings}
        onAddRating={(newRating) => setRatings(prev => [newRating, ...prev])}
      />

      <MeasurementModal
        isOpen={isMeasurementOpen}
        onClose={() => setIsMeasurementOpen(false)}
        activeProfile={activeProfile}
        selectedTarget={selectedTarget}
        onSelectTarget={(t) => setSelectedTarget(t)}
        showMeasurement={showMeasurement}
        onToggleMeasurement={(s) => setShowMeasurement(s)}
        showTarget={showTarget}
        onToggleTarget={(s) => setShowTarget(s)}
        onApplyCorrectionToProfile={handleApplyCorrectionToProfile}
      />

      <WindowsPackageModal
        isOpen={isPackageOpen}
        onClose={() => setIsPackageOpen(false)}
      />
    </div>
  );
}

export default App;
