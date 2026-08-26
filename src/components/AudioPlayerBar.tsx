import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, ToggleLeft, ToggleRight, Sparkles, Radio } from 'lucide-react';
import { DSPProfile } from '../types';
import { dspAudioEngine } from '../audio/dspEngine';

interface AudioPlayerBarProps {
  activeProfile: DSPProfile;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ activeProfile }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [soundType, setSoundType] = useState('whispers');
  const [volume, setVolume] = useState(0.6);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      dspAudioEngine.applyProfile(activeProfile);
    }
  }, [activeProfile, isPlaying]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      dspAudioEngine.stopSound();
      setIsPlaying(false);
    } else {
      dspAudioEngine.setBypass(isBypassed);
      dspAudioEngine.setMasterVolume(volume);
      dspAudioEngine.startSound(soundType, activeProfile);
      setIsPlaying(true);
    }
  };

  const handleSoundChange = (newType: string) => {
    setSoundType(newType);
    if (isPlaying) {
      dspAudioEngine.startSound(newType, activeProfile);
    }
  };

  const handleBypassToggle = () => {
    const nextBypass = !isBypassed;
    setIsBypassed(nextBypass);
    dspAudioEngine.setBypass(nextBypass);
    if (isPlaying) {
      dspAudioEngine.applyProfile(activeProfile);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    dspAudioEngine.setMasterVolume(newVol);
  };

  // Real-time audio spectrum visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = dspAudioEngine.analyserNode;
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / 32) - 1.5;
        let x = 0;

        for (let i = 0; i < 32; i++) {
          const index = Math.floor((i / 32) * (bufferLength / 2));
          const val = dataArray[index] || 0;
          const barHeight = (val / 255) * canvas.height;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#d4af37');
          gradient.addColorStop(1, isBypassed ? '#64748b' : '#fef08a');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1.5;
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isBypassed]);

  return (
    <div id="audio-tester-bar" className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-4 shadow-2xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Play / Stop & Sound Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="btn-play-sound"
            onClick={handleTogglePlay}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wider ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                : 'bg-[#d4af37] hover:opacity-90 text-[#0a0a0c] shadow-[0_4px_15px_rgba(212,175,55,0.2)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Stop Preview
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Listen in Browser
              </>
            )}
          </button>

          {/* Sound Type Selector */}
          <div className="flex items-center gap-1.5 bg-[#151518] p-1 rounded-xl border border-white/5 text-xs">
            <span className="text-slate-400 pl-2 pr-1 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              Source:
            </span>
            <select
              value={soundType}
              onChange={(e) => handleSoundChange(e.target.value)}
              className="bg-white/5 text-slate-200 rounded-lg px-2.5 py-1 border border-white/10 focus:outline-none focus:border-[#d4af37] font-medium text-xs cursor-pointer"
            >
              <option value="whispers" className="bg-[#151518] text-white">🌙 Whispers & Ambience</option>
              <option value="scissors" className="bg-[#151518] text-white">✂️ Haircut Scissors</option>
              <option value="pencil" className="bg-[#151518] text-white">✏️ Pencil on Paper</option>
              <option value="tapping" className="bg-[#151518] text-white">🪵 Gentle Tapping</option>
              <option value="water" className="bg-[#151518] text-white">💧 Water Spritz / Mist</option>
              <option value="pink_noise" className="bg-[#151518] text-white">📻 Acoustic Pink Noise</option>
            </select>
          </div>
        </div>

        {/* Center: Live Spectrum Canvas */}
        <div className="flex items-center gap-2.5 bg-[#0a0a0c] px-3.5 py-1.5 rounded-xl border border-white/5">
          <canvas ref={canvasRef} width={120} height={26} className="block" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            {isPlaying ? (isBypassed ? 'BYPASS (RAW)' : `DSP: ${activeProfile.name}`) : 'STANDBY'}
          </span>
        </div>

        {/* Right: Bypass Switch & Master Volume */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {/* Real-time Bypass Switch */}
          <button
            id="btn-bypass-eq"
            onClick={handleBypassToggle}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isBypassed
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
            }`}
            title="Instantly bypass DSP processing to hear uncolored audio"
          >
            {isBypassed ? (
              <>
                <ToggleLeft className="w-4 h-4 text-amber-400" />
                EQ Bypassed (Raw Audio)
              </>
            ) : (
              <>
                <ToggleRight className="w-4 h-4 text-[#d4af37]" />
                EQ Active ({activeProfile.name})
              </>
            )}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-400" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
              title="Browser Preview Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
