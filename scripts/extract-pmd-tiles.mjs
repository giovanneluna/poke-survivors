/**
 * extract-pmd-tiles.mjs — Extrai tiles individuais de tilesets PMD (24×24, 18 colunas)
 * e gera 9 tiles nomeados + preview 3×3 para cada tema.
 *
 * Uso: node scripts/extract-pmd-tiles.mjs
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const TILE_SIZE = 24;
const COLS = 18;

// Configuração de cada tema: qual tileset PMD usar e quais posições (col, row) para cada tile
const THEMES = [
  {
    id: 'crystal',
    name: 'Crystal Cave',
    source: 'CrystalCave1',
    // CrystalCave1: purple walls (left), blue water (mid), gray-blue ground (right)
    tiles: {
      'grass-light':  { col: 17, row: 0 },  // solid light ground (top-right)
      'grass-dark':   { col: 12, row: 0 },  // darker ground
      'grass-flower': { col: 17, row: 7 },  // ground with detail
      'dirt':         { col: 14, row: 3 },  // mid-section ground
      'water':        { col: 11, row: 0 },  // solid blue water
      'water-edge':   { col: 8,  row: 1 },  // water edge
      'tree':         { col: 5,  row: 0 },  // solid wall (obstacle)
      'rock':         { col: 2,  row: 5 },  // smaller wall piece
      'path':         { col: 15, row: 4 },  // path-like ground
    },
  },
  {
    id: 'magma',
    name: 'Magma Cavern',
    source: 'MagmaCavern3',
    // MagmaCavern3: brown walls (left), orange lava (mid), brown-red ground (right)
    tiles: {
      'grass-light':  { col: 17, row: 0 },
      'grass-dark':   { col: 12, row: 0 },
      'grass-flower': { col: 17, row: 7 },
      'dirt':         { col: 14, row: 4 },
      'water':        { col: 11, row: 0 },  // lava
      'water-edge':   { col: 8,  row: 1 },
      'tree':         { col: 5,  row: 0 },
      'rock':         { col: 2,  row: 5 },
      'path':         { col: 15, row: 3 },
    },
  },
  {
    id: 'sky',
    name: 'Sky Tower',
    source: 'SkyTower',
    // SkyTower: white-blue walls (left), dark blue clouds (mid), light blue ground (right)
    tiles: {
      'grass-light':  { col: 17, row: 0 },
      'grass-dark':   { col: 12, row: 0 },
      'grass-flower': { col: 17, row: 7 },
      'dirt':         { col: 14, row: 3 },
      'water':        { col: 11, row: 0 },  // clouds
      'water-edge':   { col: 8,  row: 1 },
      'tree':         { col: 5,  row: 0 },
      'rock':         { col: 2,  row: 5 },
      'path':         { col: 15, row: 5 },
    },
  },
  {
    id: 'dark',
    name: 'Dark Crater',
    source: 'DarkCrater',
    // DarkCrater: dark red walls (left), purple paths (mid), dark teal ground (right)
    tiles: {
      'grass-light':  { col: 17, row: 0 },
      'grass-dark':   { col: 12, row: 0 },
      'grass-flower': { col: 17, row: 7 },
      'dirt':         { col: 14, row: 4 },
      'water':        { col: 11, row: 0 },
      'water-edge':   { col: 8,  row: 1 },
      'tree':         { col: 5,  row: 0 },
      'rock':         { col: 2,  row: 5 },
      'path':         { col: 15, row: 3 },
    },
  },
];

const ROOT = resolve('public/assets');
const TILESET_DIR = resolve('public/assets/pokeautochess-content/tilesets');

async function extractTile(sourceImg, col, row) {
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  return sharp(sourceImg)
    .extract({ left: x, top: y, width: TILE_SIZE, height: TILE_SIZE })
    .toBuffer();
}

async function createPreview(tileBuffers) {
  // 3×3 preview using: grassLight, grassDark, grassFlower, dirt, water, waterEdge, tree, rock, path
  const tiles = Object.values(tileBuffers);
  const previewSize = TILE_SIZE * 3;
  const composites = [];

  for (let i = 0; i < Math.min(9, tiles.length); i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    composites.push({
      input: tiles[i],
      left: col * TILE_SIZE,
      top: row * TILE_SIZE,
    });
  }

  return sharp({
    create: { width: previewSize, height: previewSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function main() {
  for (const theme of THEMES) {
    const outDir = join(ROOT, 'tiles', theme.id);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const sourceFile = join(TILESET_DIR, theme.source, 'tileset_0.png');
    console.log(`\n[${theme.id}] Extracting from ${theme.source}...`);

    const tileBuffers = {};
    const tileNames = Object.keys(theme.tiles);

    for (const tileName of tileNames) {
      const pos = theme.tiles[tileName];
      const buf = await extractTile(sourceFile, pos.col, pos.row);
      tileBuffers[tileName] = buf;

      const outPath = join(outDir, `${tileName}.png`);
      await sharp(buf).toFile(outPath);
      console.log(`  ✓ ${tileName} (${pos.col},${pos.row})`);
    }

    // Preview
    const previewBuf = await createPreview(tileBuffers);
    const previewPath = join(outDir, 'preview.png');
    await sharp(previewBuf).toFile(previewPath);
    console.log(`  ✓ preview.png (3×3 composite)`);
  }

  console.log('\nDone! 4 themes extracted.');
}

main().catch(console.error);
