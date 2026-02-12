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
] as const;

export function getThemeById(id: string): TileTheme {
  return TILE_THEMES.find(t => t.id === id) ?? TILE_THEMES[0];
}
