import Phaser from 'phaser';
import { SPRITES, ENEMIES } from '../config';
import type { SpriteConfig, Direction } from '../types';
import { DIRECTION_ROW } from '../types';

/**
 * BootScene: carrega spritesheets PMDCollab, gera tiles procedurais
 * e cria animações walk por direção para cada Pokémon.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;

    // ── Barra de loading ─────────────────────────────────────────
    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 148, height / 2, 0, 16, 0xff6600);
    bar.setOrigin(0, 0.5);
    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Carregando...', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => { bar.width = 296 * value; });
    this.load.on('complete', () => { barBg.destroy(); bar.destroy(); loadingText.destroy(); });

    // ── Spritesheets PMDCollab ────────────────────────────────────
    // Player
    this.loadSpritesheet(SPRITES.charmander);

    // Enemies
    for (const config of Object.values(ENEMIES)) {
      this.loadSpritesheet(config.sprite);
    }
  }

  private loadSpritesheet(sprite: SpriteConfig): void {
    this.load.spritesheet(sprite.key, sprite.path, {
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
    });
  }

  create(): void {
    // ── Criar animações para cada Pokémon ────────────────────────
    this.createWalkAnims(SPRITES.charmander);
    for (const config of Object.values(ENEMIES)) {
      this.createWalkAnims(config.sprite);
    }

    // ── Gerar texturas procedurais ───────────────────────────────
    this.generateTextures();

    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  /**
   * Cria animações walk-{dir} para um spritesheet PMDCollab.
   * Layout: rows = 8 direções, cols = N frames.
   */
  private createWalkAnims(sprite: SpriteConfig): void {
    const directions: Direction[] = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'];

    for (const dir of directions) {
      const row = DIRECTION_ROW[dir];
      const startFrame = row * sprite.frameCount;
      const endFrame = startFrame + sprite.frameCount - 1;

      this.anims.create({
        key: `${sprite.key}-${dir}`,
        frames: this.anims.generateFrameNumbers(sprite.key, {
          start: startFrame,
          end: endFrame,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  private generateTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const T = 24; // tile size

    // ── Grama clara ────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x5b9e4a);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0x68ab55, 0.5);
    g.fillRect(4, 6, 2, 3);
    g.fillRect(14, 12, 2, 3);
    g.fillRect(9, 18, 2, 3);
    g.generateTexture('tile-grass-1', T, T);

    // ── Grama escura ───────────────────────────────────────────
    g.clear();
    g.fillStyle(0x4e8c40);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0x5a9a4c, 0.5);
    g.fillRect(6, 4, 2, 3);
    g.fillRect(16, 16, 2, 3);
    g.generateTexture('tile-grass-2', T, T);

    // ── Grama com flores ───────────────────────────────────────
    g.clear();
    g.fillStyle(0x5b9e4a);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0xff6688); g.fillRect(5, 5, 2, 2);
    g.fillStyle(0xffee44); g.fillRect(15, 10, 2, 2);
    g.fillStyle(0xffffff); g.fillRect(10, 18, 2, 2);
    g.fillStyle(0x88bbff); g.fillRect(19, 3, 2, 2);
    g.generateTexture('tile-flowers', T, T);

    // ── Terra ──────────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x9b7653);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0x8a6744, 0.5);
    g.fillRect(3, 8, 3, 2);
    g.fillRect(14, 4, 4, 2);
    g.generateTexture('tile-dirt', T, T);

    // ── Pedra no chão ──────────────────────────────────────────
    g.clear();
    g.fillStyle(0x5b9e4a);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0x888888);
    g.fillCircle(12, 14, 4);
    g.fillStyle(0xaaaaaa, 0.6);
    g.fillCircle(11, 13, 2);
    g.generateTexture('tile-rock', T, T);

    // ── Água ───────────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x3388cc);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0x55aaee, 0.4);
    g.fillRect(2, 8, 8, 2);
    g.fillRect(12, 16, 6, 2);
    g.generateTexture('tile-water', T, T);

    // ── Árvore (tronco) ────────────────────────────────────────
    g.clear();
    g.fillStyle(0x5b9e4a);
    g.fillRect(0, 0, T, T);
    g.fillStyle(0x6b4226);
    g.fillRect(9, 12, 6, 12);
    g.fillStyle(0x2d7a2d);
    g.fillCircle(12, 8, 10);
    g.fillStyle(0x3d8a3d, 0.6);
    g.fillCircle(10, 6, 6);
    g.generateTexture('tile-tree', T, T);

    // ── Projétil do Ember ──────────────────────────────────────
    g.clear();
    g.fillStyle(0xff6600);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xffcc00, 0.8);
    g.fillCircle(6, 6, 3);
    g.generateTexture('ember-projectile', 12, 12);

    // ── Orbe do Fire Spin ──────────────────────────────────────
    g.clear();
    g.fillStyle(0xff4400);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xffaa00, 0.8);
    g.fillCircle(5, 5, 3);
    g.generateTexture('fire-orb', 10, 10);

    // ── Partícula de fogo ──────────────────────────────────────
    g.clear();
    g.fillStyle(0xff6600);
    g.fillCircle(3, 3, 3);
    g.generateTexture('fire-particle', 6, 6);

    // ── XP Gem ─────────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x44bbff);
    g.fillTriangle(5, 0, 10, 5, 5, 10);
    g.fillTriangle(5, 0, 0, 5, 5, 10);
    g.generateTexture('xp-gem', 10, 10);

    // ── Sombra embaixo dos sprites ─────────────────────────────
    g.clear();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(8, 4, 16, 8);
    g.generateTexture('shadow', 16, 8);

    g.destroy();
  }
}
