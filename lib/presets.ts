export type PresetId =
  | 'neon-contour'
  | 'silhouette-etch'
  | 'industrial-noise'
  | 'crowd-ghost'
  | 'topo-stroke';

export type PipelinePreset = {
  id: PresetId;
  name: string;
  description: string;
  edgeWeight: number;
  fillWeight: number;
  textureWeight: number;
  ghostWeight: number;
  strokeThickness: number;
  grainScale: number;
  smoothing: number;
  whiteCoverageTarget: number;
  coverageTolerance: number;
  componentMinArea: number;
  componentMaxCount: number;
  centerBias: number;
  edgeGamma: number;
  fillGamma: number;
  bandFrequency: number;
  spaceiness: number;
  backgroundSuppression: number;
  lumaSuppression: number;
  isolationRadius: number;
  isolateWhites: boolean;
  minWhiteCoverageFloor: number;
  centerFocus: number;
  topSuppression: number;
  dither: 'floyd' | 'bayer';
};

export const PRESETS: Record<PresetId, PipelinePreset> = {
  'neon-contour': {
    id: 'neon-contour',
    name: 'Neon Contour',
    description: 'Sharp contour strokes with sparse white highlights.',
    edgeWeight: 0.82,
    fillWeight: 0.2,
    textureWeight: 0.2,
    ghostWeight: 0.72,
    strokeThickness: 1,
    grainScale: 7,
    smoothing: 1.4,
    whiteCoverageTarget: 0.13,
    coverageTolerance: 0.025,
    componentMinArea: 2,
    componentMaxCount: 9000,
    centerBias: 0.3,
    edgeGamma: 0.74,
    fillGamma: 1.6,
    bandFrequency: 2.8,
    spaceiness: 0.68,
    backgroundSuppression: 0.72,
    lumaSuppression: 0.66,
    isolationRadius: 1,
    isolateWhites: true,
    minWhiteCoverageFloor: 0.08,
    centerFocus: 0.48,
    topSuppression: 0.34,
    dither: 'floyd'
  },
  'silhouette-etch': {
    id: 'silhouette-etch',
    name: 'Silhouette Etch',
    description: 'Readable subject shape with sparse etched ghost detail.',
    edgeWeight: 0.5,
    fillWeight: 0.28,
    textureWeight: 0.12,
    ghostWeight: 0.58,
    strokeThickness: 2,
    grainScale: 8,
    smoothing: 1.6,
    whiteCoverageTarget: 0.15,
    coverageTolerance: 0.025,
    componentMinArea: 3,
    componentMaxCount: 7000,
    centerBias: 0.34,
    edgeGamma: 0.9,
    fillGamma: 1.26,
    bandFrequency: 2.2,
    spaceiness: 0.56,
    backgroundSuppression: 0.7,
    lumaSuppression: 0.56,
    isolationRadius: 1,
    isolateWhites: true,
    minWhiteCoverageFloor: 0.05,
    centerFocus: 0.42,
    topSuppression: 0.3,
    dither: 'bayer'
  },
  'industrial-noise': {
    id: 'industrial-noise',
    name: 'Industrial Noise',
    description: 'Busy scene abstraction with spaced glitch bands and grit.',
    edgeWeight: 0.62,
    fillWeight: 0.3,
    textureWeight: 0.5,
    ghostWeight: 0.42,
    strokeThickness: 1,
    grainScale: 5,
    smoothing: 1,
    whiteCoverageTarget: 0.16,
    coverageTolerance: 0.03,
    componentMinArea: 2,
    componentMaxCount: 12000,
    centerBias: 0.06,
    edgeGamma: 0.86,
    fillGamma: 1.2,
    bandFrequency: 3.6,
    spaceiness: 0.62,
    backgroundSuppression: 0.44,
    lumaSuppression: 0.38,
    isolationRadius: 1,
    isolateWhites: false,
    minWhiteCoverageFloor: 0.12,
    centerFocus: 0.1,
    topSuppression: 0.15,
    dither: 'floyd'
  },
  'crowd-ghost': {
    id: 'crowd-ghost',
    name: 'Crowd Ghost',
    description: 'Airy clustered micro-strokes with ghostly subject persistence.',
    edgeWeight: 0.54,
    fillWeight: 0.2,
    textureWeight: 0.32,
    ghostWeight: 0.78,
    strokeThickness: 1,
    grainScale: 7,
    smoothing: 1.8,
    whiteCoverageTarget: 0.12,
    coverageTolerance: 0.02,
    componentMinArea: 1,
    componentMaxCount: 14000,
    centerBias: 0.3,
    edgeGamma: 0.94,
    fillGamma: 1.4,
    bandFrequency: 2.5,
    spaceiness: 0.83,
    backgroundSuppression: 0.82,
    lumaSuppression: 0.82,
    isolationRadius: 1,
    isolateWhites: true,
    minWhiteCoverageFloor: 0.04,
    centerFocus: 0.52,
    topSuppression: 0.52,
    dither: 'bayer'
  },
  'topo-stroke': {
    id: 'topo-stroke',
    name: 'Topo Stroke',
    description: 'Flowing contour bands with drifting white islands.',
    edgeWeight: 0.66,
    fillWeight: 0.24,
    textureWeight: 0.28,
    ghostWeight: 0.84,
    strokeThickness: 1,
    grainScale: 4,
    smoothing: 1.4,
    whiteCoverageTarget: 0.15,
    coverageTolerance: 0.03,
    componentMinArea: 1,
    componentMaxCount: 11000,
    centerBias: 0.24,
    edgeGamma: 0.8,
    fillGamma: 1.35,
    bandFrequency: 4.2,
    spaceiness: 0.7,
    backgroundSuppression: 0.68,
    lumaSuppression: 0.6,
    isolationRadius: 1,
    isolateWhites: true,
    minWhiteCoverageFloor: 0.09,
    centerFocus: 0.45,
    topSuppression: 0.3,
    dither: 'floyd'
  }
};

export const PRESET_LIST = Object.values(PRESETS);
