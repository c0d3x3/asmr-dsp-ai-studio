import { TargetCurve, HeadphonePoint } from '../types';

export const BUILTIN_TARGET_CURVES: TargetCurve[] = [
  {
    id: 'harman-2018',
    name: 'Harman Over-Ear (2018 Target)',
    description: 'Generic acoustic target curve with warm bass shelf and ear canal pinna gain.',
    points: [
      { freq: 20, spl: 5.5 },
      { freq: 30, spl: 5.4 },
      { freq: 50, spl: 5.0 },
      { freq: 70, spl: 4.2 },
      { freq: 100, spl: 3.0 },
      { freq: 150, spl: 1.8 },
      { freq: 200, spl: 1.0 },
      { freq: 300, spl: 0.3 },
      { freq: 500, spl: 0.0 },
      { freq: 1000, spl: 0.0 },
      { freq: 1500, spl: 0.5 },
      { freq: 2000, spl: 2.5 },
      { freq: 3000, spl: 7.5 },
      { freq: 4000, spl: 6.0 },
      { freq: 5000, spl: 4.0 },
      { freq: 6000, spl: 2.0 },
      { freq: 7000, spl: 1.0 },
      { freq: 8000, spl: 0.0 },
      { freq: 10000, spl: -2.0 },
      { freq: 12000, spl: -4.0 },
      { freq: 15000, spl: -6.0 },
      { freq: 20000, spl: -8.0 },
    ],
  },
  {
    id: 'asmr-warmth',
    name: 'ASMR Warmth & Intimacy Target',
    description: 'Generic acoustic target with gentle low-mid warmth and smoothed upper harmonics.',
    points: [
      { freq: 20, spl: 1.0 },
      { freq: 50, spl: 1.5 },
      { freq: 100, spl: 2.0 },
      { freq: 200, spl: 1.5 },
      { freq: 400, spl: 0.5 },
      { freq: 1000, spl: 0.0 },
      { freq: 2000, spl: 1.0 },
      { freq: 3500, spl: 2.5 },
      { freq: 5000, spl: 1.0 },
      { freq: 7000, spl: -1.0 },
      { freq: 9000, spl: -2.5 },
      { freq: 12000, spl: -4.5 },
      { freq: 16000, spl: -6.5 },
      { freq: 20000, spl: -8.0 },
    ],
  },
  {
    id: 'flat-reference',
    name: 'Flat / Studio Target',
    description: '0 dB uncolored baseline across entire audible spectrum.',
    points: [
      { freq: 20, spl: 0.0 },
      { freq: 1000, spl: 0.0 },
      { freq: 20000, spl: 0.0 },
    ],
  },
];

export const NO_VERIFIED_MEASUREMENT_LABEL = "No verified headphone measurement loaded.";

