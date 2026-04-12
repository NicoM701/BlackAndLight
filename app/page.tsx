'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PRESET_LIST, type PresetId } from '@/lib/presets';
import {
  ADVANCED_CONTROLS,
  createSettingsFromPreset,
  getPresetSummary,
  makeCustomSettings,
  randomizeSettings,
  serializeTransformSettings,
  type ControlKey,
  type TransformSettings
} from '@/lib/settings';

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
  settings: TransformSettings;
  error?: string;
};

type HistoryState = {
  entries: TransformSettings[];
  index: number;
};

type ApplySettingsOptions = {
  commit?: 'immediate' | 'debounced' | 'none';
  autoRender?: boolean;
};

const HISTORY_LIMIT = 60;
const initialSettings = createSettingsFromPreset('neon-contour');

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [settings, setSettings] = useState<TransformSettings>(initialSettings);
  const [history, setHistory] = useState<HistoryState>({ entries: [initialSettings], index: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransformResponse | null>(null);

  const settingsRef = useRef(settings);
  const historyRef = useRef(history);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCommitRef = useRef<TransformSettings | null>(null);
  const requestIdRef = useRef(0);
  const resultCacheRef = useRef(new Map<string, TransformResponse>());

  const fileKey = useMemo(
    () => (file ? `${file.name}:${file.size}:${file.lastModified}` : null),
    [file]
  );

  const currentBasePreset = getPresetSummary(settings.presetId);
  const currentHistorySnapshot = history.entries[history.index];
  const hasPendingChanges =
    pendingCommitRef.current !== null &&
    serializeTransformSettings(pendingCommitRef.current) !== serializeTransformSettings(currentHistorySnapshot);
  const canUndo = history.index > 0 || hasPendingChanges;
  const canRedo = history.index < history.entries.length - 1;

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    requestIdRef.current += 1;
    resultCacheRef.current.clear();
    setResult(null);
    setError(null);
    setBusy(false);
  }, [fileKey]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
      const isRedoPrimary = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && event.shiftKey;
      const isRedoSecondary = event.ctrlKey && event.key.toLowerCase() === 'y';

      if (isUndo) {
        event.preventDefault();
        handleUndo();
      } else if (isRedoPrimary || isRedoSecondary) {
        event.preventDefault();
        handleRedo();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [fileKey]);

  function clearPendingCommit() {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    pendingCommitRef.current = null;
  }

  function commitSnapshot(snapshot: TransformSettings) {
    clearPendingCommit();

    const current = historyRef.current;
    const currentSnapshot = current.entries[current.index];
    if (serializeTransformSettings(currentSnapshot) === serializeTransformSettings(snapshot)) {
      return;
    }

    let nextEntries = [...current.entries.slice(0, current.index + 1), snapshot];
    if (nextEntries.length > HISTORY_LIMIT) {
      nextEntries = nextEntries.slice(nextEntries.length - HISTORY_LIMIT);
    }

    const nextState = {
      entries: nextEntries,
      index: nextEntries.length - 1
    };

    historyRef.current = nextState;
    setHistory(nextState);
  }

  function scheduleCommit(snapshot: TransformSettings) {
    pendingCommitRef.current = snapshot;
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }

    commitTimerRef.current = setTimeout(() => {
      if (pendingCommitRef.current) {
        commitSnapshot(pendingCommitRef.current);
      }
    }, 420);
  }

  function flushPendingCommit() {
    if (!pendingCommitRef.current) return;
    commitSnapshot(pendingCommitRef.current);
  }

  function applySettings(nextSettings: TransformSettings, options: ApplySettingsOptions = {}) {
    const commitMode = options.commit ?? 'debounced';
    setSettings(nextSettings);

    if (commitMode === 'immediate') {
      commitSnapshot(nextSettings);
    } else if (commitMode === 'debounced') {
      scheduleCommit(nextSettings);
    } else {
      clearPendingCommit();
    }

    if (options.autoRender && file) {
      void runTransform(nextSettings);
    }
  }

  async function runTransform(targetSettings: TransformSettings = settingsRef.current) {
    if (!file || !fileKey) {
      setError('Select an image first.');
      return;
    }

    const cacheKey = `${fileKey}:${serializeTransformSettings(targetSettings)}`;
    const cached = resultCacheRef.current.get(cacheKey);
    if (cached) {
      setResult(cached);
      setError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('presetId', targetSettings.presetId);
      formData.append('settings', serializeTransformSettings(targetSettings));

      const res = await fetch('/api/transform', {
        method: 'POST',
        body: formData
      });

      const json = (await res.json()) as TransformResponse;
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Transform failed');
      }

      if (requestIdRef.current !== requestId) return;
      resultCacheRef.current.set(cacheKey, json);
      setResult(json);
    } catch (cause) {
      if (requestIdRef.current !== requestId) return;
      const message = cause instanceof Error ? cause.message : 'Transform failed';
      setError(message);
    } finally {
      if (requestIdRef.current === requestId) {
        setBusy(false);
      }
    }
  }

  function handlePresetChange(presetId: PresetId) {
    const nextSettings = createSettingsFromPreset(presetId);
    applySettings(nextSettings, { commit: 'immediate' });
  }

  function handleRandomize() {
    const nextSettings = randomizeSettings(settingsRef.current);
    applySettings(nextSettings, { commit: 'immediate', autoRender: true });
  }

  function handleResetAdvanced() {
    const nextSettings = createSettingsFromPreset(settingsRef.current.presetId);
    applySettings(nextSettings, { commit: 'immediate' });
  }

  function handleControlChange(key: ControlKey, value: number) {
    const nextSettings = makeCustomSettings(
      {
        ...settingsRef.current,
        [key]: value
      },
      `Manual tune built on ${getPresetSummary(settingsRef.current.presetId).name}.`
    );

    applySettings(nextSettings, { commit: 'debounced' });
  }

  function handleUndo() {
    flushPendingCommit();

    const current = historyRef.current;
    if (current.index === 0) return;

    const snapshot = current.entries[current.index - 1];
    const nextState = {
      entries: current.entries,
      index: current.index - 1
    };

    historyRef.current = nextState;
    setHistory(nextState);
    setSettings(snapshot);

    if (file) {
      void runTransform(snapshot);
    }
  }

  function handleRedo() {
    clearPendingCommit();

    const current = historyRef.current;
    if (current.index >= current.entries.length - 1) return;

    const snapshot = current.entries[current.index + 1];
    const nextState = {
      entries: current.entries,
      index: current.index + 1
    };

    historyRef.current = nextState;
    setHistory(nextState);
    setSettings(snapshot);

    if (file) {
      void runTransform(snapshot);
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
      <section className="panel hero-panel">
        <div className="hero-top">
          <div>
            <h1>Black &amp; Light</h1>
            <p className="lead">Upload, hit Randomize, keep the happy accidents. Advanced sliders are there when you want to get fussy.</p>
          </div>

          <div className="history-actions">
            <button type="button" className="ghost-button" onClick={handleUndo} disabled={!canUndo}>
              Undo <span>⌘/Ctrl+Z</span>
            </button>
            <button type="button" className="ghost-button" onClick={handleRedo} disabled={!canRedo}>
              Redo <span>⇧⌘/Ctrl+Z</span>
            </button>
          </div>
        </div>

        <div className="chip-row">
          <span className="chip chip-strong">Base style: {currentBasePreset.name}</span>
          <span className="chip">Current look: {settings.lookLabel}</span>
          <span className="chip">History: {history.index + 1}/{history.entries.length}</span>
        </div>

        <p className="preset-note">{settings.lookDescription}</p>

        <div className="mode-switch" role="tablist" aria-label="Control mode">
          <button
            type="button"
            className={mode === 'simple' ? 'mode-button active' : 'mode-button'}
            onClick={() => setMode('simple')}
          >
            Simple
          </button>
          <button
            type="button"
            className={mode === 'advanced' ? 'mode-button active' : 'mode-button'}
            onClick={() => setMode('advanced')}
          >
            Advanced
          </button>
        </div>

        <div className="controls">
          <label className="field field-wide">
            <span>Image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <label className="field">
            <span>Base style</span>
            <select value={settings.presetId} onChange={(event) => handlePresetChange(event.target.value as PresetId)}>
              {PRESET_LIST.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <button className="run accent-button" type="button" onClick={handleRandomize} disabled={busy}>
            {busy ? 'Cooking...' : 'Randomize look'}
          </button>

          <button className="run" type="button" onClick={() => void runTransform()} disabled={busy || !file}>
            {busy ? 'Processing...' : result ? 'Render again' : 'Render'}
          </button>
        </div>

        <div className="simple-explainer">
          <div>
            <strong>{currentBasePreset.name}</strong>
            <p>{currentBasePreset.description}</p>
          </div>
          <div>
            <strong>Fast lane</strong>
            <p>Randomize auto-renders and drops each good/bad decision into history so you can walk back instantly.</p>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
      </section>

      {mode === 'advanced' ? (
        <section className="panel advanced-panel">
          <div className="panel-header">
            <div>
              <h2>Advanced controls</h2>
              <p className="panel-copy">Curated sliders, same binary identity. Changes are coalesced into history after a short pause.</p>
            </div>
            <button type="button" className="ghost-button" onClick={handleResetAdvanced}>
              Reset to base style
            </button>
          </div>

          <div className="slider-grid">
            {ADVANCED_CONTROLS.map((control) => (
              <label key={control.key} className="slider-card">
                <div className="slider-head">
                  <span>{control.label}</span>
                  <strong>{settings[control.key]}</strong>
                </div>
                <p>{control.description}</p>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={settings[control.key]}
                  onChange={(event) => handleControlChange(control.key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid">
        <article className="card">
          <div className="card-head">
            <h2>Input</h2>
            <span className="card-meta">{file ? file.name : 'No file selected'}</span>
          </div>
          {previewUrl ? <img src={previewUrl} alt="Input preview" /> : <div className="empty">Drop in a JPG/PNG/WebP to get started.</div>}
        </article>

        <article className="card">
          <div className="card-head">
            <div>
              <h2>Output</h2>
              <span className="card-meta">{result ? result.preset.name : 'Nothing rendered yet'}</span>
            </div>
            {result ? (
              <button className="download ghost-button" type="button" onClick={handleDownload}>
                Download PNG
              </button>
            ) : null}
          </div>

          {result ? (
            <>
              <img src={`data:${result.mimeType};base64,${result.imageBase64}`} alt="Output preview" />
              <p className="render-note">{result.preset.description}</p>
            </>
          ) : (
            <div className="empty">Render a look to inspect the result.</div>
          )}
        </article>
      </section>

      <section className="panel metrics">
        <div className="panel-header">
          <div>
            <h2>Metrics</h2>
            <p className="panel-copy">Still brutally binary under the hood. These numbers help keep it honest.</p>
          </div>
        </div>

        {result ? (
          <ul>
            <li>White coverage: {(result.metrics.whiteRatio * 100).toFixed(2)}%</li>
            <li>Connected components: {result.metrics.componentCount}</li>
            <li>Mean component area: {result.metrics.meanComponentArea.toFixed(2)}</li>
            <li>Max component area: {result.metrics.maxComponentArea}</li>
            <li>Edge alignment score: {result.metrics.edgeAlignmentScore.toFixed(3)}</li>
            <li>Segmentation fallback: {result.metrics.fallbackSegmentation ? 'yes' : 'no'}</li>
            <li>Auto-tune iterations: {result.metrics.tunedIterations}</li>
            <li>Resolution: {result.width} × {result.height}</li>
          </ul>
        ) : (
          <p className="empty">Run a transform to inspect output quality checks.</p>
        )}
      </section>
    </main>
  );
}
