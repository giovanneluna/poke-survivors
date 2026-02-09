import Phaser from 'phaser';

interface MiniMapData {
  readonly playerX: number;
  readonly playerY: number;
  readonly enemies: ReadonlyArray<{ x: number; y: number; active: boolean }>;
  readonly boss: { x: number; y: number } | null;
  readonly pickups: ReadonlyArray<{ x: number; y: number; active: boolean }>;
}

const MAX_ENEMY_DOTS = 50;
const MAX_PICKUP_DOTS = 20;
const UPDATE_INTERVAL = 3;

const COLOR_BG = 0x000000;
const COLOR_BORDER = 0x333366;
const COLOR_PLAYER = 0xffffff;
const COLOR_ENEMY = 0xff4444;
const COLOR_BOSS = 0xffd700;
const COLOR_PICKUP = 0x44ff44;

export class MiniMap {
  private readonly container: Phaser.GameObjects.Container;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly bg: Phaser.GameObjects.Graphics;
  private frameSkip = 0;

  private readonly mapSize: number;
  private readonly worldWidth: number;
  private readonly worldHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    worldWidth: number,
    worldHeight: number,
  ) {
    this.mapSize = size;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.bg = scene.add.graphics();
    this.bg.fillStyle(COLOR_BG, 0.5);
    this.bg.fillRect(0, 0, size, size);
    this.bg.lineStyle(1, COLOR_BORDER, 1);
    this.bg.strokeRect(0, 0, size, size);

    this.graphics = scene.add.graphics();

    this.container = scene.add.container(x, y, [this.bg, this.graphics]);
    this.container.setScrollFactor(0);
    this.container.setDepth(900);
  }

  update(data: MiniMapData): void {
    this.frameSkip++;
    if (this.frameSkip < UPDATE_INTERVAL) return;
    this.frameSkip = 0;

    const g = this.graphics;
    g.clear();

    // Pickups (green, drawn first = behind everything)
    g.fillStyle(COLOR_PICKUP, 1);
    let pickupCount = 0;
    for (let i = 0; i < data.pickups.length && pickupCount < MAX_PICKUP_DOTS; i++) {
      const p = data.pickups[i];
      if (!p.active) continue;
      g.fillCircle(this.toMapX(p.x), this.toMapY(p.y), 2);
      pickupCount++;
    }

    // Enemies (red)
    g.fillStyle(COLOR_ENEMY, 1);
    let enemyCount = 0;
    for (let i = 0; i < data.enemies.length && enemyCount < MAX_ENEMY_DOTS; i++) {
      const e = data.enemies[i];
      if (!e.active) continue;
      g.fillCircle(this.toMapX(e.x), this.toMapY(e.y), 2);
      enemyCount++;
    }

    // Boss (yellow, larger)
    if (data.boss) {
      g.fillStyle(COLOR_BOSS, 1);
      g.fillCircle(this.toMapX(data.boss.x), this.toMapY(data.boss.y), 4);
    }

    // Player (white, on top)
    g.fillStyle(COLOR_PLAYER, 1);
    g.fillCircle(this.toMapX(data.playerX), this.toMapY(data.playerY), 3);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }

  private toMapX(worldX: number): number {
    return (worldX / this.worldWidth) * this.mapSize;
  }

  private toMapY(worldY: number): number {
    return (worldY / this.worldHeight) * this.mapSize;
  }
}
