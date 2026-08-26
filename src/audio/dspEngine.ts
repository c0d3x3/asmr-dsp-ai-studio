import { DSPProfile, EQFilter, FilterType } from '../types';

export class WebAudioDSPEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioNode | null = null;
  private preampGainNode: GainNode | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private masterGainNode: GainNode | null = null;
  public analyserNode: AnalyserNode | null = null;

  private isBypassed = false;
  private isPlaying = false;
  private currentSoundType = 'whispers';
  private loopTimer: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 48000 });
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 512;

      this.preampGainNode = this.ctx.createGain();
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0.5;

      this.masterGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGainNode && this.ctx) {
      const safeVol = Math.max(0, Math.min(1, vol));
      this.masterGainNode.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.05);
    }
  }

  public setBypass(bypass: boolean) {
    this.isBypassed = bypass;
  }

  public applyProfile(profile: DSPProfile) {
    this.initContext();
    if (!this.ctx || !this.preampGainNode || !this.masterGainNode) return;

    // Disconnect old filters
    this.filterNodes.forEach(f => f.disconnect());
    this.filterNodes = [];

    // Preamp linear gain = 10^(preampDb/20)
    const preampLinear = this.isBypassed ? 1.0 : Math.pow(10, profile.preampDb / 20);
    this.preampGainNode.gain.setTargetAtTime(preampLinear, this.ctx.currentTime, 0.02);

    if (this.isBypassed || profile.filters.length === 0) {
      this.preampGainNode.disconnect();
      this.preampGainNode.connect(this.masterGainNode);
      return;
    }

    // Build biquad chain
    let prevNode: AudioNode = this.preampGainNode;
    const activeFilters = profile.filters.filter(f => f.enabled);

    activeFilters.forEach(f => {
      if (!this.ctx) return;
      const bq = this.ctx.createBiquadFilter();
      bq.type = this.mapFilterType(f.type);
      bq.frequency.setValueAtTime(Math.max(20, Math.min(20000, f.freq)), this.ctx.currentTime);
      bq.gain.setValueAtTime(f.gain, this.ctx.currentTime);
      bq.Q.setValueAtTime(Math.max(0.1, f.q), this.ctx.currentTime);

      prevNode.connect(bq);
      this.filterNodes.push(bq);
      prevNode = bq;
    });

    prevNode.connect(this.masterGainNode);
  }

  private mapFilterType(ft: FilterType): BiquadFilterType {
    switch (ft) {
      case 'PK': return 'peaking';
      case 'LS': return 'lowshelf';
      case 'HS': return 'highshelf';
      case 'HP': return 'highpass';
      case 'LP': return 'lowpass';
      case 'BP': return 'bandpass';
      case 'NO': return 'notch';
      default: return 'peaking';
    }
  }

  public startSound(soundType: string, profile: DSPProfile) {
    this.initContext();
    this.stopSound();
    this.currentSoundType = soundType;
    this.isPlaying = true;
    this.applyProfile(profile);

    if (!this.ctx || !this.preampGainNode) return;

    if (soundType === 'whispers') {
      this.playWhisperLoop();
    } else if (soundType === 'scissors') {
      this.playScissorsLoop();
    } else if (soundType === 'pencil') {
      this.playPencilLoop();
    } else if (soundType === 'tapping') {
      this.playTappingLoop();
    } else if (soundType === 'water') {
      this.playWaterSpritzLoop();
    } else if (soundType === 'pink_noise') {
      this.playContinuousNoise('pink');
    }
  }

  public stopSound() {
    this.isPlaying = false;
    if (this.loopTimer) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.sourceNode) {
      try {
        (this.sourceNode as AudioBufferSourceNode).stop();
      } catch {
        // Ignore if already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public playTestPulse(gainDb = 4.0, freq = 1000, durationMs = 3000) {
    this.initContext();
    if (!this.ctx || !this.masterGainNode) return;

    const now = this.ctx.currentTime;
    const durationSec = durationMs / 1000.0;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const linearGain = Math.pow(10, gainDb / 20.0) * 0.15;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(linearGain, now + 0.05);
    gain.gain.setValueAtTime(linearGain, now + durationSec - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  // --- Real-time ASMR Audio Synthesis Generators ---

  private playContinuousNoise(type: 'pink' | 'white') {
    if (!this.ctx || !this.preampGainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
          b6 = white * 0.115926;
        } else {
          data[i] = white * 0.04;
        }
      }
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.preampGainNode);
    src.start();
    this.sourceNode = src;
  }

  private playWhisperLoop() {
    if (!this.ctx || !this.preampGainNode) return;
    this.playContinuousNoise('pink');

    // Modulate formant filter for soft binaural whispering texture
    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.value = 1800;
    formantFilter.Q.value = 1.2;

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = -0.3;

    // Subtle LFO for breathing movement
    let angle = 0;
    this.loopTimer = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      angle += 0.05;
      const panVal = Math.sin(angle) * 0.6;
      panner.pan.setTargetAtTime(panVal, this.ctx.currentTime, 0.1);
      formantFilter.frequency.setTargetAtTime(1400 + Math.sin(angle * 1.5) * 500, this.ctx.currentTime, 0.1);
    }, 100);
  }

  private playScissorsLoop() {
    if (!this.ctx || !this.preampGainNode) return;
    let pan = -0.6;

    const triggerSnip = () => {
      if (!this.ctx || !this.preampGainNode || !this.isPlaying) return;
      pan = -pan + (Math.random() * 0.2 - 0.1);
      const snipDuration = 0.08;
      const now = this.ctx.currentTime;

      // Metallic high frequency pulse
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.9, Math.min(0.9, pan));

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(4200 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + snipDuration);

      oscGain.gain.setValueAtTime(0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + snipDuration);

      // Noise click
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.04), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.005));
      }
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = 0.15;

      osc.connect(oscGain);
      oscGain.connect(panner);
      noiseSrc.connect(noiseGain);
      noiseGain.connect(panner);
      panner.connect(this.preampGainNode);

      osc.start(now);
      osc.stop(now + snipDuration);
      noiseSrc.start(now);
    };

    triggerSnip();
    this.loopTimer = window.setInterval(triggerSnip, 450);
  }

  private playPencilLoop() {
    if (!this.ctx || !this.preampGainNode) return;
    const triggerStroke = () => {
      if (!this.ctx || !this.preampGainNode || !this.isPlaying) return;
      const strokeDuration = 0.25 + Math.random() * 0.2;
      const now = this.ctx.currentTime;

      const bufferSize = Math.floor(this.ctx.sampleRate * strokeDuration);
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buffer.getChannelData(ch);
        for (let i = 0; i < bufferSize; i++) {
          const env = Math.sin((i / bufferSize) * Math.PI);
          d[i] = (Math.random() * 2 - 1) * env * 0.08;
        }
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 4500 + Math.random() * 1200;
      filter.Q.value = 2.0;

      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.random() * 0.8 - 0.4;

      src.connect(filter);
      filter.connect(panner);
      panner.connect(this.preampGainNode);

      src.start(now);
    };

    triggerStroke();
    this.loopTimer = window.setInterval(triggerStroke, 550);
  }

  private playTappingLoop() {
    if (!this.ctx || !this.preampGainNode) return;
    let side = -0.5;

    const triggerTap = () => {
      if (!this.ctx || !this.preampGainNode || !this.isPlaying) return;
      side = side > 0 ? -0.5 : 0.5;
      const now = this.ctx.currentTime;
      const tapDuration = 0.06;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = side;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + tapDuration);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tapDuration);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.preampGainNode);

      osc.start(now);
      osc.stop(now + tapDuration);
    };

    triggerTap();
    this.loopTimer = window.setInterval(triggerTap, 320);
  }

  private playWaterSpritzLoop() {
    if (!this.ctx || !this.preampGainNode) return;
    const triggerSpritz = () => {
      if (!this.ctx || !this.preampGainNode || !this.isPlaying) return;
      const duration = 0.35;
      const now = this.ctx.currentTime;

      const buffer = this.ctx.createBuffer(2, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buffer.getChannelData(ch);
        for (let i = 0; i < d.length; i++) {
          const env = Math.exp(-i / (this.ctx.sampleRate * 0.08));
          d[i] = (Math.random() * 2 - 1) * env * 0.1;
        }
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7500;

      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.random() * 0.6 - 0.3;

      src.connect(hp);
      hp.connect(panner);
      panner.connect(this.preampGainNode);

      src.start(now);
    };

    triggerSpritz();
    this.loopTimer = window.setInterval(triggerSpritz, 900);
  }
}

export const dspAudioEngine = new WebAudioDSPEngine();
