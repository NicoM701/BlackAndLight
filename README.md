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
| Neon Contour | Sharp contour strokes with sparse highlights | 0.82 | 0.22 | 0.25 | 1 | 5 | 12% | Floyd |
| Silhouette Etch | Thicker lines with silhouette readability | 0.56 | 0.45 | 0.18 | 2 | 8 | 19% | Bayer |
| Industrial Noise | Dense grit and wireframe texture for busy scenes | 0.66 | 0.40 | 0.44 | 1 | 4 | 26% | Floyd |
| Crowd Ghost | Soft clustered micro-strokes for people/groups | 0.60 | 0.34 | 0.30 | 1 | 6 | 16% | Bayer |
| Topo Stroke | Contour-band look with flowing motion | 0.70 | 0.30 | 0.35 | 1 | 3 | 21% | Floyd |

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
