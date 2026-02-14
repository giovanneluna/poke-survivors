import Phaser from 'phaser';
import { GAME, DESTRUCTIBLES } from '../config';
import type { DestructibleType } from '../types';
import { Destructible } from '../entities/Destructible';
import { safeExplode } from '../utils/particles';
import type { GameContext } from './GameContext';
import { getThemeById } from '../data/tile-themes';
import { pickBiomeHint } from '../utils/map-noise';
import type { BiomeHint } from '../utils/map-noise';
import type { GameMap } from '../data/maps/map-types';

/** Map from biome string names (used in map JSON) to BiomeHint keys */
const BIOME_NAME_TO_HINT: Record<string, BiomeHint> = {
  grassland: 'grassLight',
  grassLight: 'grassLight',
  grassDark: 'grassDark',
  grassFlower: 'grassFlower',
  forest: 'tree',
  tree: 'tree',
  lake: 'water',
  water: 'water',
  waterEdge: 'waterEdge',
  dirt: 'dirt',
  dirt_zone: 'dirt',
  rock: 'rock',
  path: 'path',
};

/** Tree obstacle textures loaded in BootScene */
const TREE_KEYS = [
  'tree-big-light',
  'tree-big-green',
  'tree-big-dark',
  'tree-big-vdark',
] as const;

/** Number of tree obstacles to spawn in Phase 2 */
const TREE_COUNT = 30;
/** Minimum distance between any two trees (px) */
const TREE_MIN_DIST = 120;
/** Margin from world border (px) */
const TREE_MARGIN = 250;
/** Min distance from player spawn (center of map) */
const TREE_PLAYER_SAFE = 200;

export class WorldSystem {
  constructor(private readonly ctx: GameContext) {}

  generateWorld(mapData?: GameMap | null): void {
    const theme = getThemeById(this.ctx.tileThemeId);
    const T = GAME.tileSize;
    const tileScale = theme.tileSize === 16 ? 1.5 : 1.0;

    const cols = mapData ? mapData.width : Math.ceil(GAME.worldWidth / T);
    const rows = mapData ? mapData.height : Math.ceil(GAME.worldHeight / T);

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const hint = this.resolveHint(col, row, cols, rows, mapData);
        const textureKey = theme.tiles[hint];

        this.ctx.scene.add.image(col * T, row * T, textureKey)
          .setOrigin(0, 0)
          .setDepth(0)
          .setScale(tileScale);
      }
    }
  }

  /**
   * Spawn large tree obstacles that act as walls (Phase 2 only).
   * Trees have static physics bodies — player and enemies collide with them.
   */
  spawnTreeObstacles(): void {
    if (this.ctx.stageId !== 'phase2') return;

    const W = GAME.worldWidth;
    const H = GAME.worldHeight;
    const cx = W / 2;
    const cy = H / 2;
    const placed: { x: number; y: number }[] = [];

    let attempts = 0;
    while (placed.length < TREE_COUNT && attempts < TREE_COUNT * 10) {
      attempts++;
      const x = Phaser.Math.Between(TREE_MARGIN, W - TREE_MARGIN);
      const y = Phaser.Math.Between(TREE_MARGIN, H - TREE_MARGIN);

      // Keep away from player spawn (center)
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < TREE_PLAYER_SAFE * TREE_PLAYER_SAFE) continue;

      // Keep away from other trees
      const tooClose = placed.some(p => {
        const px = x - p.x;
        const py = y - p.y;
        return px * px + py * py < TREE_MIN_DIST * TREE_MIN_DIST;
      });
      if (tooClose) continue;

      placed.push({ x, y });

      // Pick a random tree variant
      const key = TREE_KEYS[Phaser.Math.Between(0, TREE_KEYS.length - 1)];

      const tree = this.ctx.scene.physics.add.staticImage(x, y, key);
      tree.setOrigin(0.5, 0.9);
      tree.setScale(2.0);
      tree.refreshBody();
      // Depth: Y-sorted so southern trees render in front
      tree.setDepth(2 + Math.min(y / H * 0.89, 0.89));

      // Collision body: small rectangle at trunk base (~40% width, ~25% height)
      const dw = tree.displayWidth;
      const dh = tree.displayHeight;
      const bw = Math.round(dw * 0.4);
      const bh = Math.round(dh * 0.25);
      tree.body.setSize(bw, bh);
      tree.body.setOffset(Math.round((dw - bw) / 2), dh - bh);

      this.ctx.treeObstacles.add(tree);
    }
  }

  /**
   * Resolve the biome hint for a cell.
   * If mapData is provided, checks terrain data first.
   * Falls back to procedural noise.
   */
  private resolveHint(
    col: number,
    row: number,
    maxCols: number,
    maxRows: number,
    mapData?: GameMap | null,
  ): BiomeHint {
    if (mapData) {
      const key = `${col},${row}`;
      const terrainValue = mapData.terrain[key];
      if (terrainValue !== undefined) {
        // Value with source prefix (e.g. 'emerald:ground-grass-light') = exact tile ID
        if (terrainValue.includes(':')) {
          const afterColon = terrainValue.split(':')[1];
          const tileName = afterColon.replace(/^[^-]+-/, '');
          const mapped = BIOME_NAME_TO_HINT[tileName];
          if (mapped) return mapped;
          const mapped2 = BIOME_NAME_TO_HINT[afterColon];
          if (mapped2) return mapped2;
        }
        // Value is a biome name
        const mapped = BIOME_NAME_TO_HINT[terrainValue];
        if (mapped) return mapped;
      }
    }

    // Default: procedural noise
    return pickBiomeHint(col, row, maxCols, maxRows);
  }

  spawnDestructibles(): void {
    const margin = 200;
    const max = GAME.worldWidth - margin;
    const types: { key: DestructibleType; count: number }[] = [
      { key: 'tallGrass', count: 40 },
      { key: 'berryBush', count: 30 },
      { key: 'rockSmash', count: 8 },
    ];

    for (const { key, count } of types) {
      const config = DESTRUCTIBLES[key];
      for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(margin, max);
        const y = Phaser.Math.Between(margin, max);
        const dest = new Destructible(this.ctx.scene, x, y, config);
        this.ctx.destructibles.add(dest);
      }
    }
  }

  spawnChest(): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(150, 400);
    const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 200, GAME.worldWidth - 200);
    const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 200, GAME.worldHeight - 200);
    const config = DESTRUCTIBLES.treasureChest;
    const chest = new Destructible(scene, x, y, config);
    this.ctx.destructibles.add(chest);

    safeExplode(scene, x, y, 'fire-particle', {
      speed: { min: 20, max: 50 }, lifespan: 500, quantity: 10,
      scale: { start: 2, end: 0 }, tint: [0xFFD700, 0xFFE44D],
    });
  }
}
