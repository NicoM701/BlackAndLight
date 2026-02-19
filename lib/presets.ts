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
  dither: 'floyd' | 'bayer';
};

export const PRESETS: Record<PresetId, PipelinePreset> = {
  'neon-contour': {
    id: 'neon-contour',
    name: 'Neon Contour',
    description: 'Sharp contour strokes with sparse white highlights.',
    edgeWeight: 0.82,
    fillWeight: 0.22,
    textureWeight: 0.25,
    strokeThickness: 1,
    grainScale: 5,
    smoothing: 0.9,
    whiteCoverageTarget: 0.12,
    coverageTolerance: 0.025,
    componentMinArea: 6,
    componentMaxCount: 3000,
    centerBias: 0.2,
    edgeGamma: 0.8,
    fillGamma: 1.35,
    dither: 'floyd'
  },
  'silhouette-etch': {
    id: 'silhouette-etch',
    name: 'Silhouette Etch',
    description: 'Thicker lines and region support for readable subject silhouettes.',
    edgeWeight: 0.56,
    fillWeight: 0.45,
    textureWeight: 0.18,
    strokeThickness: 2,
    grainScale: 8,
    smoothing: 1.2,
    whiteCoverageTarget: 0.19,
    coverageTolerance: 0.03,
    componentMinArea: 12,
    componentMaxCount: 2200,
    centerBias: 0.28,
    edgeGamma: 0.95,
    fillGamma: 1.1,
    dither: 'bayer'
  },
  'industrial-noise': {
    id: 'industrial-noise',
    name: 'Industrial Noise',
    description: 'Dense grit and wireframe-like texture for urban scenes.',
    edgeWeight: 0.66,
    fillWeight: 0.4,
    textureWeight: 0.44,
    strokeThickness: 1,
    grainScale: 4,
    smoothing: 0.7,
    whiteCoverageTarget: 0.26,
    coverageTolerance: 0.03,
    componentMinArea: 5,
    componentMaxCount: 4500,
    centerBias: 0.06,
    edgeGamma: 0.9,
    fillGamma: 1,
    dither: 'floyd'
  },
  'crowd-ghost': {
    id: 'crowd-ghost',
    name: 'Crowd Ghost',
    description: 'Soft clustered micro-strokes, suited to people and groups.',
    edgeWeight: 0.6,
    fillWeight: 0.34,
    textureWeight: 0.3,
    strokeThickness: 1,
    grainScale: 6,
    smoothing: 1.4,
    whiteCoverageTarget: 0.16,
    coverageTolerance: 0.02,
    componentMinArea: 8,
    componentMaxCount: 2600,
    centerBias: 0.18,
    edgeGamma: 1,
    fillGamma: 1.2,
    dither: 'bayer'
  },
  'topo-stroke': {
    id: 'topo-stroke',
    name: 'Topo Stroke',
    description: 'Contour-like flowing bands with medium density.',
    edgeWeight: 0.7,
    fillWeight: 0.3,
    textureWeight: 0.35,
    strokeThickness: 1,
    grainScale: 3,
    smoothing: 1,
    whiteCoverageTarget: 0.21,
    coverageTolerance: 0.03,
    componentMinArea: 7,
    componentMaxCount: 3500,
    centerBias: 0.14,
    edgeGamma: 0.85,
    fillGamma: 1.15,
    dither: 'floyd'
  }
};

export const PRESET_LIST = Object.values(PRESETS);
