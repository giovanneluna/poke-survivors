/**
 * Map Noise Utilities
 *
 * Coherent value noise functions for procedural biome generation.
 * Used by WorldSystem (in-game) and MapEditorScene (random map gen).
 */

import type { TileTheme } from '../data/tile-themes';

export type BiomeHint = keyof TileTheme['tiles'];

/** Integer hash → [0, 1] deterministic pseudorandom */
export function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

/** Smooth value noise via bilinear interpolation of hash grid */
export function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Fractal Brownian Motion — layered value noise */
export function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amp = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < octaves; i++) {
    value += amp * valueNoise(px, py);
    px *= 2;
    py *= 2;
    amp *= 0.5;
  }
  return value;
}

/**
 * Pick a biome hint for a given cell based on noise.
 * Returns a key of TileTheme['tiles'] (grassLight, tree, water, etc.)
 */
export function pickBiomeHint(
  col: number,
  row: number,
  maxCols: number,
  maxRows: number,
): BiomeHint {
  // Border ring: water -> waterEdge -> tree
  const edgeMargin = 3;
  if (col < edgeMargin || col >= maxCols - edgeMargin || row < edgeMargin || row >= maxRows - edgeMargin) {
    const isOuter = col < 1 || col >= maxCols - 1 || row < 1 || row >= maxRows - 1;
    if (isOuter) return 'water';
    const isSecond = col < 2 || col >= maxCols - 2 || row < 2 || row >= maxRows - 2;
    return isSecond ? 'waterEdge' : 'tree';
  }

  // Tree clusters: organic blobs via low-freq noise
  const treeN = fbm(col * 0.06, row * 0.06, 3);
  if (treeN > 0.62) return 'tree';

  // Rock: only at tree-cluster edges (transition zone)
  if (treeN > 0.55) return 'rock';

  // Dirt patches: separate noise layer, rare
  const dirtN = fbm(col * 0.09 + 50, row * 0.09 + 50, 2);
  if (dirtN > 0.68) return 'dirt';

  // Flower meadows: medium blobs
  const flowerN = fbm(col * 0.1 + 150, row * 0.1 + 150, 2);
  if (flowerN > 0.62) return 'grassFlower';

  // Grass dark: smooth large patches
  const darkN = fbm(col * 0.07 + 250, row * 0.07 + 250, 2);
  if (darkN > 0.52) return 'grassDark';

  // Path: thin veins via high-freq narrow band
  const pathN = fbm(col * 0.15 + 400, row * 0.15 + 400, 2);
  if (pathN > 0.49 && pathN < 0.51) return 'path';

  return 'grassLight';
}
