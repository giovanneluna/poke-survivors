/**
 * Download and assemble Squirtle-line attack spritesheets
 * from pokemonAutoChess GitHub repo.
 */
import sharp from 'sharp';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_ABILITIES = 'https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/abilities%7Btps%7D';
const BASE_ATTACKS = 'https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/attacks%7Btps%7D';
const OUT_DIR = join(process.cwd(), 'public', 'assets', 'attacks');
const TMP_DIR = join(process.cwd(), '.tmp-sprites');

/** @type {Array<{name: string, url: string, frames: number}>} */
const SPRITES = [
  { name: 'water-pulse-sheet',  url: `${BASE_ABILITIES}/WATER_PULSE`, frames: 22 },
  { name: 'aqua-jet-sheet',     url: `${BASE_ABILITIES}/AQUA_JET`,    frames: 20 },
  { name: 'hydro-pump-sheet',   url: `${BASE_ABILITIES}/HYDRO_PUMP`,  frames: 20 },
  { name: 'surf-sheet',         url: `${BASE_ABILITIES}/SURF`,        frames: 4  },
  { name: 'liquidation-sheet',  url: `${BASE_ABILITIES}/LIQUIDATION`, frames: 18 },
  { name: 'rapid-spin-sheet',   url: `${BASE_ABILITIES}/RAPID_SPIN`,  frames: 11 },
  { name: 'water-range-sheet',  url: `${BASE_ATTACKS}/WATER/range`,   frames: 19 },
  { name: 'water-hit-sheet',    url: `${BASE_ATTACKS}/WATER/hit`,     frames: 4  },
  { name: 'ice-range-sheet',    url: `${BASE_ATTACKS}/ICE/range`,     frames: 19 },
];

async function downloadFrame(url, dest) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return dest;
}

async function downloadSprite(sprite) {
  const dir = join(TMP_DIR, sprite.name);
  mkdirSync(dir, { recursive: true });

  console.log(`  Downloading ${sprite.frames} frames for ${sprite.name}...`);

  const framePaths = [];
  let actualFrames = 0;

  for (let i = 0; i < sprite.frames; i++) {
    const fname = String(i).padStart(3, '0') + '.png';
    const dest = join(dir, fname);
    const url = `${sprite.url}/${fname}`;
    const result = await downloadFrame(url, dest);
    if (result) {
      framePaths.push(result);
      actualFrames++;
    } else {
      console.log(`    Frame ${fname} not found, stopping at ${actualFrames} frames`);
      break;
    }
  }

  if (actualFrames === 0) {
    console.log(`  SKIP ${sprite.name}: no frames found`);
    return null;
  }

  // Get frame dimensions from the first frame
  const meta = await sharp(framePaths[0]).metadata();
  const fw = meta.width;
  const fh = meta.height;

  console.log(`  Assembling ${actualFrames} frames (${fw}x${fh}) -> ${sprite.name}.png`);

  // Compose horizontal spritesheet
  const totalWidth = fw * actualFrames;
  const composites = framePaths.map((p, i) => ({
    input: p,
    left: i * fw,
    top: 0,
  }));

  const outPath = join(OUT_DIR, `${sprite.name}.png`);
  await sharp({
    create: {
      width: totalWidth,
      height: fh,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  console.log(`  OK: ${outPath} (${actualFrames}f, ${fw}x${fh})`);
  return { name: sprite.name, frames: actualFrames, fw, fh };
}

async function main() {
  console.log('=== Squirtle Attack Spritesheet Builder ===\n');

  mkdirSync(TMP_DIR, { recursive: true });

  const results = [];
  for (const sprite of SPRITES) {
    const outPath = join(OUT_DIR, `${sprite.name}.png`);
    if (existsSync(outPath)) {
      console.log(`  SKIP ${sprite.name}: already exists`);
      continue;
    }
    try {
      const r = await downloadSprite(sprite);
      if (r) results.push(r);
    } catch (err) {
      console.error(`  ERROR ${sprite.name}:`, err.message);
    }
  }

  // Cleanup
  rmSync(TMP_DIR, { recursive: true, force: true });

  console.log('\n=== Summary ===');
  for (const r of results) {
    console.log(`  ${r.name}: ${r.frames} frames, ${r.fw}x${r.fh}`);
  }
  console.log(`\nDone! ${results.length} spritesheets created.`);
}

main().catch(console.error);
