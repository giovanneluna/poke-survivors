/**
 * Tileset Catalog Generator
 *
 * Generates labeled section images from the large tileset for visual review.
 * Each section is extracted at 2× scale with row/col grid for easy coordinate reference.
 *
 * Output: temp-tiles/catalog/
 *   - section-objects-small.png  (rows 0-11:  small trees, bushes, autumn)
 *   - section-objects-misc.png   (rows 12-35: cacti, large rocks, snow, hedges)
 *   - section-objects-large.png  (rows 36-64: giant trees, vines, stumps, logs)
 *   - section-tiles-terrain.png  (rows 65-98: grass, dirt, sand, stone, paths)
 *   - section-tiles-water.png    (rows 99-130: brick, water, transitions)
 *   - per-row strips in rows/ subfolder for fine-grained inspection
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILESET = path.join(__dirname, '..', 'public',
  'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT = path.join(__dirname, '..', 'temp-tiles', 'catalog');
const TILE = 32;
const SCALE = 2; // 2× scale for visibility

const SECTIONS = [
  { name: 'objects-small',  startRow: 0,  endRow: 11,  label: 'Small trees & bushes (rows 0-11)' },
  { name: 'objects-misc',   startRow: 12, endRow: 35,  label: 'Cacti, rocks, snow, hedges (rows 12-35)' },
  { name: 'objects-large',  startRow: 36, endRow: 64,  label: 'Giant trees, vines, logs (rows 36-64)' },
  { name: 'tiles-terrain',  startRow: 65, endRow: 98,  label: 'Grass, dirt, sand, stone, paths (rows 65-98)' },
  { name: 'tiles-water',    startRow: 99, endRow: 130, label: 'Brick, decorative, water (rows 99-130)' },
];

/**
 * Create a colored line buffer for grid overlay
 */
async function createGridLine(width, height, color) {
  return sharp({
    create: { width, height, channels: 4, background: color },
  }).png().toBuffer();
}

/**
 * Create a small label image with row number using a simple bitmap approach.
 * Since sharp can't render text, we create a colored tag strip on the left side.
 */
async function createRowTag(row, sectionWidth, tagHeight) {
  // Alternate colors for odd/even rows for visual distinction
  const isEven = row % 2 === 0;
  const bg = isEven
    ? { r: 40, g: 40, b: 40, alpha: 200 }
    : { r: 60, g: 60, b: 60, alpha: 200 };

  return sharp({
    create: { width: sectionWidth, height: 1, channels: 4, background: bg },
  }).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const rowsDir = path.join(OUT, 'rows');
  if (!fs.existsSync(rowsDir)) fs.mkdirSync(rowsDir, { recursive: true });

  const meta = await sharp(TILESET).metadata();
  const maxRows = Math.floor(meta.height / TILE);
  const cols = Math.floor(meta.width / TILE);
  console.log(`Tileset: ${meta.width}x${meta.height} = ${cols} cols × ${maxRows} rows (32px grid)`);

  // ── 1. Extract individual row strips (at 2× scale) ──────────────
  console.log('\n--- Extracting per-row strips ---');
  for (let row = 0; row <= Math.min(140, maxRows - 1); row++) {
    const y = row * TILE;
    if (y + TILE > meta.height) break;

    await sharp(TILESET)
      .extract({ left: 0, top: y, width: meta.width, height: TILE })
      .resize(meta.width * SCALE, TILE * SCALE, { kernel: 'nearest' })
      .toFile(path.join(rowsDir, `row-${String(row).padStart(3, '0')}.png`));
  }
  console.log(`  Extracted rows 0-140 to ${rowsDir}/`);

  // ── 2. Extract section composites ────────────────────────────────
  console.log('\n--- Building section composites ---');

  for (const section of SECTIONS) {
    const { name, startRow, endRow, label } = section;
    const actualEnd = Math.min(endRow, maxRows - 1);
    const numRows = actualEnd - startRow + 1;

    const srcY = startRow * TILE;
    const srcH = numRows * TILE;

    if (srcY + srcH > meta.height) {
      console.log(`  SKIP ${name}: rows ${startRow}-${endRow} exceed tileset height`);
      continue;
    }

    // Extract the raw section
    const sectionBuf = await sharp(TILESET)
      .extract({ left: 0, top: srcY, width: meta.width, height: srcH })
      .toBuffer();

    // Scale up 2×
    const scaledW = meta.width * SCALE;
    const scaledH = srcH * SCALE;

    const scaledBuf = await sharp(sectionBuf)
      .resize(scaledW, scaledH, { kernel: 'nearest' })
      .toBuffer();

    // Add grid lines overlay
    const gridComposites = [];

    // Horizontal lines (between rows)
    const hLine = await createGridLine(scaledW, 1, { r: 255, g: 0, b: 0, alpha: 100 });
    for (let r = 1; r < numRows; r++) {
      gridComposites.push({ input: hLine, top: r * TILE * SCALE, left: 0 });
    }

    // Vertical lines (between cols)
    const vLine = await createGridLine(1, scaledH, { r: 255, g: 0, b: 0, alpha: 100 });
    for (let c = 1; c < cols; c++) {
      gridComposites.push({ input: vLine, top: 0, left: c * TILE * SCALE });
    }

    // Composite grid onto section
    const result = await sharp(scaledBuf)
      .composite(gridComposites)
      .png()
      .toFile(path.join(OUT, `section-${name}.png`));

    console.log(`  ✓ section-${name}.png (rows ${startRow}-${actualEnd}, ${scaledW}x${scaledH}px) — ${label}`);
  }

  // ── 3. Generate reference card ───────────────────────────────────
  console.log('\n--- Reference ---');
  console.log('Grid: 8 columns (0-7) × 651 rows');
  console.log('Each tile: 32×32px (shown at 2× = 64×64px in catalog)');
  console.log('Red grid lines mark tile boundaries');
  console.log('\nTo extract an object, note the (startRow, startCol) → (endRow, endCol)');
  console.log('Example: tree-small-green = rows [0,1], cols [1] = position (row=0, col=1), size 1×2 tiles');
  console.log('\nSections saved to: ' + OUT);

  // Write a text reference file
  const refLines = [
    'TILESET CATALOG REFERENCE',
    '========================',
    '',
    `Source: ${path.basename(TILESET)}`,
    `Grid: ${cols} columns × ${maxRows} rows (${TILE}px tiles)`,
    '',
    'SECTIONS:',
    ...SECTIONS.map(s => `  ${s.name}: rows ${s.startRow}-${s.endRow} — ${s.label}`),
    '',
    'COORDINATE SYSTEM:',
    '  Row 0 = top of tileset',
    '  Col 0 = left of tileset',
    '  Each tile = 32×32px',
    '  In catalog images: 2× scale, red grid lines between tiles',
    '',
    'HOW TO USE:',
    '  1. Open section images in an image viewer',
    '  2. Count tiles from top-left (row, col) using red grid',
    '  3. Add coordinates to extract-objects.cjs or extract-ground-tiles.cjs',
    '',
    'TILE MAP (from visual inspection):',
    '  Rows 0-1:   Small round trees (4 color variants, cols 0-3)',
    '  Rows 2-3:   Small round trees (4 color variants, same pattern)',
    '  Rows 4-5:   Small pointy trees (4 variants)',
    '  Rows 6-7:   Medium round trees (4 variants)',
    '  Rows 8-9:   Tall trees with trunks (4 variants)',
    '  Rows 10-11: Autumn trees (red, orange, green, dark)',
    '  Rows 12-14: Cacti, palms, decorative plants',
    '  Rows 15-25: Large trees with full canopy + shadows',
    '  Rows 25-30: Snow/ice rocks and formations',
    '  Rows 30-35: Snow bushes, small formations',
    '  Rows 36-42: Mixed vegetation (bushes, pines, hedges)',
    '  Rows 43-50: Giant tree trunks + canopy, hanging vines',
    '  Rows 50-55: Giant trees, fallen logs, stumps, boulders',
    '  Rows 55-64: Massive tree trunks, vine details',
    '  Rows 65-67: Terrain borders (grass/sand transitions)',
    '  Rows 68-72: Grass tiles (light, dark, flower, tall)',
    '  Rows 73-77: Sand/desert tiles',
    '  Rows 78-83: Dirt tiles (various patterns)',
    '  Rows 84-87: Cliff/ledge tiles',
    '  Rows 88-92: Rocky terrain, boulders',
    '  Rows 93-98: Stone paths (brick, cobble, walkway)',
    '  Rows 99-107: Red brick, decorative tiles',
    '  Rows 108-114: Beige/herringbone terrain',
    '  Rows 115-125: Water tiles (waves, edges, sand transitions)',
    '  Rows 126+: More terrain/water variants',
  ];
  fs.writeFileSync(path.join(OUT, 'REFERENCE.txt'), refLines.join('\n'));
  console.log('  ✓ REFERENCE.txt');
}

main().catch(console.error);
