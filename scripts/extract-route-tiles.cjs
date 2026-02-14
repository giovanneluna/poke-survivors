/**
 * Extract specific 32x32 tiles from the large tileset for the "Kanto Route" theme.
 * Phase 1: Extract candidate tiles from identified regions for visual review.
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILESET = path.join(__dirname, '..', 'public',
  'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT = path.join(__dirname, '..', 'temp-tiles', 'candidates');
const TILE = 32;

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // Extract individual tiles at (col, row) for targeted review
  // Format: [label, col, row]
  const candidates = [
    // === GRASS — rows 68-73 ===
    ['grass-r68-c0', 0, 68],
    ['grass-r68-c1', 1, 68],
    ['grass-r69-c0', 0, 69],
    ['grass-r69-c1', 1, 69],
    ['grass-r70-c0', 0, 70],
    ['grass-r70-c1', 1, 70],
    ['grass-r71-c0', 0, 71],
    ['grass-r71-c1', 1, 71],
    ['grass-r72-c0', 0, 72],
    ['grass-r72-c1', 1, 72],

    // === GRASS WITH FLOWERS — row 70 ===
    ['flower-r70-c2', 2, 70],
    ['flower-r70-c3', 3, 70],
    ['flower-r70-c4', 4, 70],
    ['flower-r71-c2', 2, 71],
    ['flower-r71-c3', 3, 71],
    ['flower-r72-c2', 2, 72],

    // === DIRT/SAND — rows 78-83 ===
    ['dirt-r78-c0', 0, 78],
    ['dirt-r79-c0', 0, 79],
    ['dirt-r80-c0', 0, 80],
    ['dirt-r80-c1', 1, 80],
    ['dirt-r80-c2', 2, 80],
    ['dirt-r81-c0', 0, 81],
    ['dirt-r81-c1', 1, 81],
    ['dirt-r82-c0', 0, 82],
    ['dirt-r82-c1', 1, 82],
    ['dirt-r83-c0', 0, 83],

    // === STONE/PAVED PATH — rows 93-98 ===
    ['path-r93-c0', 0, 93],
    ['path-r93-c1', 1, 93],
    ['path-r93-c2', 2, 93],
    ['path-r94-c0', 0, 94],
    ['path-r94-c1', 1, 94],
    ['path-r94-c2', 2, 94],
    ['path-r95-c0', 0, 95],
    ['path-r95-c1', 1, 95],
    ['path-r95-c2', 2, 95],
    ['path-r95-c3', 3, 95],
    ['path-r96-c0', 0, 96],
    ['path-r96-c1', 1, 96],
    ['path-r96-c2', 2, 96],
    ['path-r97-c0', 0, 97],
    ['path-r97-c1', 1, 97],
    ['path-r98-c0', 0, 98],
    ['path-r98-c1', 1, 98],

    // === WATER — rows 108-125 ===
    ['water-r108-c0', 0, 108],
    ['water-r108-c1', 1, 108],
    ['water-r109-c0', 0, 109],
    ['water-r109-c1', 1, 109],
    ['water-r110-c0', 0, 110],
    ['water-r110-c1', 1, 110],
    ['water-r110-c2', 2, 110],
    ['water-r111-c0', 0, 111],
    ['water-r111-c1', 1, 111],
    ['water-r112-c0', 0, 112],
    ['water-r112-c1', 1, 112],
    ['water-r118-c0', 0, 118],
    ['water-r118-c1', 1, 118],
    ['water-r119-c0', 0, 119],
    ['water-r119-c1', 1, 119],
    ['water-r120-c0', 0, 120],
    ['water-r120-c1', 1, 120],
    ['water-r120-c2', 2, 120],

    // === TREES — rows 0-10 (round Gen 3 style) ===
    ['tree-r00-c0', 0, 0],
    ['tree-r00-c1', 1, 0],
    ['tree-r01-c0', 0, 1],
    ['tree-r01-c1', 1, 1],
    ['tree-r02-c0', 0, 2],
    ['tree-r02-c1', 1, 2],
    ['tree-r03-c0', 0, 3],
    ['tree-r04-c0', 0, 4],
    ['tree-r05-c0', 0, 5],
    ['tree-r05-c1', 1, 5],
    ['tree-r06-c0', 0, 6],
    ['tree-r06-c1', 1, 6],
    ['tree-r07-c0', 0, 7],
    ['tree-r08-c0', 0, 8],

    // === ROCK/STONE — rows 88-92 ===
    ['rock-r88-c0', 0, 88],
    ['rock-r89-c0', 0, 89],
    ['rock-r90-c0', 0, 90],
    ['rock-r90-c4', 4, 90],
    ['rock-r90-c5', 5, 90],
    ['rock-r91-c0', 0, 91],
    ['rock-r92-c0', 0, 92],
  ];

  const meta = await sharp(TILESET).metadata();
  let count = 0;

  for (const [label, col, row] of candidates) {
    const x = col * TILE;
    const y = row * TILE;
    if (x + TILE > meta.width || y + TILE > meta.height) {
      console.log(`SKIP ${label}: out of bounds (${x},${y})`);
      continue;
    }

    await sharp(TILESET)
      .extract({ left: x, top: y, width: TILE, height: TILE })
      .toFile(path.join(OUT, `${label}.png`));
    count++;
  }

  // Also extract full-row strips at fine granularity for the key regions
  const fineRows = [68, 69, 70, 71, 72, 78, 79, 80, 81, 82,
                     93, 94, 95, 96, 97, 98,
                     108, 109, 110, 111, 112, 118, 119, 120, 121, 122];
  for (const row of fineRows) {
    const y = row * TILE;
    if (y + TILE > meta.height) break;
    await sharp(TILESET)
      .extract({ left: 0, top: y, width: meta.width, height: TILE })
      .toFile(path.join(OUT, `strip-fine-${String(row).padStart(3, '0')}.png`));
  }

  console.log(`Extracted ${count} candidate tiles + ${fineRows.length} fine strips to ${OUT}`);
}

main().catch(console.error);
