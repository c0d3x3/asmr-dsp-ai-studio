import { DSPProfile, EQFilter, FilterType } from '../types';

export function computeBiquadGainAtFreq(
  type: FilterType,
  f0: number,
  gainDb: number,
  q: number,
  targetFreq: number,
  fs: number = 48000
): number {
  const f = Math.max(10, Math.min(fs * 0.499, f0));
  const safeQ = Math.max(0.01, q);
  const A = Math.pow(10, gainDb / 40.0);
  const w0 = (2.0 * Math.PI * f) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2.0 * safeQ);

  let b0 = 1.0, b1 = 0.0, b2 = 0.0;
  let a0 = 1.0, a1 = 0.0, a2 = 0.0;

  switch (type) {
    case 'PK':
      b0 = 1.0 + alpha * A;
      b1 = -2.0 * cosW0;
      b2 = 1.0 - alpha * A;
      a0 = 1.0 + alpha / A;
      a1 = -2.0 * cosW0;
      a2 = 1.0 - alpha / A;
      break;
    case 'LS': {
      const twoSqrtAAlpha = 2.0 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1.0) - (A - 1.0) * cosW0 + twoSqrtAAlpha);
      b1 = 2.0 * A * ((A - 1.0) - (A + 1.0) * cosW0);
      b2 = A * ((A + 1.0) - (A - 1.0) * cosW0 - twoSqrtAAlpha);
      a0 = (A + 1.0) + (A - 1.0) * cosW0 + twoSqrtAAlpha;
      a1 = -2.0 * ((A - 1.0) + (A + 1.0) * cosW0);
      a2 = (A + 1.0) + (A - 1.0) * cosW0 - twoSqrtAAlpha;
      break;
    }
    case 'HS': {
      const twoSqrtAAlpha = 2.0 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1.0) + (A - 1.0) * cosW0 + twoSqrtAAlpha);
      b1 = -2.0 * A * ((A - 1.0) + (A + 1.0) * cosW0);
      b2 = A * ((A + 1.0) + (A - 1.0) * cosW0 - twoSqrtAAlpha);
      a0 = (A + 1.0) - (A - 1.0) * cosW0 + twoSqrtAAlpha;
      a1 = 2.0 * ((A - 1.0) - (A + 1.0) * cosW0);
      a2 = (A + 1.0) - (A - 1.0) * cosW0 - twoSqrtAAlpha;
      break;
    }
    case 'HP':
      b0 = (1.0 + cosW0) / 2.0;
      b1 = -(1.0 + cosW0);
      b2 = (1.0 + cosW0) / 2.0;
      a0 = 1.0 + alpha;
      a1 = -2.0 * cosW0;
      a2 = 1.0 - alpha;
      break;
    case 'LP':
      b0 = (1.0 - cosW0) / 2.0;
      b1 = 1.0 - cosW0;
      b2 = (1.0 - cosW0) / 2.0;
      a0 = 1.0 + alpha;
      a1 = -2.0 * cosW0;
      a2 = 1.0 - alpha;
      break;
    case 'NO':
      b0 = 1.0;
      b1 = -2.0 * cosW0;
      b2 = 1.0;
      a0 = 1.0 + alpha;
      a1 = -2.0 * cosW0;
      a2 = 1.0 - alpha;
      break;
    case 'BP':
      b0 = alpha;
      b1 = 0.0;
      b2 = -alpha;
      a0 = 1.0 + alpha;
      a1 = -2.0 * cosW0;
      a2 = 1.0 - alpha;
      break;
  }

  // Normalize by a0
  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  // Evaluate transfer function at target frequency
  const w = (2.0 * Math.PI * targetFreq) / fs;
  const cosW = Math.cos(w);
  const cos2W = Math.cos(2.0 * w);
  const sinW = Math.sin(w);
  const sin2W = Math.sin(2.0 * w);

  const numRe = nb0 + nb1 * cosW + nb2 * cos2W;
  const numIm = -nb1 * sinW - nb2 * sin2W;

  const denRe = 1.0 + na1 * cosW + na2 * cos2W;
  const denIm = -na1 * sinW - na2 * sin2W;

  const numMagSq = numRe * numRe + numIm * numIm;
  const denMagSq = denRe * denRe + denIm * denIm;

  if (denMagSq <= 1e-12) return 0.0;
  const mag = Math.sqrt(numMagSq / denMagSq);
  return 20.0 * Math.log10(Math.max(1e-6, mag));
}

export function generateLogFrequencies(pointsCount = 240, minF = 20, maxF = 20000): number[] {
  const logMin = Math.log10(minF);
  const logMax = Math.log10(maxF);
  const step = (logMax - logMin) / (pointsCount - 1);
  const freqs: number[] = [];
  for (let i = 0; i < pointsCount; i++) {
    freqs.push(Math.pow(10, logMin + i * step));
  }
  return freqs;
}

export function computeProfileResponse(profile: DSPProfile, freqs: number[]): number[] {
  return freqs.map(f => {
    let total = profile.preampDb;
    for (const filter of profile.filters) {
      if (filter.enabled) {
        total += computeBiquadGainAtFreq(filter.type, filter.freq, filter.gain, filter.q, f);
      }
    }
    return total;
  });
}

export function analyzeHeadroom(profile: DSPProfile): {
  maxBoostDb: number;
  recommendedPreampDb: number;
  effectivePeakDb: number;
  headroomDb: number;
  isClippingRisk: boolean;
} {
  const freqs = generateLogFrequencies(300, 20, 20000);
  const rawGains = freqs.map(f => {
    let sum = 0;
    for (const filter of profile.filters) {
      if (filter.enabled) {
        sum += computeBiquadGainAtFreq(filter.type, filter.freq, filter.gain, filter.q, f);
      }
    }
    return sum;
  });

  const maxBoost = Math.max(0, ...rawGains);
  const recommendedPreamp = maxBoost > 0.01 ? -(maxBoost + 0.2) : 0.0;
  const effectivePeak = maxBoost + profile.preampDb;
  const isClippingRisk = effectivePeak > 0.05;

  return {
    maxBoostDb: Math.round(maxBoost * 100) / 100,
    recommendedPreampDb: Math.round(recommendedPreamp * 100) / 100,
    effectivePeakDb: Math.round(effectivePeak * 100) / 100,
    headroomDb: Math.round(-effectivePeak * 100) / 100,
    isClippingRisk,
  };
}

export function generateAPOConfigText(profile: DSPProfile, deviceOverride?: string): string {
  const device = deviceOverride || profile.targetDevice || 'PRO X SE Gaming Headset';
  const lines: string[] = [
    '# ====================================================================',
    '# ASMR-DSP Equalizer APO Generated Configuration',
    `# Profile: ${profile.name} (${profile.category})`,
    `# Target Device: ${device}`,
    `# Preamp / Headroom: ${profile.preampDb >= 0 ? '+' : ''}${profile.preampDb.toFixed(2)} dB`,
    `# Generated: ${new Date().toISOString()}`,
    '# ====================================================================',
    '',
  ];

  if (device.toLowerCase() !== 'all devices') {
    lines.push(`Device: "${device}"`);
    lines.push('');
  }

  lines.push(`Preamp: ${profile.preampDb >= 0 ? '+' : ''}${profile.preampDb.toFixed(2)} dB`);
  lines.push('');

  if (profile.spatial?.crossfeedEnabled) {
    lines.push('# --- ASMR Gentle Crossfeed Simulation (Bauer/Chu Moy) ---');
    lines.push(`Filter: ON LSC Fc ${profile.spatial.crossfeedCutoffHz.toFixed(0)} Hz Gain ${profile.spatial.crossfeedFeedDb.toFixed(1)} dB Q 0.707`);
    lines.push('');
  }

  if (profile.spatial?.hfSmoothingEnabled) {
    lines.push('# --- ASMR Anti-Fatigue Gentle High Roll-off ---');
    lines.push(`Filter: ON HSC Fc ${profile.spatial.hfSmoothingCutoff.toFixed(0)} Hz Gain -2.00 dB Q 0.707`);
    lines.push('');
  }

  lines.push('# --- Parametric Equalizer Filters ---');
  profile.filters.forEach((f, idx) => {
    const status = f.enabled ? 'ON' : 'OFF';
    const comment = f.comment ? ` # ${f.comment}` : '';
    let apoType = f.type;
    if (f.type === 'LS') apoType = 'LSC' as FilterType;
    if (f.type === 'HS') apoType = 'HSC' as FilterType;

    if (f.type === 'HP' || f.type === 'LP') {
      lines.push(`Filter ${idx + 1}: ${status} ${apoType} Fc ${f.freq.toFixed(1)} Hz${comment}`);
    } else {
      lines.push(
        `Filter ${idx + 1}: ${status} ${apoType} Fc ${f.freq.toFixed(1)} Hz Gain ${f.gain >= 0 ? '+' : ''}${f.gain.toFixed(2)} dB Q ${f.q.toFixed(3)}${comment}`
      );
    }
  });

  lines.push('');
  return lines.join('\n');
}
