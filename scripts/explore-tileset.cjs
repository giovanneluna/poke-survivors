/**
 * Explore tileset — extract sample tiles from different regions to identify
 * the best ones for our "Kanto Route" theme.
 *
 * Outputs individual 32x32 tiles + strip images for visual review.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TILESET = path.join(__dirname, '..', 'public', 'pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf-fullview.png');
const OUT_DIR = path.join(__dirname, '..', 'temp-tiles');
const TILE = 32;

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const meta = await sharp(TILESET).metadata();
  console.log(`Tileset: ${meta.width}x${meta.height} → ${meta.width / TILE} cols × ${Math.floor(meta.height / TILE)} rows`);

  // Extract horizontal strips (8 tiles wide) at interesting rows
  const stripRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                     15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
                     65, 70, 75, 80, 85, 90, 95, 100, 110, 120];

  for (const row of stripRows) {
    const y = row * TILE;
    if (y + TILE > meta.height) break;

    await sharp(TILESET)
      .extract({ left: 0, top: y, width: meta.width, height: TILE })
      .toFile(path.join(OUT_DIR, `strip-row-${String(row).padStart(3, '0')}.png`));
  }

  // Also create a "contact sheet" — first 160 rows scaled down to see overview
  const overviewHeight = Math.min(160 * TILE, meta.height); // 5120px
  await sharp(TILESET)
    .extract({ left: 0, top: 0, width: meta.width, height: overviewHeight })
    .resize(256, Math.floor(overviewHeight / 2))  // 50% scale for easier viewing
    .toFile(path.join(OUT_DIR, 'overview-top.png'));

  console.log(`Extracted ${stripRows.length} strips + overview to ${OUT_DIR}`);
}

main().catch(console.error);
