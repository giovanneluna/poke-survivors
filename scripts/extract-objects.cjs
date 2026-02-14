/**
 * Extract multi-tile objects (trees, bushes, rocks, stumps) from the tileset.
 *
 * Each object spans multiple 32×32 cells. We extract the full region
 * then auto-trim transparent borders with sharp.trim().
 *
 * Output: public/assets/tiles/route/objects/{category}/{name}.png
 *         + catalog.png contact sheet
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILESET = path.join(__dirname, '..', 'public',
  'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT = path.join(__dirname, '..', 'public', 'assets', 'tiles', 'route', 'objects');
const TILE = 32;

/**
 * Object definitions: { name, category, startRow, startCol, rows, cols }
 * Coordinates are 0-indexed into the 32×32 grid.
 */
const OBJECTS = [
  // ── Small round trees (1 col × 2 rows = 32×64) ──────────────────
  { name: 'tree-round-light',   category: 'trees', startRow: 0,  startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-round-green',   category: 'trees', startRow: 0,  startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-round-dark',    category: 'trees', startRow: 0,  startCol: 2, rows: 2, cols: 1 },
  { name: 'tree-round-vdark',   category: 'trees', startRow: 0,  startCol: 3, rows: 2, cols: 1 },

  // ── Small round trees variant 2 ─────────────────────────────────
  { name: 'tree-round2-light',  category: 'trees', startRow: 2,  startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-round2-green',  category: 'trees', startRow: 2,  startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-round2-dark',   category: 'trees', startRow: 2,  startCol: 2, rows: 2, cols: 1 },

  // ── Pointy/bushy trees ──────────────────────────────────────────
  { name: 'tree-pointy-light',  category: 'trees', startRow: 4,  startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-pointy-green',  category: 'trees', startRow: 4,  startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-pointy-dark',   category: 'trees', startRow: 4,  startCol: 2, rows: 2, cols: 1 },
  { name: 'tree-pointy-vdark',  category: 'trees', startRow: 4,  startCol: 3, rows: 2, cols: 1 },

  // ── Medium round trees (bigger) ─────────────────────────────────
  { name: 'tree-med-light',     category: 'trees', startRow: 6,  startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-med-green',     category: 'trees', startRow: 6,  startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-med-dark',      category: 'trees', startRow: 6,  startCol: 2, rows: 2, cols: 1 },
  { name: 'tree-med-vdark',     category: 'trees', startRow: 6,  startCol: 3, rows: 2, cols: 1 },

  // ── Tall trees with visible trunk ───────────────────────────────
  { name: 'tree-tall-light',    category: 'trees', startRow: 8,  startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-tall-green',    category: 'trees', startRow: 8,  startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-tall-dark',     category: 'trees', startRow: 8,  startCol: 2, rows: 2, cols: 1 },
  { name: 'tree-tall-vdark',    category: 'trees', startRow: 8,  startCol: 3, rows: 2, cols: 1 },

  // ── Autumn trees ────────────────────────────────────────────────
  { name: 'tree-autumn-red',    category: 'trees', startRow: 10, startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-autumn-orange', category: 'trees', startRow: 10, startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-autumn-mixed',  category: 'trees', startRow: 10, startCol: 2, rows: 2, cols: 1 },

  // ── Pine/conifer trees (rows 12-13, larger) ─────────────────────
  { name: 'tree-pine-light',    category: 'trees', startRow: 12, startCol: 0, rows: 3, cols: 1 },
  { name: 'tree-pine-green',    category: 'trees', startRow: 12, startCol: 1, rows: 3, cols: 1 },
  { name: 'tree-pine-dark',     category: 'trees', startRow: 12, startCol: 2, rows: 3, cols: 1 },
  { name: 'tree-pine-vdark',    category: 'trees', startRow: 12, startCol: 3, rows: 3, cols: 1 },

  // ── Smaller conifers (rows 15-16) ───────────────────────────────
  { name: 'tree-fir-light',     category: 'trees', startRow: 15, startCol: 0, rows: 2, cols: 1 },
  { name: 'tree-fir-green',     category: 'trees', startRow: 15, startCol: 1, rows: 2, cols: 1 },
  { name: 'tree-fir-dark',      category: 'trees', startRow: 15, startCol: 2, rows: 2, cols: 1 },
  { name: 'tree-fir-vdark',     category: 'trees', startRow: 15, startCol: 3, rows: 2, cols: 1 },

  // ── Bushes with visible trunk (rows 38-39) ─────────────────────
  { name: 'bush-light',         category: 'vegetation', startRow: 38, startCol: 0, rows: 2, cols: 1 },
  { name: 'bush-green',         category: 'vegetation', startRow: 38, startCol: 1, rows: 2, cols: 1 },
  { name: 'bush-large',         category: 'vegetation', startRow: 38, startCol: 2, rows: 2, cols: 1 },
  { name: 'bush-leafy',         category: 'vegetation', startRow: 38, startCol: 3, rows: 2, cols: 1 },

  // ── Small vegetation (1×1 tiles) ────────────────────────────────
  { name: 'fern',               category: 'vegetation', startRow: 42, startCol: 0, rows: 1, cols: 1 },
  { name: 'bush-cone',          category: 'vegetation', startRow: 42, startCol: 1, rows: 1, cols: 1 },
  { name: 'palm-small',         category: 'vegetation', startRow: 42, startCol: 2, rows: 1, cols: 1 },

  // ── Small pine trees (rows 40-41) ──────────────────────────────
  { name: 'pine-small-a',       category: 'vegetation', startRow: 40, startCol: 0, rows: 2, cols: 1 },
  { name: 'pine-small-b',       category: 'vegetation', startRow: 40, startCol: 1, rows: 2, cols: 1 },
  { name: 'stump',              category: 'vegetation', startRow: 40, startCol: 2, rows: 2, cols: 1 },
  { name: 'cactus',             category: 'vegetation', startRow: 40, startCol: 3, rows: 2, cols: 1 },

  // ── Rocks and boulders ──────────────────────────────────────────
  { name: 'rock-small',         category: 'rocks', startRow: 91, startCol: 4, rows: 1, cols: 1 },
  { name: 'rock-pile',          category: 'rocks', startRow: 91, startCol: 5, rows: 1, cols: 1 },
  { name: 'coral',              category: 'rocks', startRow: 91, startCol: 3, rows: 1, cols: 1 },

  // ── Large hedges (rows 19-20, 2 cols wide) ─────────────────────
  { name: 'hedge-large-light',  category: 'vegetation', startRow: 19, startCol: 0, rows: 2, cols: 2 },
  { name: 'hedge-large-green',  category: 'vegetation', startRow: 19, startCol: 2, rows: 2, cols: 2 },

  // ── Pointed hedges (rows 21-22) ────────────────────────────────
  { name: 'hedge-point-light',  category: 'vegetation', startRow: 21, startCol: 0, rows: 2, cols: 1 },
  { name: 'hedge-point-green',  category: 'vegetation', startRow: 21, startCol: 1, rows: 2, cols: 1 },
  { name: 'hedge-point-dark',   category: 'vegetation', startRow: 21, startCol: 2, rows: 2, cols: 1 },
  { name: 'hedge-point-vdark',  category: 'vegetation', startRow: 21, startCol: 3, rows: 2, cols: 1 },
];

async function main() {
  // Create output directories
  const categories = [...new Set(OBJECTS.map(o => o.category))];
  for (const cat of categories) {
    const dir = path.join(OUT, cat);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const meta = await sharp(TILESET).metadata();
  const maxRows = Math.floor(meta.height / TILE);

  console.log(`Tileset: ${meta.width}x${meta.height} (${Math.floor(meta.width / TILE)} cols × ${maxRows} rows)\n`);

  const extracted = [];

  for (const obj of OBJECTS) {
    const { name, category, startRow, startCol, rows, cols } = obj;

    const x = startCol * TILE;
    const y = startRow * TILE;
    const w = cols * TILE;
    const h = rows * TILE;

    if (y + h > meta.height || x + w > meta.width) {
      console.log(`  SKIP ${name}: out of bounds (row ${startRow}, col ${startCol})`);
      continue;
    }

    try {
      // Extract raw region
      const rawBuf = await sharp(TILESET)
        .extract({ left: x, top: y, width: w, height: h })
        .toBuffer();

      // Auto-trim transparent borders
      let trimmed;
      try {
        trimmed = await sharp(rawBuf).trim().toBuffer();
      } catch {
        // trim() can fail if image is fully transparent or uniform
        trimmed = rawBuf;
      }

      const outPath = path.join(OUT, category, `${name}.png`);
      await sharp(trimmed).png().toFile(outPath);

      const trimMeta = await sharp(trimmed).metadata();
      console.log(`  OK ${name} (${trimMeta.width}x${trimMeta.height}) → ${category}/`);
      extracted.push({ name, category, buffer: trimmed, w: trimMeta.width, h: trimMeta.height });
    } catch (err) {
      console.log(`  ERR ${name}: ${err.message}`);
    }
  }

  // ── Build contact sheet (catalog.png) ──────────────────────────
  console.log(`\n--- Building catalog (${extracted.length} objects) ---`);

  const COLS = 8;
  const CELL = 80; // each cell in the catalog
  const PAD = 4;
  const catalogRows = Math.ceil(extracted.length / COLS);
  const catW = COLS * CELL;
  const catH = catalogRows * CELL;

  const composites = [];
  for (let i = 0; i < extracted.length; i++) {
    const { buffer, w, h } = extracted[i];
    const cx = (i % COLS) * CELL;
    const cy = Math.floor(i / COLS) * CELL;

    // Scale to fit within CELL-PAD*2, maintaining aspect ratio
    const maxDim = CELL - PAD * 2;
    const scale = Math.min(maxDim / w, maxDim / h, 2); // max 2× upscale
    const sw = Math.round(w * scale);
    const sh = Math.round(h * scale);

    const resized = await sharp(buffer)
      .resize(sw, sh, { kernel: 'nearest' })
      .toBuffer();

    composites.push({
      input: resized,
      left: cx + Math.floor((CELL - sw) / 2),
      top: cy + Math.floor((CELL - sh) / 2),
    });
  }

  if (composites.length > 0) {
    await sharp({
      create: { width: catW, height: catH, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } },
    })
      .composite(composites)
      .png()
      .toFile(path.join(OUT, 'catalog.png'));

    console.log(`  OK catalog.png (${catW}x${catH}, ${extracted.length} objects)`);
  }

  console.log(`\nDone! ${extracted.length} objects extracted to ${OUT}/`);
}

main().catch(console.error);
