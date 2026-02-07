import sharp from 'sharp';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const FRAMES_DIR = 'public/assets/attacks/frames';
const OUT_DIR = 'public/assets/attacks';
const MAX_FRAME_SIZE = 96; // Max dimension per frame for game performance

const attacks = readdirSync(FRAMES_DIR).filter(d => {
  const dir = join(FRAMES_DIR, d);
  return existsSync(dir) && readdirSync(dir).some(f => f.endsWith('.png'));
});

console.log(`Building spritesheets for ${attacks.length} attacks...\n`);

const results = [];

for (const attack of attacks) {
  const dir = join(FRAMES_DIR, attack);
  const frames = readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort();

  if (frames.length === 0) {
    console.log(`  SKIP ${attack}: no frames`);
    continue;
  }

  // Get max dimensions across all frames
  let maxW = 0, maxH = 0;
  for (const f of frames) {
    const meta = await sharp(join(dir, f)).metadata();
    maxW = Math.max(maxW, meta.width);
    maxH = Math.max(maxH, meta.height);
  }

  // For very large frame counts, sample to ~16 frames
  let selectedFrames = frames;
  if (frames.length > 20) {
    const step = Math.ceil(frames.length / 16);
    selectedFrames = frames.filter((_, i) => i % step === 0);
  }

  // Scale down if frames are too large
  let targetW = maxW, targetH = maxH;
  if (maxW > MAX_FRAME_SIZE || maxH > MAX_FRAME_SIZE) {
    const scale = MAX_FRAME_SIZE / Math.max(maxW, maxH);
    targetW = Math.round(maxW * scale);
    targetH = Math.round(maxH * scale);
  }

  const totalWidth = targetW * selectedFrames.length;

  try {
    // Process all frames: resize to uniform dimensions
    const composites = await Promise.all(
      selectedFrames.map(async (f, i) => {
        const buf = await sharp(join(dir, f))
          .resize(targetW, targetH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        return {
          input: buf,
          left: i * targetW,
          top: 0,
        };
      })
    );

    const outPath = join(OUT_DIR, `${attack}-sheet.png`);
    await sharp({
      create: {
        width: totalWidth,
        height: targetH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png()
      .toFile(outPath);

    const info = {
      name: attack,
      frames: selectedFrames.length,
      frameW: targetW,
      frameH: targetH,
      origW: maxW,
      origH: maxH,
      scaled: maxW > MAX_FRAME_SIZE || maxH > MAX_FRAME_SIZE,
    };
    results.push(info);
    console.log(`  ✓ ${attack}-sheet.png: ${info.frames}f, ${targetW}x${targetH}px${info.scaled ? ` (scaled from ${maxW}x${maxH})` : ''}`);
  } catch (err) {
    console.error(`  ✗ ${attack}: ${err.message}`);
  }
}

console.log(`\nDone! ${results.length} spritesheets built.\n`);

// Output summary for BootScene integration
console.log('=== BootScene Integration Data ===');
for (const r of results) {
  console.log(`{ key: 'atk-${r.name}', file: 'attacks/${r.name}-sheet.png', fw: ${r.frameW}, fh: ${r.frameH}, frames: ${r.frames} },`);
}
