import { PRESET_MAP, PRESET_LIST, type PipelinePreset, type PresetId } from './presets';

export type TransformSettings = {
  presetId: PresetId;
  lookId: string;
  lookLabel: string;
  lookDescription: string;
  contour: number;
  fill: number;
  texture: number;
  ghost: number;
  density: number;
  air: number;
  focus: number;
  stroke: number;
  cleanup: number;
};

export type ControlKey = Exclude<keyof TransformSettings, 'presetId' | 'lookId' | 'lookLabel' | 'lookDescription'>;

export type AdvancedControl = {
  key: ControlKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
};

export const DEFAULT_CONTROL_VALUE = 50;

export const ADVANCED_CONTROLS: AdvancedControl[] = [
  {
    key: 'contour',
    label: 'Contour',
    description: 'How aggressively the image hugs subject edges.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'fill',
    label: 'Fill',
    description: 'How much interior shape survives instead of pure outline.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'texture',
    label: 'Texture',
    description: 'Adds grit, grain, and busy detail without breaking binary output.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'ghost',
    label: 'Ghost',
    description: 'Controls halo bands and spectral secondary strokes.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'density',
    label: 'Density',
    description: 'Overall amount of white ink the renderer tries to keep.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'air',
    label: 'Air',
    description: 'Makes the frame more sparse and breathable.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'focus',
    label: 'Focus',
    description: 'Pulls attention toward the main subject instead of the background.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'stroke',
    label: 'Stroke',
    description: 'Thickens or thins the white marks.',
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: 'cleanup',
    label: 'Cleanup',
    description: 'Suppresses background clutter and dirty highlights.',
    min: 0,
    max: 100,
    step: 1
  }
];

const CONTROL_KEYS: ControlKey[] = ADVANCED_CONTROLS.map((control) => control.key);

const PRESET_DEFAULTS: Record<PresetId, Pick<TransformSettings, ControlKey>> = {
  'neon-contour': {
    contour: 62,
    fill: 36,
    texture: 34,
    ghost: 76,
    density: 42,
    air: 70,
    focus: 64,
    stroke: 34,
    cleanup: 72
  },
  'silhouette-etch': {
    contour: 48,
    fill: 58,
    texture: 26,
    ghost: 54,
    density: 54,
    air: 50,
    focus: 58,
    stroke: 72,
    cleanup: 64
  },
  'industrial-noise': {
    contour: 54,
    fill: 62,
    texture: 84,
    ghost: 40,
    density: 62,
    air: 42,
    focus: 28,
    stroke: 28,
    cleanup: 36
  },
  'crowd-ghost': {
    contour: 46,
    fill: 32,
    texture: 54,
    ghost: 88,
    density: 36,
    air: 86,
    focus: 66,
    stroke: 26,
    cleanup: 84
  },
  'topo-stroke': {
    contour: 58,
    fill: 46,
    texture: 48,
    ghost: 80,
    density: 54,
    air: 68,
    focus: 56,
    stroke: 30,
    cleanup: 60
  }
};

type RandomRecipe = {
  id: string;
  name: string;
  description: string;
  weight: number;
  presetIds: PresetId[];
  ranges: Record<ControlKey, readonly [number, number]>;
};

const RANDOM_RECIPES: RandomRecipe[] = [
  {
    id: 'halo-drift',
    name: 'Halo Drift',
    description: 'Airy contours and good-looking spectral bleed without turning into soup.',
    weight: 1.3,
    presetIds: ['neon-contour', 'topo-stroke'],
    ranges: {
      contour: [58, 86],
      fill: [30, 56],
      texture: [28, 52],
      ghost: [70, 95],
      density: [38, 60],
      air: [60, 88],
      focus: [54, 78],
      stroke: [30, 56],
      cleanup: [58, 84]
    }
  },
  {
    id: 'etched-focus',
    name: 'Etched Focus',
    description: 'Crisp subject readability with denser interior structure and clean framing.',
    weight: 1.1,
    presetIds: ['silhouette-etch', 'neon-contour'],
    ranges: {
      contour: [48, 74],
      fill: [46, 80],
      texture: [18, 42],
      ghost: [34, 62],
      density: [48, 72],
      air: [30, 58],
      focus: [54, 80],
      stroke: [54, 86],
      cleanup: [54, 82]
    }
  },
  {
    id: 'glitch-grit',
    name: 'Glitch Grit',
    description: 'Busy, crunchy texture for scenes that want a bit more menace.',
    weight: 1,
    presetIds: ['industrial-noise', 'topo-stroke'],
    ranges: {
      contour: [48, 74],
      fill: [40, 66],
      texture: [60, 94],
      ghost: [34, 66],
      density: [52, 76],
      air: [30, 56],
      focus: [18, 46],
      stroke: [24, 52],
      cleanup: [26, 58]
    }
  },
  {
    id: 'crowd-glow',
    name: 'Crowd Glow',
    description: 'Ghost-heavy clustered white marks that still keep the subject legible.',
    weight: 1.15,
    presetIds: ['crowd-ghost', 'neon-contour'],
    ranges: {
      contour: [42, 66],
      fill: [26, 50],
      texture: [42, 70],
      ghost: [76, 98],
      density: [34, 54],
      air: [74, 96],
      focus: [56, 80],
      stroke: [22, 44],
      cleanup: [66, 90]
    }
  },
  {
    id: 'stark-poster',
    name: 'Stark Poster',
    description: 'Bold, cleaner, punchier silhouettes with very little decorative nonsense.',
    weight: 0.95,
    presetIds: ['silhouette-etch', 'neon-contour'],
    ranges: {
      contour: [72, 98],
      fill: [34, 62],
      texture: [8, 28],
      ghost: [22, 46],
      density: [42, 66],
      air: [18, 46],
      focus: [62, 88],
      stroke: [62, 94],
      cleanup: [64, 92]
    }
  },
  {
    id: 'topo-flow',
    name: 'Topo Flow',
    description: 'Contour islands and drifting bands that keep landing in nice territory.',
    weight: 1.05,
    presetIds: ['topo-stroke', 'neon-contour'],
    ranges: {
      contour: [54, 78],
      fill: [32, 58],
      texture: [34, 58],
      ghost: [60, 84],
      density: [44, 68],
      air: [52, 76],
      focus: [40, 64],
      stroke: [28, 56],
      cleanup: [48, 72]
    }
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function clampControl(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_CONTROL_VALUE;
  return clamp(round(numeric), 0, 100);
}

function controlBias(value: number) {
  return (value - 50) / 50;
}

function roundToStep(value: number, step = 0.001) {
  return Math.round(value / step) * step;
}

function clampFloat(value: number, min: number, max: number, step = 0.001) {
  return roundToStep(clamp(value, min, max), step);
}

function clampInt(value: number, min: number, max: number) {
  return Math.round(clamp(value, min, max));
}

function weightedPick<T extends { weight: number }>(items: T[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function pickPresetId(recipe: RandomRecipe, current?: TransformSettings) {
  if (current && recipe.presetIds.includes(current.presetId) && Math.random() < 0.58) {
    return current.presetId;
  }

  return recipe.presetIds[Math.floor(Math.random() * recipe.presetIds.length)] ?? recipe.presetIds[0];
}

function triangularSample(min: number, max: number, mode: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const safeMode = clamp(mode, low, high);
  if (high === low) return low;

  const ratio = (safeMode - low) / (high - low);
  const random = Math.random();

  if (random <= ratio) {
    return low + Math.sqrt(random * (high - low) * (safeMode - low));
  }

  return high - Math.sqrt((1 - random) * (high - low) * (high - safeMode));
}

function formatBaseLook(presetId: PresetId) {
  const base = PRESET_MAP[presetId];
  return {
    lookId: base.id,
    lookLabel: base.name,
    lookDescription: base.description
  };
}

export function createSettingsFromPreset(presetId: PresetId = 'neon-contour'): TransformSettings {
  return {
    presetId,
    ...formatBaseLook(presetId),
    ...PRESET_DEFAULTS[presetId]
  };
}

export function makeCustomSettings(settings: TransformSettings, reason = 'Manual tune from the current look.') {
  const base = PRESET_MAP[settings.presetId];
  return {
    ...settings,
    lookId: `custom-${settings.presetId}`,
    lookLabel: `Custom ${base.name}`,
    lookDescription: reason
  };
}

export function sanitizeTransformSettings(input: unknown): TransformSettings {
  if (!input || typeof input !== 'object') {
    return createSettingsFromPreset();
  }

  const value = input as Partial<TransformSettings>;
  const presetId = value.presetId && value.presetId in PRESET_MAP ? value.presetId : 'neon-contour';
  const fallback = createSettingsFromPreset(presetId);

  const next: TransformSettings = {
    ...fallback,
    presetId,
    lookId: typeof value.lookId === 'string' && value.lookId.trim() ? value.lookId : fallback.lookId,
    lookLabel: typeof value.lookLabel === 'string' && value.lookLabel.trim() ? value.lookLabel.trim() : fallback.lookLabel,
    lookDescription:
      typeof value.lookDescription === 'string' && value.lookDescription.trim()
        ? value.lookDescription.trim()
        : fallback.lookDescription,
    contour: fallback.contour,
    fill: fallback.fill,
    texture: fallback.texture,
    ghost: fallback.ghost,
    density: fallback.density,
    air: fallback.air,
    focus: fallback.focus,
    stroke: fallback.stroke,
    cleanup: fallback.cleanup
  };

  for (const key of CONTROL_KEYS) {
    next[key] = clampControl(value[key]);
  }

  return next;
}

export function serializeTransformSettings(settings: TransformSettings) {
  const clean = sanitizeTransformSettings(settings);
  return JSON.stringify({
    presetId: clean.presetId,
    lookId: clean.lookId,
    lookLabel: clean.lookLabel,
    lookDescription: clean.lookDescription,
    contour: clean.contour,
    fill: clean.fill,
    texture: clean.texture,
    ghost: clean.ghost,
    density: clean.density,
    air: clean.air,
    focus: clean.focus,
    stroke: clean.stroke,
    cleanup: clean.cleanup
  });
}

export function randomizeSettings(current?: TransformSettings): TransformSettings {
  const recipe = weightedPick(RANDOM_RECIPES);
  const presetId = pickPresetId(recipe, current);
  const fallback = createSettingsFromPreset(presetId);

  const next: TransformSettings = {
    ...fallback,
    presetId,
    lookId: recipe.id,
    lookLabel: recipe.name,
    lookDescription: recipe.description
  };

  for (const key of CONTROL_KEYS) {
    const [min, max] = recipe.ranges[key];
    const target = current?.presetId === presetId ? current[key] : fallback[key];
    const mode = clamp(target, min, max);
    next[key] = clampControl(triangularSample(min, max, mode));
  }

  return next;
}

export function resolvePipelinePreset(settings: TransformSettings): PipelinePreset {
  const clean = sanitizeTransformSettings(settings);
  const base = PRESET_MAP[clean.presetId];

  const contour = controlBias(clean.contour);
  const fill = controlBias(clean.fill);
  const texture = controlBias(clean.texture);
  const ghost = controlBias(clean.ghost);
  const density = controlBias(clean.density);
  const air = controlBias(clean.air);
  const focus = controlBias(clean.focus);
  const stroke = controlBias(clean.stroke);
  const cleanup = controlBias(clean.cleanup);

  const strokeThickness = clampInt(base.strokeThickness + stroke * 1.2, 1, 3);
  const whiteCoverageTarget = clampFloat(base.whiteCoverageTarget + density * 0.042, 0.08, 0.21, 0.001);
  const minWhiteCoverageFloor = clampFloat(
    Math.min(whiteCoverageTarget - 0.015, base.minWhiteCoverageFloor + density * 0.028),
    0.03,
    0.16,
    0.001
  );

  return {
    ...base,
    name: clean.lookLabel,
    description: clean.lookDescription,
    edgeWeight: clampFloat(base.edgeWeight + contour * 0.18 + focus * 0.03, 0.28, 1),
    fillWeight: clampFloat(base.fillWeight + fill * 0.18, 0.05, 0.5),
    textureWeight: clampFloat(base.textureWeight + texture * 0.22, 0.05, 0.68),
    ghostWeight: clampFloat(base.ghostWeight + ghost * 0.22, 0.18, 0.98),
    strokeThickness,
    grainScale: clampInt(base.grainScale + texture * 2.2 - ghost * 0.3, 3, 10),
    smoothing: clampFloat(base.smoothing + stroke * 0.5 + air * 0.15, 0.7, 2.3),
    whiteCoverageTarget,
    coverageTolerance: clampFloat(base.coverageTolerance + Math.abs(density) * 0.006, 0.018, 0.042, 0.001),
    componentMinArea: clampInt(base.componentMinArea + stroke * 0.8 - air * 1.1, 1, 6),
    componentMaxCount: clampInt(base.componentMaxCount + density * 2000 + texture * 1600 - air * 900, 4500, 16000),
    centerBias: clampFloat(base.centerBias + focus * 0.18, 0.02, 0.52),
    edgeGamma: clampFloat(base.edgeGamma - contour * 0.18 + texture * 0.04, 0.58, 1.08),
    fillGamma: clampFloat(base.fillGamma - fill * 0.22 + cleanup * 0.06, 0.9, 1.8),
    bandFrequency: clampFloat(base.bandFrequency + ghost * 0.82 + texture * 0.34, 1.8, 5.4),
    spaceiness: clampFloat(base.spaceiness + air * 0.18 - density * 0.04, 0.38, 0.94),
    backgroundSuppression: clampFloat(base.backgroundSuppression + cleanup * 0.22 + focus * 0.04, 0.28, 0.94),
    lumaSuppression: clampFloat(base.lumaSuppression + cleanup * 0.24 + density * 0.03, 0.24, 0.94),
    isolationRadius: clampInt(base.isolationRadius + (air > 0.18 ? 1 : 0) - (air < -0.45 ? 1 : 0), 0, 2),
    isolateWhites: base.isolateWhites || air > 0.2 || cleanup > 0.18,
    minWhiteCoverageFloor,
    centerFocus: clampFloat(base.centerFocus + focus * 0.22 - texture * 0.03, 0.02, 0.78),
    topSuppression: clampFloat(base.topSuppression + focus * 0.1 + cleanup * 0.08, 0.05, 0.68),
    dither: base.dither
  };
}

export function getPresetSummary(presetId: PresetId) {
  return PRESET_LIST.find((preset) => preset.id === presetId) ?? PRESET_LIST[0];
}
