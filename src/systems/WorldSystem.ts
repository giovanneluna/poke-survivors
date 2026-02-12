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
        // Currently we resolve it to the closest biome hint
        if (terrainValue.includes(':')) {
          // Extract the tile name after the category prefix
          // Format: 'source:category-name' e.g. 'emerald:ground-grass-light'
          const afterColon = terrainValue.split(':')[1];
          const tileName = afterColon.replace(/^[^-]+-/, '');
          // Try to map common tile names to biome hints
          const mapped = BIOME_NAME_TO_HINT[tileName];
          if (mapped) return mapped;
          // Fallback: try the full value after colon
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
