import { NextResponse } from 'next/server';
import { getDitherAlgorithmSummary } from '@/lib/dithering';
import { transformImage } from '@/lib/pipeline';
import { type PresetId } from '@/lib/presets';
import { createSettingsFromPreset, sanitizeTransformSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('image');
    const presetId = (form.get('presetId') as PresetId) || 'neon-contour';
    const rawSettings = form.get('settings');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    let settings = createSettingsFromPreset(presetId);
    if (typeof rawSettings === 'string' && rawSettings.trim()) {
      try {
        settings = sanitizeTransformSettings(JSON.parse(rawSettings));
      } catch {
        return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await transformImage(bytes, { settings });
    const dither = getDitherAlgorithmSummary(result.preset.ditherAlgorithm);

    return NextResponse.json({
      imageBase64: result.png.toString('base64'),
      mimeType: 'image/png',
      width: result.width,
      height: result.height,
      metrics: result.metrics,
      preset: {
        id: result.preset.id,
        name: result.preset.name,
        description: result.preset.description
      },
      dither,
      settings
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transform failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
