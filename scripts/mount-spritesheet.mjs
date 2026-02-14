#!/usr/bin/env node
/**
 * mount-spritesheet.mjs
 *
 * Converte frames individuais PNG (000.png, 001.png...) em spritesheet horizontal.
 *
 * Uso individual:
 *   node scripts/mount-spritesheet.mjs \
 *     --input "public/assets/pokeautochess-content/abilities{tps}/PETAL_DANCE" \
 *     --output "public/assets/attacks/grass/petal-dance-pac-sheet.png"
 *
 * Uso batch:
 *   node scripts/mount-spritesheet.mjs --batch scripts/boss-sprites-batch.json
 *
 * Output: imprime JSON com { frames, frameWidth, frameHeight } por spritesheet.
 */
import sharp from 'sharp';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = resolve('public/assets/pokeautochess-content');

async function mountSpritesheet(inputDir, outputPath) {
  const absInput = inputDir.startsWith('public/') || inputDir.startsWith('C:')
    ? resolve(inputDir)
    : resolve(ROOT, inputDir);

  const absOutput = outputPath.startsWith('public/') || outputPath.startsWith('C:')
    ? resolve(outputPath)
    : resolve('public/assets', outputPath);

  if (!existsSync(absInput)) {
    console.error(`[SKIP] Input dir not found: ${absInput}`);
    return null;
  }

  const files = (await readdir(absInput))
    .filter(f => f.endsWith('.png'))
    .sort((a, b) => {
      const na = parseInt(a.replace('.png', ''), 10);
      const nb = parseInt(b.replace('.png', ''), 10);
      return na - nb;
    });

  if (files.length === 0) {
    console.error(`[SKIP] No PNG frames in: ${absInput}`);
    return null;
  }

  // Read first frame to get dimensions
  const firstFramePath = join(absInput, files[0]);
  const firstMeta = await sharp(firstFramePath).metadata();
  const frameWidth = firstMeta.width;
  const frameHeight = firstMeta.height;
  const frameCount = files.length;

  // Read all frame buffers
  const frameBuffers = await Promise.all(
    files.map(async (f) => {
      const buf = await readFile(join(absInput, f));
      // Ensure all frames match expected dimensions (resize if needed)
      return sharp(buf)
        .resize(frameWidth, frameHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .raw()
        .toBuffer();
    })
  );

  // Compose horizontal spritesheet
  const sheetWidth = frameWidth * frameCount;
  const sheetHeight = frameHeight;

  const composites = frameBuffers.map((buf, i) => ({
    input: buf,
    raw: { width: frameWidth, height: frameHeight, channels: 4 },
    left: i * frameWidth,
    top: 0,
  }));

  // Create transparent base image and composite all frames
  await mkdir(dirname(absOutput), { recursive: true });

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(absOutput);

  const result = { frames: frameCount, frameWidth, frameHeight, output: absOutput };
  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--batch')) {
    const batchIdx = args.indexOf('--batch');
    const batchPath = resolve(args[batchIdx + 1]);
    const batchData = JSON.parse(await readFile(batchPath, 'utf-8'));

    const results = [];
    for (const entry of batchData) {
      const result = await mountSpritesheet(entry.input, entry.output);
      if (result) {
        console.log(`[OK] ${entry.output} → ${result.frames}f @ ${result.frameWidth}×${result.frameHeight}`);
        results.push({ ...entry, ...result });
      }
    }
    console.log(`\nDone: ${results.length}/${batchData.length} spritesheets mounted.`);
    console.log(JSON.stringify(results, null, 2));
  } else {
    const inputIdx = args.indexOf('--input');
    const outputIdx = args.indexOf('--output');

    if (inputIdx === -1 || outputIdx === -1) {
      console.error('Usage: node mount-spritesheet.mjs --input <dir> --output <file>');
      console.error('       node mount-spritesheet.mjs --batch <json>');
      process.exit(1);
    }

    const result = await mountSpritesheet(args[inputIdx + 1], args[outputIdx + 1]);
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
