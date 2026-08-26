export type FilterType = 'PK' | 'LS' | 'HS' | 'HP' | 'LP' | 'BP' | 'NO';

export interface EQFilter {
  id: string;
  type: FilterType;
  freq: number;
  gain: number;
  q: number;
  enabled: boolean;
  comment?: string;
}

export interface SpatialSettings {
  crossfeedEnabled: boolean;
  crossfeedCutoffHz: number;
  crossfeedFeedDb: number;
  hfSmoothingEnabled: boolean;
  hfSmoothingCutoff: number;
}

export interface DSPProfile {
  id: string;
  name: string;
  category: 'ASMR' | 'Music' | 'Gaming' | 'Movies' | 'Reference';
  description: string;
  icon: string;
  targetDevice: string;
  preampDb: number;
  filters: EQFilter[];
  spatial: SpatialSettings;
  isExperimental: boolean;
  isBuiltin: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AudioEndpoint {
  name: string;
  id: string;
  isDefault: boolean;
  isLogitechProX: boolean;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  connectionType: string;
  spatialAudioMode: string;
  isDolbyActive: boolean;
  isApoAttached: boolean;
}

export interface HeadphonePoint {
  freq: number;
  spl: number;
}

export interface TargetCurve {
  id: string;
  name: string;
  description: string;
  points: HeadphonePoint[];
}

export interface ProfileRating {
  id: string;
  profileId: string;
  profileName: string;
  timestamp: string;
  result: 'better' | 'worse' | 'same';
  tags: string[];
  notes: string;
  soundType: string;
}
