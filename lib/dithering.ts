export type DitherAlgorithmId =
  | 'floyd-steinberg'
  | 'atkinson'
  | 'stucki'
  | 'jarvis-judice-ninke'
  | 'sierra-lite'
  | 'burkes'
  | 'bayer-8x8';

type DiffusionOffset = {
  dx: number;
  dy: number;
  weight: number;
};

type DitherAlgorithmBase = {
  id: DitherAlgorithmId;
  name: string;
  description: string;
};

type ErrorDiffusionAlgorithm = DitherAlgorithmBase & {
  kind: 'error-diffusion';
  kernel: readonly DiffusionOffset[];
  serpentine: boolean;
};

type OrderedDitherAlgorithm = DitherAlgorithmBase & {
  kind: 'ordered';
  matrix: readonly (readonly number[])[];
  biasScale: number;
};

export type DitherAlgorithm = ErrorDiffusionAlgorithm | OrderedDitherAlgorithm;
export type DitherAlgorithmSummary = DitherAlgorithmBase;

const BAYER_8X8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21]
] as const;

export const DITHER_ALGORITHM_MAP: Record<DitherAlgorithmId, DitherAlgorithm> = {
  'floyd-steinberg': {
    id: 'floyd-steinberg',
    name: 'Floyd-Steinberg',
    description: 'Balanced classic diffusion with crisp detail and familiar newspaper bite.',
    kind: 'error-diffusion',
    serpentine: true,
    kernel: [
      { dx: 1, dy: 0, weight: 7 / 16 },
      { dx: -1, dy: 1, weight: 3 / 16 },
      { dx: 0, dy: 1, weight: 5 / 16 },
      { dx: 1, dy: 1, weight: 1 / 16 }
    ]
  },
  atkinson: {
    id: 'atkinson',
    name: 'Atkinson',
    description: 'Punchy vintage diffusion that keeps airy highlights without getting muddy.',
    kind: 'error-diffusion',
    serpentine: true,
    kernel: [
      { dx: 1, dy: 0, weight: 1 / 8 },
      { dx: 2, dy: 0, weight: 1 / 8 },
      { dx: -1, dy: 1, weight: 1 / 8 },
      { dx: 0, dy: 1, weight: 1 / 8 },
      { dx: 1, dy: 1, weight: 1 / 8 },
      { dx: 0, dy: 2, weight: 1 / 8 }
    ]
  },
  stucki: {
    id: 'stucki',
    name: 'Stucki',
    description: 'Smooth, rich diffusion with broader error spread for dense midtone texture.',
    kind: 'error-diffusion',
    serpentine: true,
    kernel: [
      { dx: 1, dy: 0, weight: 8 / 42 },
      { dx: 2, dy: 0, weight: 4 / 42 },
      { dx: -2, dy: 1, weight: 2 / 42 },
      { dx: -1, dy: 1, weight: 4 / 42 },
      { dx: 0, dy: 1, weight: 8 / 42 },
      { dx: 1, dy: 1, weight: 4 / 42 },
      { dx: 2, dy: 1, weight: 2 / 42 },
      { dx: -2, dy: 2, weight: 1 / 42 },
      { dx: -1, dy: 2, weight: 2 / 42 },
      { dx: 0, dy: 2, weight: 4 / 42 },
      { dx: 1, dy: 2, weight: 2 / 42 },
      { dx: 2, dy: 2, weight: 1 / 42 }
    ]
  },
  'jarvis-judice-ninke': {
    id: 'jarvis-judice-ninke',
    name: 'Jarvis-Judice-Ninke',
    description: 'Wide, painterly diffusion that preserves gradients with softer grain.',
    kind: 'error-diffusion',
    serpentine: true,
    kernel: [
      { dx: 1, dy: 0, weight: 7 / 48 },
      { dx: 2, dy: 0, weight: 5 / 48 },
      { dx: -2, dy: 1, weight: 3 / 48 },
      { dx: -1, dy: 1, weight: 5 / 48 },
      { dx: 0, dy: 1, weight: 7 / 48 },
      { dx: 1, dy: 1, weight: 5 / 48 },
      { dx: 2, dy: 1, weight: 3 / 48 },
      { dx: -2, dy: 2, weight: 1 / 48 },
      { dx: -1, dy: 2, weight: 3 / 48 },
      { dx: 0, dy: 2, weight: 5 / 48 },
      { dx: 1, dy: 2, weight: 3 / 48 },
      { dx: 2, dy: 2, weight: 1 / 48 }
    ]
  },
  'sierra-lite': {
    id: 'sierra-lite',
    name: 'Sierra Lite',
    description: 'Lean diffusion with a clean, controlled texture that stays readable fast.',
    kind: 'error-diffusion',
    serpentine: true,
    kernel: [
      { dx: 1, dy: 0, weight: 2 / 4 },
      { dx: -1, dy: 1, weight: 1 / 4 },
      { dx: 0, dy: 1, weight: 1 / 4 }
    ]
  },
  burkes: {
    id: 'burkes',
    name: 'Burkes',
    description: 'Sharper wide-kernel diffusion that lands between Floyd and Stucki.',
    kind: 'error-diffusion',
    serpentine: true,
    kernel: [
      { dx: 1, dy: 0, weight: 8 / 32 },
      { dx: 2, dy: 0, weight: 4 / 32 },
      { dx: -2, dy: 1, weight: 2 / 32 },
      { dx: -1, dy: 1, weight: 4 / 32 },
      { dx: 0, dy: 1, weight: 8 / 32 },
      { dx: 1, dy: 1, weight: 4 / 32 },
      { dx: 2, dy: 1, weight: 2 / 32 }
    ]
  },
  'bayer-8x8': {
    id: 'bayer-8x8',
    name: 'Bayer 8×8',
    description: 'Ordered grid dither with deliberate, graphic patterning and stable silhouettes.',
    kind: 'ordered',
    matrix: BAYER_8X8,
    biasScale: 0.18
  }
};

export const DITHER_ALGORITHM_LIST: DitherAlgorithmSummary[] = Object.values(DITHER_ALGORITHM_MAP).map(
  ({ id, name, description }) => ({ id, name, description })
);

export function isDitherAlgorithmId(value: unknown): value is DitherAlgorithmId {
  return typeof value === 'string' && value in DITHER_ALGORITHM_MAP;
}

export function getDitherAlgorithmSummary(id: DitherAlgorithmId): DitherAlgorithmSummary {
  const { name, description } = DITHER_ALGORITHM_MAP[id];
  return { id, name, description };
}

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function orderedDither(
  map: Float32Array,
  width: number,
  height: number,
  threshold: number,
  algorithm: OrderedDitherAlgorithm
) {
  const out = new Uint8Array(width * height);
  const matrixSize = algorithm.matrix.length;
  const matrixArea = matrixSize * matrixSize;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const matrixValue = algorithm.matrix[y % matrixSize]?.[x % matrixSize] ?? 0;
      const bias = (matrixValue / matrixArea - 0.5) * algorithm.biasScale;
      out[i] = map[i] > threshold + bias ? 1 : 0;
    }
  }

  return out;
}

function errorDiffusionDither(
  map: Float32Array,
  width: number,
  height: number,
  threshold: number,
  algorithm: ErrorDiffusionAlgorithm
) {
  const work = new Float32Array(map);
  const out = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const reverse = algorithm.serpentine && y % 2 === 1;
    const xStart = reverse ? width - 1 : 0;
    const xEnd = reverse ? -1 : width;
    const step = reverse ? -1 : 1;

    for (let x = xStart; x !== xEnd; x += step) {
      const i = y * width + x;
      const oldValue = clamp01(work[i]);
      const nextValue = oldValue >= threshold ? 1 : 0;
      const error = oldValue - nextValue;
      out[i] = nextValue;

      for (const offset of algorithm.kernel) {
        const dx = reverse ? -offset.dx : offset.dx;
        const nx = x + dx;
        const ny = y + offset.dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        work[ny * width + nx] += error * offset.weight;
      }
    }
  }

  return out;
}

export function applyDither(
  map: Float32Array,
  width: number,
  height: number,
  algorithmId: DitherAlgorithmId,
  threshold: number
) {
  const algorithm = DITHER_ALGORITHM_MAP[algorithmId];
  if (algorithm.kind === 'ordered') {
    return orderedDither(map, width, height, threshold, algorithm);
  }
  return errorDiffusionDither(map, width, height, threshold, algorithm);
}
