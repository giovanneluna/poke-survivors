import Phaser from 'phaser';
import { GAME, DESTRUCTIBLES } from '../config';
import type { DestructibleType } from '../types';
import { Destructible } from '../entities/Destructible';
import type { GameContext } from './GameContext';

export class WorldSystem {
  constructor(private readonly ctx: GameContext) {}

  generateWorld(): void {
    const T = GAME.tileSize;
    const cols = Math.ceil(GAME.worldWidth / T);
    const rows = Math.ceil(GAME.worldHeight / T);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const tile = this.pickTile(col, row, cols, rows);
        this.ctx.scene.add.image(col * T, row * T, tile).setOrigin(0, 0).setDepth(0);
      }
    }
  }

  spawnDestructibles(): void {
    const margin = 200;
    const max = GAME.worldWidth - margin;
    const types: { key: DestructibleType; count: number }[] = [
      { key: 'tallGrass', count: 40 },
      { key: 'berryBush', count: 15 },
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

    scene.add.particles(x, y, 'fire-particle', {
      speed: { min: 20, max: 50 }, lifespan: 500, quantity: 10,
      scale: { start: 2, end: 0 }, tint: [0xFFD700, 0xFFE44D],
      emitting: false,
    }).explode();
  }

  private pickTile(col: number, row: number, maxCols: number, maxRows: number): string {
    const edgeMargin = 3;
    if (col < edgeMargin || col >= maxCols - edgeMargin || row < edgeMargin || row >= maxRows - edgeMargin) {
      const isOuterEdge = col < 1 || col >= maxCols - 1 || row < 1 || row >= maxRows - 1;
      return isOuterEdge ? 'tile-water' : 'tile-tree';
    }
    const noise = Math.sin(col * 0.7 + row * 0.3) * Math.cos(col * 0.2 + row * 0.9);
    const rand = Math.random();
    if (noise > 0.7 && rand < 0.3) return 'tile-flowers';
    if (noise < -0.6 && rand < 0.2) return 'tile-dirt';
    if (rand < 0.02) return 'tile-rock';
    if (rand < 0.15) return 'tile-grass-2';
    return 'tile-grass-1';
  }
}
