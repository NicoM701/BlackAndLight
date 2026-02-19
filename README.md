# Black & Light

Structure-preserving artistic image translation into a strict binary look:

- Dominant black canvas
- White pixel clusters and strokes preserving composition
- Final output only contains `#000000` or `#FFFFFF`
- No paid APIs, no token-based external inference

## Stack

- Next.js (App Router) for UI + API
- Local Node runtime image processing with `sharp`
- Classical CV pipeline in TypeScript (`lib/pipeline.ts`)
- Vercel-ready structure (`app/api/transform/route.ts`, `vercel.json`)

## Success Criteria

1. Structure preservation
- Edge alignment score against source edges: target `>= 0.36`
- Subject/object silhouette remains recognizable

2. Strict binariness
- Output PNG contains only values 0 or 255 in a single channel
- No alpha and no grayscale values

3. Background dominance
- White pixel ratio stays near preset target (typically 12%-26%)
- Black background remains visually dominant

4. Controllable density
- Preset-specific white coverage target and tolerance
- Auto-threshold loop adapts per image

5. Consistent style
- Preset-controlled edge/fill/texture mix
- Stable dithering mode and morphological cleanup per preset

## Pipeline Stages

1. Illumination normalization
- Convert RGB to grayscale luminance
- Homomorphic-style normalization: divide by large-radius blur
- Log compression + percentile normalization
- Local contrast boost via high-pass blend

2. Structure extraction (edges/regions)
- Sobel gradient magnitude and direction
- Multi-scale saliency from small-vs-large blur differences
- Foreground mask from edge + saliency + optional center prior
- Fallback: if mask ratio invalid, use full-frame edge mode

3. Artistic grayscale ink probability map
- Weighted blend of:
  - edge response
  - tone/fill under foreground mask
  - local detail residual
  - orientation-driven stripe texture + deterministic grain
- Style-controlled smoothing and gamma shaping

4. Controlled binarization
- Preset-selectable dithering:
  - Floyd-Steinberg error diffusion
  - Ordered Bayer dithering
- Global threshold tuned per image in short loop

5. Post-processing
- Morphological open/close variants based on stroke thickness
- Remove tiny connected components
- Cap component count to avoid noisy clutter

## Auto-Tuning Loop (Per Image)

- Iterate up to 8 times
- Adjust threshold to approach preset white-coverage target
- Compute cost from:
  - coverage error
  - too-many-components penalty
  - edge-alignment penalty
- Keep best binary result + metrics

## Quantitative Debug Metrics

- White coverage ratio
- Connected component count
- Mean / max component area
- Edge alignment score
- Segmentation fallback flag
- Tuning iteration count

## Presets

| Preset | Artistic Description | Edge Weight | Fill Weight | Texture Weight | Stroke Thickness | Grain Scale | White Target | Dither |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Neon Contour | Ghost contour bands with airy negative space | 0.82 | 0.20 | 0.20 | 1 | 7 | 13% | Floyd |
| Silhouette Etch | Readable subject shape with sparse etched ghost detail | 0.50 | 0.28 | 0.12 | 2 | 8 | 15% | Bayer |
| Industrial Noise | Busy scene abstraction with spaced glitch bands and grit | 0.62 | 0.30 | 0.50 | 1 | 5 | 16% | Floyd |
| Crowd Ghost | Airy clustered micro-strokes with ghostly subject persistence | 0.54 | 0.20 | 0.32 | 1 | 7 | 12% | Bayer |
| Topo Stroke | Flowing contour bands with drifting white islands | 0.66 | 0.24 | 0.28 | 1 | 4 | 15% | Floyd |

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API

`POST /api/transform` (multipart form)

- `image`: PNG/JPG/WebP
- `presetId`: one of
  - `neon-contour`
  - `silhouette-etch`
  - `industrial-noise`
  - `crowd-ghost`
  - `topo-stroke`

Response JSON includes base64 PNG and metrics.

## Architecture Notes

- Current implementation is local classical CV only.
- No external model hosting is required.
- If stronger background rejection is needed later, you can add optional offline segmentation (e.g., MODNet/U2Net ONNX) before the current fallback gate.
- Motion-ready pipeline split is available now:
  - `analyzeImage(...)`: compute reusable image analysis maps once
  - `renderFrameFromAnalysis(...)`: render a frame from cached analysis using optional `phase/flowStrength/jitter`
  - `transformImage(...)`: current single-image wrapper around the two steps
- Build outputs are split by mode to avoid dev/prod cache collisions:
  - development: `.next-dev`
  - production: `.next`
