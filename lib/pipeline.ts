import sharp from 'sharp';
import { computeBinaryStats, connectedComponents, edgeAlignment, type BinaryImage, type TransformMetrics } from './metrics';
import { PRESETS, type PipelinePreset, type PresetId } from './presets';

export type TransformOptions = {
  presetId: PresetId;
};

export type TransformResult = {
  png: Buffer;
  width: number;
  height: number;
  metrics: TransformMetrics;
  preset: PipelinePreset;
};

type SobelResult = {
  mag: Float32Array;
  gx: Float32Array;
  gy: Float32Array;
};

const EPS = 1e-6;

function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function boxBlur(src: Float32Array, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return new Float32Array(src);
  }

  const tmp = new Float32Array(width * height);
  const dst = new Float32Array(width * height);
  const window = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const x = Math.min(width - 1, Math.max(0, k));
      sum += src[y * width + x];
    }

    for (let x = 0; x < width; x += 1) {
      tmp[y * width + x] = sum / window;

      const removeX = Math.max(0, x - radius);
      const addX = Math.min(width - 1, x + radius + 1);
      sum += src[y * width + addX] - src[y * width + removeX];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const y = Math.min(height - 1, Math.max(0, k));
      sum += tmp[y * width + x];
    }

    for (let y = 0; y < height; y += 1) {
      dst[y * width + x] = sum / window;

      const removeY = Math.max(0, y - radius);
      const addY = Math.min(height - 1, y + radius + 1);
      sum += tmp[addY * width + x] - tmp[removeY * width + x];
    }
  }

  return dst;
}

function normalizeByPercentile(src: Float32Array, pLow = 0.02, pHigh = 0.98) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < src.length; i += 1) {
    const b = Math.min(255, Math.max(0, Math.round(src[i] * 255)));
    hist[b] += 1;
  }

  const lowTarget = src.length * pLow;
  const highTarget = src.length * pHigh;

  let acc = 0;
  let lowBin = 0;
  let highBin = 255;

  for (let i = 0; i < 256; i += 1) {
    acc += hist[i];
    if (acc >= lowTarget) {
      lowBin = i;
      break;
    }
  }

  acc = 0;
  for (let i = 0; i < 256; i += 1) {
    acc += hist[i];
    if (acc >= highTarget) {
      highBin = i;
      break;
    }
  }

  const low = lowBin / 255;
  const high = Math.max(low + 1 / 255, highBin / 255);
  const out = new Float32Array(src.length);

  for (let i = 0; i < src.length; i += 1) {
    out[i] = clamp01((src[i] - low) / (high - low));
  }

  return out;
}

function illuminationNormalize(gray: Float32Array, width: number, height: number) {
  const baseRadius = Math.max(6, Math.floor(Math.min(width, height) * 0.03));
  const low = boxBlur(gray, width, height, baseRadius);
  const out = new Float32Array(gray.length);

  for (let i = 0; i < gray.length; i += 1) {
    const homomorphic = gray[i] / (low[i] + EPS);
    out[i] = Math.log1p(homomorphic * 1.5);
  }

  const normalized = normalizeByPercentile(normalizeByPercentile(out, 0.01, 0.99), 0.02, 0.98);
  const local = boxBlur(normalized, width, height, 2);

  for (let i = 0; i < normalized.length; i += 1) {
    const hp = normalized[i] - local[i];
    normalized[i] = clamp01(0.72 * normalized[i] + 0.28 * (hp + 0.5));
  }

  return normalizeByPercentile(normalized, 0.01, 0.99);
}

function sobel(src: Float32Array, width: number, height: number): SobelResult {
  const gx = new Float32Array(src.length);
  const gy = new Float32Array(src.length);
  const mag = new Float32Array(src.length);

  let maxMag = EPS;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const tl = src[(y - 1) * width + (x - 1)];
      const tc = src[(y - 1) * width + x];
      const tr = src[(y - 1) * width + (x + 1)];
      const ml = src[y * width + (x - 1)];
      const mr = src[y * width + (x + 1)];
      const bl = src[(y + 1) * width + (x - 1)];
      const bc = src[(y + 1) * width + x];
      const br = src[(y + 1) * width + (x + 1)];

      const gxi = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gyi = -tl - 2 * tc - tr + bl + 2 * bc + br;

      gx[i] = gxi;
      gy[i] = gyi;

      const m = Math.hypot(gxi, gyi);
      mag[i] = m;
      if (m > maxMag) {
        maxMag = m;
      }
    }
  }

  for (let i = 0; i < mag.length; i += 1) {
    mag[i] = mag[i] / maxMag;
  }

  return { mag, gx, gy };
}

function estimateForegroundMask(
  norm: Float32Array,
  edgeMag: Float32Array,
  width: number,
  height: number,
  centerBiasWeight: number
) {
  const saliency = new Float32Array(norm.length);
  const blurSmall = boxBlur(norm, width, height, 3);
  const blurLarge = boxBlur(norm, width, height, 14);

  for (let i = 0; i < norm.length; i += 1) {
    saliency[i] = clamp01(Math.abs(blurSmall[i] - blurLarge[i]) * 1.8);
  }

  const score = new Float32Array(norm.length);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.hypot(cx, cy);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const d = Math.hypot(x - cx, y - cy) / maxDist;
      const center = 1 - d;
      score[i] = clamp01(0.48 * edgeMag[i] + 0.42 * saliency[i] + centerBiasWeight * center);
    }
  }

  const hist = new Uint32Array(256);
  for (let i = 0; i < score.length; i += 1) {
    hist[Math.round(score[i] * 255)] += 1;
  }

  const target = score.length * 0.74;
  let acc = 0;
  let thrBin = 160;
  for (let i = 0; i < 256; i += 1) {
    acc += hist[i];
    if (acc >= target) {
      thrBin = i;
      break;
    }
  }

  const thr = thrBin / 255;
  const rawMask = new Float32Array(score.length);
  let white = 0;

  for (let i = 0; i < score.length; i += 1) {
    const v = score[i] > thr ? 1 : 0;
    rawMask[i] = v;
    white += v;
  }

  const ratio = white / score.length;
  const failed = ratio < 0.03 || ratio > 0.92;

  if (failed) {
    return { mask: new Float32Array(score.length).fill(1), fallbackSegmentation: true };
  }

  const smoothMask = boxBlur(rawMask, width, height, 2);
  for (let i = 0; i < smoothMask.length; i += 1) {
    smoothMask[i] = smoothMask[i] > 0.33 ? 1 : 0;
  }

  return { mask: smoothMask, fallbackSegmentation: false };
}

function hashNoise(x: number, y: number) {
  const n = x * 374761393 + y * 668265263;
  const t = (n ^ (n >> 13)) * 1274126177;
  return ((t ^ (t >> 16)) >>> 0) / 4294967295;
}

function buildInkMap(
  norm: Float32Array,
  sobelRes: SobelResult,
  fgMask: Float32Array,
  preset: PipelinePreset,
  width: number,
  height: number
) {
  const detail = new Float32Array(norm.length);
  const smooth = boxBlur(norm, width, height, 2);
  for (let i = 0; i < norm.length; i += 1) {
    detail[i] = Math.abs(norm[i] - smooth[i]);
  }

  const ink = new Float32Array(norm.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const edge = Math.pow(sobelRes.mag[i], preset.edgeGamma);
      const fill = Math.pow(norm[i], preset.fillGamma) * fgMask[i];
      const angle = Math.atan2(sobelRes.gy[i] + EPS, sobelRes.gx[i] + EPS);
      const oriented = (x * Math.cos(angle) + y * Math.sin(angle)) / Math.max(1, preset.grainScale);
      const stripe = Math.sin(oriented * 1.9 + angle * 2.7) * 0.5 + 0.5;
      const noise = hashNoise(x, y) * 0.25;
      const texture = clamp01(0.78 * stripe + noise);

      let v =
        preset.edgeWeight * edge +
        preset.fillWeight * fill +
        0.26 * detail[i] * fgMask[i] +
        preset.textureWeight * texture * fgMask[i];

      v *= 0.55 + 0.45 * fgMask[i];
      ink[i] = clamp01(v);
    }
  }

  return boxBlur(ink, width, height, Math.max(0, Math.round(preset.smoothing)));
}

function bayerDither(map: Float32Array, width: number, height: number, threshold: number) {
  const bayer8 = [
    [0, 48, 12, 60, 3, 51, 15, 63],
    [32, 16, 44, 28, 35, 19, 47, 31],
    [8, 56, 4, 52, 11, 59, 7, 55],
    [40, 24, 36, 20, 43, 27, 39, 23],
    [2, 50, 14, 62, 1, 49, 13, 61],
    [34, 18, 46, 30, 33, 17, 45, 29],
    [10, 58, 6, 54, 9, 57, 5, 53],
    [42, 26, 38, 22, 41, 25, 37, 21]
  ];

  const out = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const bias = (bayer8[y % 8][x % 8] / 64 - 0.5) * 0.18;
      out[i] = map[i] > threshold + bias ? 1 : 0;
    }
  }

  return out;
}

function floydDither(map: Float32Array, width: number, height: number, threshold: number) {
  const work = new Float32Array(map);
  const out = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const old = work[i];
      const nw = old >= threshold ? 1 : 0;
      out[i] = nw;

      const err = old - nw;

      if (x + 1 < width) work[i + 1] += err * (7 / 16);
      if (y + 1 < height && x > 0) work[i + width - 1] += err * (3 / 16);
      if (y + 1 < height) work[i + width] += err * (5 / 16);
      if (y + 1 < height && x + 1 < width) work[i + width + 1] += err * (1 / 16);
    }
  }

  return out;
}

function dilate(src: Uint8Array, width: number, height: number, radius: number) {
  if (radius <= 0) return new Uint8Array(src);
  const dst = new Uint8Array(src.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;
      for (let ky = -radius; ky <= radius && !on; ky += 1) {
        for (let kx = -radius; kx <= radius; kx += 1) {
          const nx = x + kx;
          const ny = y + ky;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (src[ny * width + nx]) {
            on = 1;
            break;
          }
        }
      }
      dst[y * width + x] = on;
    }
  }

  return dst;
}

function erode(src: Uint8Array, width: number, height: number, radius: number) {
  if (radius <= 0) return new Uint8Array(src);
  const dst = new Uint8Array(src.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 1;
      for (let ky = -radius; ky <= radius && on; ky += 1) {
        for (let kx = -radius; kx <= radius; kx += 1) {
          const nx = x + kx;
          const ny = y + ky;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height || !src[ny * width + nx]) {
            on = 0;
            break;
          }
        }
      }
      dst[y * width + x] = on;
    }
  }

  return dst;
}

function pruneComponents(
  data: Uint8Array,
  width: number,
  height: number,
  minArea: number,
  maxCount: number
) {
  const visited = new Uint8Array(data.length);
  const components: { pixels: number[]; area: number }[] = [];

  const neighbors = [-1, 1, -width, width];

  for (let i = 0; i < data.length; i += 1) {
    if (!data[i] || visited[i]) continue;

    const pixels: number[] = [];
    const stack = [i];
    visited[i] = 1;

    while (stack.length) {
      const cur = stack.pop() as number;
      pixels.push(cur);
      const x = cur % width;
      const y = Math.floor(cur / width);

      for (const off of neighbors) {
        const next = cur + off;
        if (next < 0 || next >= data.length || visited[next] || !data[next]) continue;
        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    components.push({ pixels, area: pixels.length });
  }

  components.sort((a, b) => b.area - a.area);
  const kept = components.filter((c, idx) => c.area >= minArea && idx < maxCount);

  const out = new Uint8Array(data.length);
  for (const c of kept) {
    for (const px of c.pixels) {
      out[px] = 1;
    }
  }

  return out;
}

function applyPostProcessing(
  binary: Uint8Array,
  width: number,
  height: number,
  preset: PipelinePreset
) {
  let out = new Uint8Array(binary);

  if (preset.strokeThickness > 1) {
    out = dilate(out, width, height, preset.strokeThickness - 1);
    out = erode(out, width, height, 1);
  } else {
    out = erode(out, width, height, 1);
    out = dilate(out, width, height, 1);
  }

  out = pruneComponents(out, width, height, preset.componentMinArea, preset.componentMaxCount);
  return out;
}

function makeBinary(map: Float32Array, width: number, height: number, preset: PipelinePreset, threshold: number) {
  if (preset.dither === 'floyd') {
    return floydDither(map, width, height, threshold);
  }
  return bayerDither(map, width, height, threshold);
}

function autoTune(
  inkMap: Float32Array,
  edgeMap: Float32Array,
  width: number,
  height: number,
  preset: PipelinePreset,
  fallbackSegmentation: boolean
): { binary: BinaryImage; metrics: TransformMetrics } {
  let threshold = 0.5;
  let step = 0.18;
  let bestData = new Uint8Array(width * height);
  let bestCost = Number.POSITIVE_INFINITY;
  let bestMetrics: TransformMetrics = {
    whiteRatio: 0,
    componentCount: 0,
    meanComponentArea: 0,
    maxComponentArea: 0,
    edgeAlignmentScore: 0,
    fallbackSegmentation,
    tunedIterations: 0
  };

  let iter = 0;
  for (iter = 1; iter <= 8; iter += 1) {
    const raw = makeBinary(inkMap, width, height, preset, threshold);
    const post = applyPostProcessing(raw, width, height, preset);
    const img: BinaryImage = { width, height, data: post };

    const coverage = computeBinaryStats(img).whiteRatio;
    const cc = connectedComponents(img);
    const align = edgeAlignment(img, edgeMap);

    const coverageLoss = Math.abs(coverage - preset.whiteCoverageTarget) / Math.max(preset.coverageTolerance, 0.01);
    const componentPenalty = Math.max(0, cc.count - preset.componentMaxCount) / Math.max(1, preset.componentMaxCount);
    const sparsePenalty = cc.count === 0 ? 2 : 0;
    const edgePenalty = Math.max(0, 0.36 - align) * 2;

    const cost = coverageLoss + componentPenalty + sparsePenalty + edgePenalty;

    if (cost < bestCost) {
      bestCost = cost;
      bestData = post;
      bestMetrics = {
        whiteRatio: coverage,
        componentCount: cc.count,
        meanComponentArea: cc.meanArea,
        maxComponentArea: cc.maxArea,
        edgeAlignmentScore: align,
        fallbackSegmentation,
        tunedIterations: iter
      };
    }

    if (coverage > preset.whiteCoverageTarget) {
      threshold += step;
    } else {
      threshold -= step;
    }

    threshold = clamp01(threshold);
    step *= 0.62;
  }

  return {
    binary: { width, height, data: bestData },
    metrics: { ...bestMetrics, tunedIterations: iter - 1 }
  };
}

function toGray(rgb: Buffer, width: number, height: number) {
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const r = rgb[i * 3] / 255;
    const g = rgb[i * 3 + 1] / 255;
    const b = rgb[i * 3 + 2] / 255;
    out[i] = clamp01(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return out;
}

export async function transformImage(input: Buffer, options: TransformOptions): Promise<TransformResult> {
  const preset = PRESETS[options.presetId] ?? PRESETS['neon-contour'];

  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const gray = toGray(data, width, height);

  const norm = illuminationNormalize(gray, width, height);
  const sobelRes = sobel(norm, width, height);
  const { mask, fallbackSegmentation } = estimateForegroundMask(
    norm,
    sobelRes.mag,
    width,
    height,
    preset.centerBias
  );

  const inkMap = buildInkMap(norm, sobelRes, mask, preset, width, height);
  const tuned = autoTune(inkMap, sobelRes.mag, width, height, preset, fallbackSegmentation);

  const raw = Buffer.alloc(width * height);
  for (let i = 0; i < raw.length; i += 1) {
    raw[i] = tuned.binary.data[i] ? 255 : 0;
  }

  const png = await sharp(raw, {
    raw: {
      width,
      height,
      channels: 1
    }
  })
    .png({ compressionLevel: 9, adaptiveFiltering: false, force: true })
    .toBuffer();

  return {
    png,
    width,
    height,
    metrics: tuned.metrics,
    preset
  };
}
