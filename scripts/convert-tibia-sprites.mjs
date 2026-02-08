/**
 * Converte sprites Tibia (strips verticais) em spritesheets horizontais.
 * Cada sprite tem frames empilhados verticalmente; este script os rearranja horizontalmente.
 *
 * Uso: node scripts/convert-tibia-sprites.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE_V1 = 'public/assets/attacks/new-sprite/tibia-sprites-attacks';
const BASE_V2 = 'public/assets/attacks/new-sprite/tibia-sprites-attack-v2';
const OUT = 'public/assets/attacks';

/**
 * Mapeamento: source → { output, folder, frameW, frameH }
 * frameH default = frameW (quadrado). Se diferente, especificar.
 */
const SPRITES = [
  // ── Fire ──
  { src: `${BASE_V1}/fire_eruption_242_.png`, out: 'fire/eruption-sheet.png', fw: 96, fh: 96 },

  // ── Water ──
  { src: `${BASE_V1}/surf_247_.png`, out: 'water/surf-tibia-sheet.png', fw: 96, fh: 96 },  // 96x512 → ~5 frames (last partial ignored if needed)
  { src: `${BASE_V1}/water-wave_65_.png`, out: 'water/surf-wave-up-sheet.png', fw: 96, fh: 96 },  // 96x256 → not square, 64h per frame
  { src: `${BASE_V1}/water-wave_66_.png`, out: 'water/surf-wave-down-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V1}/water-wave_67_.png`, out: 'water/surf-wave-left-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/water-wave_68_.png`, out: 'water/surf-wave-right-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V1}/water-tornado_291_.png`, out: 'water/whirlpool-tibia-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V2}/wirpull_2_.png`, out: 'water/whirlpool-rings-sheet.png', fw: 32, fh: 32 },
  { src: `${BASE_V1}/water-buble.png`, out: 'water/bubble-shot-sheet.png', fw: 32, fh: 32 },

  // ── Flying ──
  { src: `${BASE_V1}/air_79_.png`, out: 'flying/twister-sheet.png', fw: 32, fh: 32 },
  { src: `${BASE_V1}/gust_43_.png`, out: 'flying/gust-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V2}/air-cut_129_.png`, out: 'flying/air-cutter-up-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V2}/air-cut_130_.png`, out: 'flying/air-cutter-down-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V2}/air-cut_131_.png`, out: 'flying/air-cutter-left-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V2}/air-cut_132_.png`, out: 'flying/air-cutter-right-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V2}/x-aircut_224_.png`, out: 'flying/brave-bird-tibia-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V2}/x-aircut_17_.png`, out: 'flying/air-slash-x-sheet.png', fw: 96, fh: 96 },

  // ── Ghost ──
  { src: `${BASE_V1}/gengar_speel_139_.png`, out: 'ghost/shadow-ball-up-sheet.png', fw: 32, fh: 32 },
  { src: `${BASE_V1}/gengar_speel_140_.png`, out: 'ghost/shadow-ball-down-sheet.png', fw: 32, fh: 32 },
  { src: `${BASE_V1}/gengar_speel_141_.png`, out: 'ghost/shadow-ball-left-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/gengar_speel_146_.png`, out: 'ghost/shadow-ball-right-sheet.png', fw: 32, fh: 32 },

  // ── Psychic ──
  { src: `${BASE_V1}/alakazam-wave_134_.png`, out: 'psychic/psywave-a-sheet.png', fw: 32, fh: 32 },
  { src: `${BASE_V1}/alakazam-wave_137_.png`, out: 'psychic/psywave-b-sheet.png', fw: 32, fh: 32 },

  // ── Rock ──
  { src: `${BASE_V1}/Golem_atack_158_.png`, out: 'rock/stone-edge-tibia-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V1}/queda-de-rochas_45_.png`, out: 'rock/rock-slide-tibia-sheet.png', fw: 32, fh: 32 },

  // ── Ground ──
  { src: `${BASE_V1}/marowak-bone_228_.png`, out: 'ground/bonemerang-tibia-sheet.png', fw: 32, fh: 32 },

  // ── Fighting ──
  { src: `${BASE_V1}/machamp-punch-sequence_216_.png`, out: 'fighting/dynamic-punch-up-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/machamp-punch-sequence_217_.png`, out: 'fighting/dynamic-punch-down-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/machamp-punch-sequence_218_.png`, out: 'fighting/dynamic-punch-left-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V1}/machamp-punch-sequence_219_.png`, out: 'fighting/dynamic-punch-right-sheet.png', fw: 64, fh: 64 },
  { src: `${BASE_V1}/punch-sequence_93_.png`, out: 'fighting/cross-chop-up-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/punch-sequence_94_.png`, out: 'fighting/cross-chop-down-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/punch-sequence_95_.png`, out: 'fighting/cross-chop-left-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V1}/punch-sequence_96_.png`, out: 'fighting/cross-chop-right-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V2}/punch-area_100_.png`, out: 'fighting/focus-blast-sheet.png', fw: 96, fh: 96 },

  // ── Bug ──
  { src: `${BASE_V2}/x-aircut_222_.png`, out: 'bug/x-scissor-a-sheet.png', fw: 96, fh: 96 },
  { src: `${BASE_V2}/x-aircut_244_.png`, out: 'bug/x-scissor-b-sheet.png', fw: 96, fh: 96 },
];

// Skip flamethrower (already converted previously)
// Skip twist_79_ (duplicate of air_79_)
// Skip v2 punch-sequence duplicates (same as v1)

async function convertVerticalToHorizontal(srcPath, outPath, frameW, frameH) {
  const fullOut = path.join(OUT, outPath);
  const meta = await sharp(srcPath).metadata();
  const { width, height } = meta;

  const numFrames = Math.floor(height / frameH);
  if (numFrames < 1) {
    console.warn(`  SKIP ${srcPath}: height ${height} < frameH ${frameH}`);
    return null;
  }

  // Extract each frame and composite horizontally
  const frames = [];
  for (let i = 0; i < numFrames; i++) {
    const frameBuffer = await sharp(srcPath)
      .extract({ left: 0, top: i * frameH, width: frameW, height: frameH })
      .toBuffer();
    frames.push({ input: frameBuffer, left: i * frameW, top: 0 });
  }

  const totalWidth = numFrames * frameW;
  await sharp({
    create: {
      width: totalWidth,
      height: frameH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(frames)
    .png()
    .toFile(fullOut);

  return { numFrames, totalWidth, frameW, frameH };
}

async function main() {
  let converted = 0;
  let skipped = 0;

  for (const sprite of SPRITES) {
    if (!fs.existsSync(sprite.src)) {
      console.warn(`  MISSING: ${sprite.src}`);
      skipped++;
      continue;
    }

    const result = await convertVerticalToHorizontal(sprite.src, sprite.out, sprite.fw, sprite.fh);
    if (result) {
      console.log(
        `  OK: ${sprite.out.padEnd(50)} ${result.numFrames}f ${result.frameW}x${result.frameH} → ${result.totalWidth}x${result.frameH}`
      );
      converted++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped`);
}

main().catch(console.error);
