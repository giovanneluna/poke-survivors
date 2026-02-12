/**
 * Editor Tile Registry
 *
 * Catalogs all tiles available in the Map Editor palette.
 * Each tile has metadata for rendering, collision, and categorization.
 */

export type TileSource = 'emerald' | 'frlg' | 'pmd';
export type TileCategory = 'ground' | 'water' | 'nature' | 'buildings' | 'decoration';

export interface EditorTile {
  readonly id: string;
  readonly source: TileSource;
  readonly category: TileCategory;
  readonly name: string;
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;
  readonly collision: boolean;
  readonly destructible: boolean;
}

// ── Helpers for building tile entries ──────────────────────────────────

function emerald(
  category: TileCategory,
  file: string,
  name: string,
  opts?: { w?: number; h?: number; collision?: boolean; destructible?: boolean },
): EditorTile {
  const base = file.replace('.png', '');
  return {
    id: `emerald:${category}-${base}`,
    source: 'emerald',
    category,
    name,
    path: `assets/tiles/emerald/${category}/${file}`,
    width: opts?.w ?? 1,
    height: opts?.h ?? 1,
    tileSize: 16,
    collision: opts?.collision ?? false,
    destructible: opts?.destructible ?? false,
  };
}

function frlg(
  category: TileCategory,
  file: string,
  name: string,
  opts?: { w?: number; h?: number; collision?: boolean; destructible?: boolean },
): EditorTile {
  const base = file.replace('.png', '');
  return {
    id: `frlg:${category}-${base}`,
    source: 'frlg',
    category,
    name,
    path: `assets/tiles/frlg/${category}/${file}`,
    width: opts?.w ?? 1,
    height: opts?.h ?? 1,
    tileSize: 16,
    collision: opts?.collision ?? false,
    destructible: opts?.destructible ?? false,
  };
}

function pmd(
  tileset: string,
  file: string,
  name: string,
  opts?: { collision?: boolean },
): EditorTile {
  const base = file.replace('.png', '');
  const category: TileCategory = file.includes('water') ? 'water'
    : file.includes('wall') ? 'nature'
    : 'ground';
  return {
    id: `pmd:${tileset}-${base}`,
    source: 'pmd',
    category,
    name,
    path: `assets/tiles/pmd/${tileset}/${file}`,
    width: 1,
    height: 1,
    tileSize: 24,
    collision: opts?.collision ?? false,
    destructible: false,
  };
}

// ── EDITOR_TILES — Full Registry ──────────────────────────────────────

export const EDITOR_TILES: readonly EditorTile[] = [
  // ═══════════════════════════════════════════════════════════════════
  // EMERALD (16x16)
  // ═══════════════════════════════════════════════════════════════════

  // ground/
  emerald('ground', 'grass-light.png', 'Grass Light'),
  emerald('ground', 'grass-dark.png', 'Grass Dark'),
  emerald('ground', 'grass-flower.png', 'Grass Flower'),
  emerald('ground', 'dirt.png', 'Dirt'),
  emerald('ground', 'sand.png', 'Sand'),
  emerald('ground', 'path.png', 'Path'),
  emerald('ground', 'city-floor.png', 'City Floor'),
  emerald('ground', 'ledge.png', 'Ledge', { collision: true }),

  // water/
  emerald('water', 'deep.png', 'Deep Water', { collision: true }),
  emerald('water', 'shallow.png', 'Shallow Water'),
  emerald('water', 'edge-n.png', 'Water Edge N'),
  emerald('water', 'edge-s.png', 'Water Edge S'),
  emerald('water', 'edge-e.png', 'Water Edge E'),
  emerald('water', 'edge-w.png', 'Water Edge W'),
  emerald('water', 'waterfall.png', 'Waterfall', { collision: true }),

  // nature/
  emerald('nature', 'tree.png', 'Tree', { collision: true }),
  emerald('nature', 'tree-large.png', 'Tree Large', { w: 2, h: 2, collision: true }),
  emerald('nature', 'bush.png', 'Bush', { destructible: true }),
  emerald('nature', 'rock.png', 'Rock', { collision: true }),
  emerald('nature', 'rock-small.png', 'Rock Small', { collision: true }),
  emerald('nature', 'fence-h.png', 'Fence H', { collision: true }),
  emerald('nature', 'fence-v.png', 'Fence V', { collision: true }),
  emerald('nature', 'stump.png', 'Stump', { collision: true }),
  emerald('nature', 'tall-grass.png', 'Tall Grass', { destructible: true }),

  // buildings/
  emerald('buildings', 'pokecenter.png', 'PokeCenter', { w: 3, h: 2, collision: true }),
  emerald('buildings', 'mart.png', 'Mart', { w: 2, h: 2, collision: true }),
  emerald('buildings', 'house.png', 'House', { w: 2, h: 2, collision: true }),
  emerald('buildings', 'gym.png', 'Gym', { w: 3, h: 3, collision: true }),
  emerald('buildings', 'door.png', 'Door'),
  emerald('buildings', 'window.png', 'Window', { collision: true }),
  emerald('buildings', 'roof-red.png', 'Roof Red', { collision: true }),
  emerald('buildings', 'roof-blue.png', 'Roof Blue', { collision: true }),

  // decoration/
  emerald('decoration', 'flowers.png', 'Flowers'),
  emerald('decoration', 'sign.png', 'Sign', { collision: true }),
  emerald('decoration', 'lamppost.png', 'Lamppost', { collision: true }),
  emerald('decoration', 'mailbox.png', 'Mailbox', { collision: true }),
  emerald('decoration', 'bench.png', 'Bench', { collision: true }),
  emerald('decoration', 'pokeball.png', 'Pokeball'),
  emerald('decoration', 'berry-plant.png', 'Berry Plant', { destructible: true }),
  emerald('decoration', 'stairs.png', 'Stairs'),

  // ═══════════════════════════════════════════════════════════════════
  // FRLG (16x16)
  // ═══════════════════════════════════════════════════════════════════

  // ground/
  frlg('ground', 'grass-light.png', 'Grass Light'),
  frlg('ground', 'grass-dark.png', 'Grass Dark'),
  frlg('ground', 'grass-flower.png', 'Grass Flower'),
  frlg('ground', 'dirt.png', 'Dirt'),
  frlg('ground', 'sand.png', 'Sand'),
  frlg('ground', 'path.png', 'Path'),
  frlg('ground', 'city-floor.png', 'City Floor'),
  frlg('ground', 'ledge.png', 'Ledge', { collision: true }),

  // water/
  frlg('water', 'deep.png', 'Deep Water', { collision: true }),
  frlg('water', 'shallow.png', 'Shallow Water'),
  frlg('water', 'edge-n.png', 'Water Edge N'),
  frlg('water', 'edge-s.png', 'Water Edge S'),
  frlg('water', 'edge-e.png', 'Water Edge E'),
  frlg('water', 'edge-w.png', 'Water Edge W'),
  frlg('water', 'waterfall.png', 'Waterfall', { collision: true }),

  // nature/
  frlg('nature', 'tree.png', 'Tree', { collision: true }),
  frlg('nature', 'tree-large.png', 'Tree Large', { w: 2, h: 2, collision: true }),
  frlg('nature', 'bush.png', 'Bush', { destructible: true }),
  frlg('nature', 'rock.png', 'Rock', { collision: true }),
  frlg('nature', 'rock-small.png', 'Rock Small', { collision: true }),
  frlg('nature', 'fence-h.png', 'Fence H', { collision: true }),
  frlg('nature', 'fence-v.png', 'Fence V', { collision: true }),
  frlg('nature', 'stump.png', 'Stump', { collision: true }),
  frlg('nature', 'tall-grass.png', 'Tall Grass', { destructible: true }),

  // buildings/
  frlg('buildings', 'pokecenter.png', 'PokeCenter', { w: 3, h: 2, collision: true }),
  frlg('buildings', 'mart.png', 'Mart', { w: 3, h: 2, collision: true }),
  frlg('buildings', 'house.png', 'House', { w: 2, h: 2, collision: true }),
  frlg('buildings', 'gym.png', 'Gym', { w: 3, h: 2, collision: true }),

  // decoration/
  frlg('decoration', 'flowers.png', 'Flowers'),
  frlg('decoration', 'sign.png', 'Sign', { collision: true }),
  frlg('decoration', 'lamppost.png', 'Lamppost', { collision: true }),
  frlg('decoration', 'mailbox.png', 'Mailbox', { collision: true }),
  frlg('decoration', 'bench.png', 'Bench', { collision: true }),
  frlg('decoration', 'pokeball.png', 'Pokeball'),
  frlg('decoration', 'berry-plant.png', 'Berry Plant', { destructible: true }),
  frlg('decoration', 'stairs.png', 'Stairs'),

  // ═══════════════════════════════════════════════════════════════════
  // PMD (24x24) — 4 tilesets, 4 tiles each
  // ═══════════════════════════════════════════════════════════════════

  // Lush Prairie
  pmd('lush-prairie', 'floor-1.png', 'LP Floor'),
  pmd('lush-prairie', 'floor-2.png', 'LP Floor Alt'),
  pmd('lush-prairie', 'water.png', 'LP Water'),
  pmd('lush-prairie', 'wall.png', 'LP Wall', { collision: true }),

  // Mystifying Forest
  pmd('mystifying-forest', 'floor-1.png', 'MF Floor'),
  pmd('mystifying-forest', 'floor-2.png', 'MF Floor Alt'),
  pmd('mystifying-forest', 'water.png', 'MF Water'),
  pmd('mystifying-forest', 'wall.png', 'MF Wall', { collision: true }),

  // Beach Cave
  pmd('beach-cave', 'floor-1.png', 'BC Floor'),
  pmd('beach-cave', 'floor-2.png', 'BC Floor Alt'),
  pmd('beach-cave', 'water.png', 'BC Water'),
  pmd('beach-cave', 'wall.png', 'BC Wall', { collision: true }),

  // Forest Path
  pmd('forest-path', 'floor-1.png', 'FP Floor'),
  pmd('forest-path', 'floor-2.png', 'FP Floor Alt'),
  pmd('forest-path', 'water.png', 'FP Water'),
  pmd('forest-path', 'wall.png', 'FP Wall', { collision: true }),
] as const;

// ── Lookup Functions ──────────────────────────────────────────────────

const tileById = new Map<string, EditorTile>();
for (const tile of EDITOR_TILES) {
  tileById.set(tile.id, tile);
}

export function getTileById(id: string): EditorTile | undefined {
  return tileById.get(id);
}

export function getTilesBySource(source: TileSource): readonly EditorTile[] {
  return EDITOR_TILES.filter(t => t.source === source);
}

export function getTilesByCategory(category: TileCategory): readonly EditorTile[] {
  return EDITOR_TILES.filter(t => t.category === category);
}

export function getTilesBySourceAndCategory(
  source: TileSource,
  category: TileCategory,
): readonly EditorTile[] {
  return EDITOR_TILES.filter(t => t.source === source && t.category === category);
}
