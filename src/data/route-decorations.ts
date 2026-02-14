/**
 * Route Theme — Coast-specific tile variants and decoration objects.
 *
 * Only loaded/used when tileThemeId === 'route' (Phase 2 — Kanto Coast).
 * Zero impact on other themes.
 */
import type { BiomeHint } from '../utils/map-noise';
import { hash } from '../utils/map-noise';

// ─── Variant Rules ──────────────────────────────────────────────────

interface VariantRule {
  readonly variants: readonly string[];
  readonly weight: number; // 0-1, chance of substitution per tile
}

/** Pre-built map for O(1) lookup in the hot tile loop */
const VARIANT_MAP = new Map<BiomeHint, VariantRule>([
  ['grassLight',  { variants: ['rv-grass-v2', 'rv-grass-v3'],                            weight: 0.30 }],
  ['grassDark',   { variants: ['rv-grass-v2', 'rv-grass-v3'],                            weight: 0.15 }],
  ['dirt',        { variants: ['rv-dirt-v2', 'rv-dirt-woven', 'rv-dirt-dark'],            weight: 0.30 }],
  ['path',        { variants: ['rv-stone-checker', 'rv-stone-herring', 'rv-cobble'],     weight: 0.40 }],
  ['rock',        { variants: ['rv-stone-gray', 'rv-cobble', 'rv-dirt-dark'],            weight: 0.25 }],
  ['water',       { variants: ['rv-water-deep', 'rv-water-solid'],                       weight: 0.20 }],
  ['waterEdge',   { variants: ['rv-sand-light', 'rv-sand-v2', 'rv-sand-v3'],             weight: 0.50 }],
]);

/**
 * Deterministic variant substitution for 'route' theme tiles.
 * Uses hash with offset seeds to avoid correlation with biome noise.
 */
export function resolveRouteVariant(
  hint: BiomeHint,
  baseKey: string,
  col: number,
  row: number,
): string {
  const rule = VARIANT_MAP.get(hint);
  if (!rule) return baseKey;

  const h = hash(col * 7 + 31, row * 13 + 17);
  if (h > rule.weight) return baseKey;

  const idx = Math.floor(hash(col + 1000, row + 1000) * rule.variants.length);
  return rule.variants[idx];
}

// ─── Variant Asset List (for BootScene loading) ─────────────────────

/** Collect all unique variant texture keys + filenames */
export const ROUTE_VARIANT_ASSETS: readonly { key: string; file: string }[] = (() => {
  const seen = new Set<string>();
  const list: { key: string; file: string }[] = [];
  for (const [, rule] of VARIANT_MAP) {
    for (const vk of rule.variants) {
      if (seen.has(vk)) continue;
      seen.add(vk);
      list.push({ key: vk, file: `${vk.replace('rv-', '')}.png` });
    }
  }
  return list;
})();

// ─── Decoration Definitions ─────────────────────────────────────────

export interface RouteDecorationDef {
  readonly key: string;
  readonly path: string;
  readonly biomeAffinity: readonly BiomeHint[];
  readonly depthLayer: 1 | 2;
  readonly originY: number;
  readonly scale: number;
}

const GRASS_BIOMES: readonly BiomeHint[] = ['grassLight', 'grassDark', 'grassFlower'];

export const ROUTE_DECORATION_DEFS: readonly RouteDecorationDef[] = [
  // ── Trees (depth 2, Y-sorted) ──────────────────────────────────
  { key: 'rdeco-tree-round-green',   path: 'assets/tiles/route/objects/trees/tree-round-green.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-round-dark',    path: 'assets/tiles/route/objects/trees/tree-round-dark.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-round-light',   path: 'assets/tiles/route/objects/trees/tree-round-light.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-round2-green',  path: 'assets/tiles/route/objects/trees/tree-round2-green.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-pointy-green',  path: 'assets/tiles/route/objects/trees/tree-pointy-green.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-pointy-dark',   path: 'assets/tiles/route/objects/trees/tree-pointy-dark.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-med-green',     path: 'assets/tiles/route/objects/trees/tree-med-green.png',
    biomeAffinity: ['tree', ...GRASS_BIOMES], depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-tall-green',    path: 'assets/tiles/route/objects/trees/tree-tall-green.png',
    biomeAffinity: ['tree', ...GRASS_BIOMES], depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-pine-green',    path: 'assets/tiles/route/objects/trees/tree-pine-green.png',
    biomeAffinity: ['tree', 'grassDark'], depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-fir-green',     path: 'assets/tiles/route/objects/trees/tree-fir-green.png',
    biomeAffinity: ['tree', 'grassDark'], depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-autumn-red',    path: 'assets/tiles/route/objects/trees/tree-autumn-red.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },
  { key: 'rdeco-tree-autumn-orange', path: 'assets/tiles/route/objects/trees/tree-autumn-orange.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.95, scale: 1.0 },

  // ── Vegetation (depth 2 for bushes/hedges, depth 1 for ground items) ─
  { key: 'rdeco-bush-green',         path: 'assets/tiles/route/objects/vegetation/bush-green.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-bush-light',         path: 'assets/tiles/route/objects/vegetation/bush-light.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-bush-leafy',         path: 'assets/tiles/route/objects/vegetation/bush-leafy.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-bush-cone',          path: 'assets/tiles/route/objects/vegetation/bush-cone.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-bush-large',         path: 'assets/tiles/route/objects/vegetation/bush-large.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-pine-small-a',       path: 'assets/tiles/route/objects/vegetation/pine-small-a.png',
    biomeAffinity: ['tree', 'grassDark', 'dirt'], depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-pine-small-b',       path: 'assets/tiles/route/objects/vegetation/pine-small-b.png',
    biomeAffinity: ['tree', 'grassDark', 'dirt'], depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-cactus',             path: 'assets/tiles/route/objects/vegetation/cactus.png',
    biomeAffinity: ['waterEdge', 'dirt'], depthLayer: 2, originY: 0.9, scale: 1.0 },
  { key: 'rdeco-stump',              path: 'assets/tiles/route/objects/vegetation/stump.png',
    biomeAffinity: [...GRASS_BIOMES, 'dirt'], depthLayer: 1, originY: 0.9, scale: 0.8 },
  { key: 'rdeco-hedge-large-green',  path: 'assets/tiles/route/objects/vegetation/hedge-large-green.png',
    biomeAffinity: ['tree', 'grassDark'], depthLayer: 2, originY: 0.9, scale: 0.8 },
  { key: 'rdeco-hedge-large-light',  path: 'assets/tiles/route/objects/vegetation/hedge-large-light.png',
    biomeAffinity: GRASS_BIOMES, depthLayer: 2, originY: 0.9, scale: 0.8 },
];

// ─── Decoration Chance per Biome ────────────────────────────────────

const DECO_CHANCE: Partial<Record<BiomeHint, number>> = {
  tree: 0.60,
  grassDark: 0.25,
  grassFlower: 0.20,
  grassLight: 0.15,
  rock: 0.15,
  dirt: 0.10,
  path: 0.05,
  waterEdge: 0.08,
  water: 0.0,
};

export function getDecorationChance(hint: BiomeHint): number {
  return DECO_CHANCE[hint] ?? 0;
}
