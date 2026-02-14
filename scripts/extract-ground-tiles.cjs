/**
 * Extract additional ground tile variants from the tileset.
 *
 * Each tile is a single 32×32 cell, resized to 24×24 (nearest neighbor)
 * for consistency with the game's 24px grid.
 *
 * Output: public/assets/tiles/route/variants/{name}.png
 *         + catalog.png contact sheet
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILESET = path.join(__dirname, '..', 'public',
  'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT = path.join(__dirname, '..', 'public', 'assets', 'tiles', 'route', 'variants');
const TILE = 32;
const TARGET = 24; // game grid size

/**
 * Ground tile definitions: { name, row, col, description }
 * All coordinates are 0-indexed into the 32×32 grid.
 *
 * NOTE: Many tiles in this tileset are 2×2 or larger blocks with borders.
 * We pick the CENTER fill tile (typically row+1, col+1 of a 2×2 block)
 * to get a tileable result.
 */
const TILES = [
  // ── Grass variants ──────────────────────────────────────────────
  { name: 'grass-v2',        row: 69, col: 0, desc: 'Lighter yellow-green grass' },
  { name: 'grass-v3',        row: 70, col: 0, desc: 'Grass with subtle edge' },
  { name: 'grass-tall',      row: 73, col: 3, desc: 'Tall grass blades' },
  { name: 'grass-tall-v2',   row: 73, col: 4, desc: 'Tall grass variant 2' },

  // ── Sand/beach (for coast!) ─────────────────────────────────────
  { name: 'sand-light',      row: 78, col: 0, desc: 'Golden sand fill' },
  { name: 'sand-v2',         row: 73, col: 6, desc: 'Light sand/yellow fill' },
  { name: 'sand-v3',         row: 73, col: 7, desc: 'Sand variant 3' },

  // ── Dirt variants ───────────────────────────────────────────────
  { name: 'dirt-v2',         row: 80, col: 2, desc: 'Brown dirt crosshatch' },
  { name: 'dirt-woven',      row: 80, col: 3, desc: 'Brown woven/basket pattern' },
  { name: 'dirt-dark',       row: 81, col: 2, desc: 'Dark hexagonal cobble dirt' },

  // ── Stone/path variants ─────────────────────────────────────────
  { name: 'stone-checker',   row: 93, col: 0, desc: 'Gray stone checkered' },
  { name: 'stone-herring',   row: 93, col: 2, desc: 'Beige herringbone stone' },
  { name: 'stone-gray',      row: 91, col: 2, desc: 'Light gray marble' },
  { name: 'cobble',          row: 82, col: 2, desc: 'Cobblestone path' },

  // ── Decorative ground ───────────────────────────────────────────
  { name: 'flowers-pink',    row: 70, col: 2, desc: 'Pink flowers on grass' },
  { name: 'flowers-mixed',   row: 70, col: 3, desc: 'Mixed color flowers' },
  { name: 'leaves-dark',     row: 70, col: 4, desc: 'Dark fern leaves' },
  { name: 'leaves-v2',       row: 70, col: 5, desc: 'Fern leaves variant' },

  // ── Water variants ──────────────────────────────────────────────
  { name: 'water-deep',      row: 121, col: 0, desc: 'Blue scalloped water fill' },
  { name: 'water-solid',     row: 128, col: 2, desc: 'Solid deep blue water' },
  { name: 'water-light',     row: 115, col: 2, desc: 'Light teal water fill' },
];

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const meta = await sharp(TILESET).metadata();
  console.log(`Tileset: ${meta.width}x${meta.height}\n`);

  const extracted = [];

  for (const tile of TILES) {
    const { name, row, col, desc } = tile;
    const x = col * TILE;
    const y = row * TILE;

    if (y + TILE > meta.height || x + TILE > meta.width) {
      console.log(`  SKIP ${name}: out of bounds (row ${row}, col ${col})`);
      continue;
    }

    try {
      const buf = await sharp(TILESET)
        .extract({ left: x, top: y, width: TILE, height: TILE })
        .toBuffer();

      // Resize to 24×24 for game grid
      const resized = await sharp(buf)
        .resize(TARGET, TARGET, { kernel: 'nearest' })
        .toBuffer();

      const outPath = path.join(OUT, `${name}.png`);
      await sharp(resized).toFile(outPath);

      console.log(`  OK ${name} (row ${row}, col ${col}) — ${desc}`);
      extracted.push({ name, buffer: resized });
    } catch (err) {
      console.log(`  ERR ${name}: ${err.message}`);
    }
  }

  // ── Build catalog contact sheet ─────────────────────────────────
  console.log(`\n--- Building catalog (${extracted.length} tiles) ---`);

  const COLS = 6;
  const CELL = 48; // 2× the target size for visibility
  const catRows = Math.ceil(extracted.length / COLS);
  const catW = COLS * CELL;
  const catH = catRows * CELL;

  const composites = [];
  for (let i = 0; i < extracted.length; i++) {
    const { buffer } = extracted[i];
    const cx = (i % COLS) * CELL;
    const cy = Math.floor(i / COLS) * CELL;

    const scaled = await sharp(buffer)
      .resize(CELL, CELL, { kernel: 'nearest' })
      .toBuffer();

    composites.push({ input: scaled, left: cx, top: cy });
  }

  if (composites.length > 0) {
    await sharp({
      create: { width: catW, height: catH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } },
    })
      .composite(composites)
      .png()
      .toFile(path.join(OUT, 'catalog.png'));

    console.log(`  OK catalog.png (${catW}x${catH})`);
  }

  console.log(`\nDone! ${extracted.length} tiles extracted to ${OUT}/`);
}

main().catch(console.error);
