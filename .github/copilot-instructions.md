<!-- Copilot instructions for AI coding agents working on Black & Light -->
# Black & Light — AI coding agent guide

This file contains concise, actionable guidance for AI coding agents to be productive in this repository.

- **Big picture:** This is a Next.js (App Router) TypeScript web app that performs structure-preserving, local classical CV image translation (black/white binarization). The core image pipeline lives in `lib/` and is exposed via a serverless API route at `app/api/transform/route.ts`.

- **Key files & responsibilities:**
  - `app/api/transform/route.ts`: HTTP POST entrypoint for image transforms. Multipart form input; returns base64 PNG + metrics.
  - `lib/pipeline.ts`: Core image-analysis and transform functions (analysis → render → binarize).
  - `lib/presets.ts`: Preset definitions and targets (white coverage, edge/fill/texture weights, dithering).
  - `lib/metrics.ts`: Metric calculations (coverage, component stats, edge alignment).
  - `app/` frontend: Next.js App Router UI, not required for backend changes but useful for manual testing.

- **Architecture notes agents must respect:**
  - The implementation is intentionally local/classical: no external model calls; do not introduce token-based APIs without explicit owner approval.
  - The pipeline separates `analyzeImage(...)` (reusable maps) and `renderFrameFromAnalysis(...)` (frame rendering). Prefer reusing analysis when adding batch or motion features.
  - Auto-tuning loop is deterministic: up to 8 iterations, selects best binary by minimizing a composite cost. Preserve or clearly document changes to this loop.

- **Common tasks & examples:**
  - To add a new preset: update `lib/presets.ts` with a new preset id and defaults (white target, weights, dither). Ensure tests or manual run use that `presetId` in `app/api/transform`.
  - To add a new metric: add computation in `lib/metrics.ts` and include it in the API JSON response.
  - To optimize runtime: prefer reusing `analyzeImage` outputs; changes that add heavy per-frame work should be gated behind config flags.

- **Developer workflows / commands:**
  - Install and run locally:

    npm install
    npm run dev

  - Build/typecheck:

    npm run build
    npm run typecheck

  - The project targets Node + Vercel serverless runtime; check `vercel.json` for deployment-specific behavior.

- **Patterns & conventions (project-specific):**
  - Preset-driven behavior: visual style and tuning goals come from `lib/presets.ts`. Code should accept `presetId` and respect the preset contract (weights, white target, dither mode).
  - Deterministic processing: randomness is limited (grain/texture must be deterministic unless opt-in); avoid adding uncontrolled randomness to the pipeline.
  - Outputs are strict binary PNGs: ensure new code preserves single-channel 0/255 constraint and strips alpha unless intentionally changing format.

- **Integration & external dependencies:**
  - Image processing uses `sharp` (see `package.json`). Changes requiring native binaries must be tested locally on Windows and in CI/build environment.
  - No external ML or paid APIs are used by default. If you add optional ONNX or external segmentation, make it gated and documented in `Architecture Notes`.

- **Testing and verification guidance:**
  - Use the API endpoint with representative images and verify metrics in the JSON response (coverage, component count, edge alignment).
  - For changes affecting binarization, add a small sample image test (can be manual) that checks output pixel values are only 0 or 255.

- **What to avoid / common pitfalls:**
  - Do not change the preset semantics silently — updating presets must include an explanation and representative before/after metrics.
  - Don't introduce external network calls in the transform path without feature flags and owner approval.
  - When modifying morphological or component filters, ensure component-count caps and coverage targets are preserved or explicitly adjusted.

If anything here is unclear or you'd like more examples (unit-test snippets, request/response examples, or links to specific functions), tell me which area to expand.
