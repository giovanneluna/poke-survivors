/**
 * Build the 9 tiles for the "Kanto Route" theme from the large tileset.
 *
 * Tile selections:
 * - grassLight:  Row 68, Col 0 — plain light green grass
 * - grassDark:   Row 88, Col 0 — slightly darker green grass
 * - grassFlower: Row 71, Col 0 — green with decorative patches
 * - dirt:        Row 80, Col 1 — brown diagonal crosshatch
 * - path:        Row 93, Col 1 — gray stone checkered (city walkway!)
 * - water:       Row 115, Col 0 — blue water with wave pattern
 * - waterEdge:   Row 117, Col 0 — water→sand transition
 * - tree:        Row 1, Col 1 — full round tree crown (direct 32x32 tile)
 * - rock:        COMPOSITE: rock sprite (row 91, col 5) on grass bg
 *
 * Also generates a preview.png (3x3 grid of all tiles).
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILESET = path.join(__dirname, '..', 'public',
  'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT = path.join(__dirname, '..', 'public', 'assets', 'tiles', 'route');
const TILE = 32;

/** Extract a single 32x32 tile from the tileset */
async function extractTile(col, row) {
  return sharp(TILESET)
    .extract({ left: col * TILE, top: row * TILE, width: TILE, height: TILE })
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // ── Simple extractions (direct tiles) ──────────────────────────────
  // Tree uses row 1 (full round crown) directly — no need to squish 2 rows
  const simpleMap = [
    ['grass-light', 68, 0],
    ['grass-dark', 88, 0],
    ['grass-flower', 71, 0],
    ['dirt', 80, 1],
    ['path', 93, 1],
    ['water', 115, 0],
    ['water-edge', 117, 0],
    ['tree', 1, 1],
  ];

  for (const [name, row, col] of simpleMap) {
    const buf = await extractTile(col, row);
    // Resize to 24x24 for consistency with game grid (24px cells)
    await sharp(buf)
      .resize(24, 24, { kernel: 'nearest' })
      .toFile(path.join(OUT, `${name}.png`));
    console.log(`  ✓ ${name} (row ${row}, col ${col})`);
  }

  // grassBg24 still needed for rock composite
  const grassBg = await extractTile(0, 68);
  const grassBg24 = await sharp(grassBg)
    .resize(24, 24, { kernel: 'nearest' })
    .toBuffer();

  // ── Rock: composite rock sprite onto grass background ─────────────
  const rockSprite = await extractTile(5, 91);

  // Scale rock to 16x16 and center on grass
  const rockScaled = await sharp(rockSprite)
    .resize(16, 16, { fit: 'contain', background: '#00000000' })
    .toBuffer();

  await sharp(grassBg24)
    .composite([{ input: rockScaled, gravity: 'centre' }])
    .toFile(path.join(OUT, 'rock.png'));
  console.log('  ✓ rock (composite: row 91 col 5 on grass)');

  // ── Preview: 3x3 grid ─────────────────────────────────────────────
  const names = [
    'grass-light', 'grass-dark', 'grass-flower',
    'dirt', 'path', 'water',
    'water-edge', 'tree', 'rock',
  ];

  const tileBuffers = [];
  for (const name of names) {
    const filePath = path.join(OUT, `${name}.png`);
    tileBuffers.push(await sharp(filePath).resize(48, 48, { kernel: 'nearest' }).toBuffer());
  }

  // Create 3x3 grid (144x144)
  const composites = tileBuffers.map((buf, i) => ({
    input: buf,
    left: (i % 3) * 48,
    top: Math.floor(i / 3) * 48,
  }));

  await sharp({
    create: { width: 144, height: 144, channels: 4, background: '#000000ff' }
  })
    .composite(composites)
    .png()
    .toFile(path.join(OUT, 'preview.png'));

  console.log('  ✓ preview.png (3x3 grid)');
  console.log(`\nAll tiles saved to ${OUT}`);
}

main().catch(console.error);
