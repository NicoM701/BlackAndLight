'use client';

import { useMemo, useState } from 'react';

type PresetId =
  | 'neon-contour'
  | 'silhouette-etch'
  | 'industrial-noise'
  | 'crowd-ghost'
  | 'topo-stroke';

type Preset = {
  id: PresetId;
  name: string;
  description: string;
};

const PRESETS: Preset[] = [
  { id: 'neon-contour', name: 'Neon Contour', description: 'Sharp contour strokes with sparse highlights.' },
  { id: 'silhouette-etch', name: 'Silhouette Etch', description: 'Thicker lines and readable silhouette support.' },
  { id: 'industrial-noise', name: 'Industrial Noise', description: 'Dense gritty structure for busy scenes.' },
  { id: 'crowd-ghost', name: 'Crowd Ghost', description: 'Soft clustered micro-strokes for people.' },
  { id: 'topo-stroke', name: 'Topo Stroke', description: 'Contour-like flowing bands and medium density.' }
];

type TransformResponse = {
  imageBase64: string;
  mimeType: string;
  width: number;
  height: number;
  metrics: {
    whiteRatio: number;
    componentCount: number;
    meanComponentArea: number;
    maxComponentArea: number;
    edgeAlignmentScore: number;
    fallbackSegmentation: boolean;
    tunedIterations: number;
  };
  preset: {
    id: PresetId;
    name: string;
    description: string;
  };
  error?: string;
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [presetId, setPresetId] = useState<PresetId>('neon-contour');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransformResponse | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  async function handleTransform() {
    if (!file) {
      setError('Select an image first.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('presetId', presetId);

      const res = await fetch('/api/transform', {
        method: 'POST',
        body: formData
      });

      const json = (await res.json()) as TransformResponse;
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Transform failed');
      }

      setResult(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Transform failed';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const link = document.createElement('a');
    link.href = `data:${result.mimeType};base64,${result.imageBase64}`;
    link.download = `black-and-light-${result.preset.id}.png`;
    link.click();
  }

  return (
    <main className="shell">
      <section className="panel">
        <h1>Black & Light</h1>
        <p className="lead">Upload a JPG/PNG and translate it into a strict black-and-white pixel-stroke render.</p>

        <div className="controls">
          <label className="field">
            <span>Image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label className="field">
            <span>Preset</span>
            <select value={presetId} onChange={(e) => setPresetId(e.target.value as PresetId)}>
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <button className="run" type="button" onClick={handleTransform} disabled={busy}>
            {busy ? 'Processing...' : 'Transform'}
          </button>
        </div>

        <p className="preset-note">{PRESETS.find((p) => p.id === presetId)?.description}</p>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="grid">
        <article className="card">
          <h2>Input</h2>
          {previewUrl ? <img src={previewUrl} alt="Input preview" /> : <div className="empty">No image selected.</div>}
        </article>

        <article className="card">
          <h2>Output</h2>
          {result ? (
            <>
              <img src={`data:${result.mimeType};base64,${result.imageBase64}`} alt="Output preview" />
              <button className="download" type="button" onClick={handleDownload}>
                Download PNG
              </button>
            </>
          ) : (
            <div className="empty">No output yet.</div>
          )}
        </article>
      </section>

      <section className="panel metrics">
        <h2>Metrics</h2>
        {result ? (
          <ul>
            <li>White coverage: {(result.metrics.whiteRatio * 100).toFixed(2)}%</li>
            <li>Connected components: {result.metrics.componentCount}</li>
            <li>Mean component area: {result.metrics.meanComponentArea.toFixed(2)}</li>
            <li>Max component area: {result.metrics.maxComponentArea}</li>
            <li>Edge alignment score: {result.metrics.edgeAlignmentScore.toFixed(3)}</li>
            <li>Segmentation fallback: {result.metrics.fallbackSegmentation ? 'yes' : 'no'}</li>
            <li>Auto-tune iterations: {result.metrics.tunedIterations}</li>
            <li>Resolution: {result.width} x {result.height}</li>
          </ul>
        ) : (
          <p className="empty">Run a transform to inspect output quality checks.</p>
        )}
      </section>
    </main>
  );
}
