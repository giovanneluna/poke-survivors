/**
 * Extract final candidate tiles — more precise search for tree, rock, water.
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILESET = path.join(__dirname, '..', 'public',
  'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT = path.join(__dirname, '..', 'temp-tiles', 'final');
const TILE = 32;

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const meta = await sharp(TILESET).metadata();

  // Extract fine strips for areas we haven't seen yet
  const rows = [
    // Small trees/bushes at top
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    // Grass variants
    66, 67, 68, 69, 70, 71, 72, 73,
    // Dirt fills
    78, 79, 80, 81,
    // Stone/brick paths (center fills)
    93, 94, 95, 96, 97,
    // Potential rock area
    88, 89, 90, 91, 92,
    // Potential more paths
    99, 100, 101, 102, 103, 104, 105,
    // Water zone
    108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125,
  ];

  for (const row of rows) {
    const y = row * TILE;
    if (y + TILE > meta.height) break;
    await sharp(TILESET)
      .extract({ left: 0, top: y, width: meta.width, height: TILE })
      .toFile(path.join(OUT, `row-${String(row).padStart(3, '0')}.png`));
  }

  // Also extract 2-row tall strips to see multi-row trees
  for (let row = 0; row <= 8; row += 2) {
    const y = row * TILE;
    if (y + TILE * 2 > meta.height) break;
    await sharp(TILESET)
      .extract({ left: 0, top: y, width: meta.width, height: TILE * 2 })
      .toFile(path.join(OUT, `tree-pair-${row}-${row + 1}.png`));
  }

  console.log('Done — check temp-tiles/final/');
}

main().catch(console.error);
