export interface TileTheme {
  readonly id: string;
  readonly name: string;
  readonly previewKey: string;
  readonly tileSize: number;
  readonly tiles: {
    readonly grassLight: string;
    readonly grassDark: string;
    readonly grassFlower: string;
    readonly dirt: string;
    readonly water: string;
    readonly waterEdge: string;
    readonly tree: string;
    readonly rock: string;
    readonly path: string;
  };
}

export const TILE_THEMES: readonly TileTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    previewKey: 'theme-preview-emerald',
    tileSize: 16,
    tiles: {
      grassLight: 'tile-emerald-grass-light',
      grassDark: 'tile-emerald-grass-dark',
      grassFlower: 'tile-emerald-grass-flower',
      dirt: 'tile-emerald-dirt',
      water: 'tile-emerald-water',
      waterEdge: 'tile-emerald-water-edge',
      tree: 'tile-emerald-tree',
      rock: 'tile-emerald-rock',
      path: 'tile-emerald-path',
    },
  },
  {
    id: 'frlg',
    name: 'FireRed',
    previewKey: 'theme-preview-frlg',
    tileSize: 16,
    tiles: {
      grassLight: 'tile-frlg-grass-light',
      grassDark: 'tile-frlg-grass-dark',
      grassFlower: 'tile-frlg-grass-flower',
      dirt: 'tile-frlg-dirt',
      water: 'tile-frlg-water',
      waterEdge: 'tile-frlg-water-edge',
      tree: 'tile-frlg-tree',
      rock: 'tile-frlg-rock',
      path: 'tile-frlg-path',
    },
  },
  {
    id: 'pmd',
    name: 'Mystery Dungeon',
    previewKey: 'theme-preview-pmd',
    tileSize: 24,
    tiles: {
      grassLight: 'tile-pmd-grass-light',
      grassDark: 'tile-pmd-grass-dark',
      grassFlower: 'tile-pmd-grass-flower',
      dirt: 'tile-pmd-dirt',
      water: 'tile-pmd-water',
      waterEdge: 'tile-pmd-water-edge',
      tree: 'tile-pmd-tree',
      rock: 'tile-pmd-rock',
      path: 'tile-pmd-path',
    },
  },
  {
    id: 'crystal',
    name: 'Crystal Cave',
    previewKey: 'theme-preview-crystal',
    tileSize: 24,
    tiles: {
      grassLight: 'tile-crystal-grass-light',
      grassDark: 'tile-crystal-grass-dark',
      grassFlower: 'tile-crystal-grass-flower',
      dirt: 'tile-crystal-dirt',
      water: 'tile-crystal-water',
      waterEdge: 'tile-crystal-water-edge',
      tree: 'tile-crystal-tree',
      rock: 'tile-crystal-rock',
      path: 'tile-crystal-path',
    },
  },
  {
    id: 'magma',
    name: 'Magma Cavern',
    previewKey: 'theme-preview-magma',
    tileSize: 24,
    tiles: {
      grassLight: 'tile-magma-grass-light',
      grassDark: 'tile-magma-grass-dark',
      grassFlower: 'tile-magma-grass-flower',
      dirt: 'tile-magma-dirt',
      water: 'tile-magma-water',
      waterEdge: 'tile-magma-water-edge',
      tree: 'tile-magma-tree',
      rock: 'tile-magma-rock',
      path: 'tile-magma-path',
    },
  },
  {
    id: 'sky',
    name: 'Sky Tower',
    previewKey: 'theme-preview-sky',
    tileSize: 24,
    tiles: {
      grassLight: 'tile-sky-grass-light',
      grassDark: 'tile-sky-grass-dark',
      grassFlower: 'tile-sky-grass-flower',
      dirt: 'tile-sky-dirt',
      water: 'tile-sky-water',
      waterEdge: 'tile-sky-water-edge',
      tree: 'tile-sky-tree',
      rock: 'tile-sky-rock',
      path: 'tile-sky-path',
    },
  },
  {
    id: 'dark',
    name: 'Dark Crater',
    previewKey: 'theme-preview-dark',
    tileSize: 24,
    tiles: {
      grassLight: 'tile-dark-grass-light',
      grassDark: 'tile-dark-grass-dark',
      grassFlower: 'tile-dark-grass-flower',
      dirt: 'tile-dark-dirt',
      water: 'tile-dark-water',
      waterEdge: 'tile-dark-water-edge',
      tree: 'tile-dark-tree',
      rock: 'tile-dark-rock',
      path: 'tile-dark-path',
    },
  },
] as const;

export function getThemeById(id: string): TileTheme {
  const found = TILE_THEMES.find(t => t.id === id);
  if (!found) {
    console.warn(`[tile-themes] Unknown theme ID "${id}", falling back to "${TILE_THEMES[0].id}"`);
  }
  return found ?? TILE_THEMES[0];
}
