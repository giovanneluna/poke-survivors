import Phaser from 'phaser';
import { ENEMIES, STARTERS } from '../config';
import type { SpriteConfig, Direction } from '../types';
import { DIRECTION_ROW } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;

    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 148, height / 2, 0, 16, 0xff6600);
    bar.setOrigin(0, 0.5);
    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Carregando...', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => { bar.width = 296 * value; });
    this.load.on('complete', () => { barBg.destroy(); bar.destroy(); loadingText.destroy(); });

    // Carrega starters (Charmander, Squirtle, Bulbasaur)
    for (const starter of STARTERS) {
      this.loadSpritesheet(starter.sprite);
    }
    for (const config of Object.values(ENEMIES)) {
      this.loadSpritesheet(config.sprite);
    }

    // Artwork oficial dos starters (para Title Screen)
    this.load.image('art-charmander', 'assets/artwork/charmander.png');
    this.load.image('art-squirtle', 'assets/artwork/squirtle.png');
    this.load.image('art-bulbasaur', 'assets/artwork/bulbasaur.png');
  }

  private loadSpritesheet(sprite: SpriteConfig): void {
    this.load.spritesheet(sprite.key, sprite.path, {
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
    });
  }

  create(): void {
    for (const starter of STARTERS) {
      this.createWalkAnims(starter.sprite);
    }
    for (const config of Object.values(ENEMIES)) {
      this.createWalkAnims(config.sprite);
    }
    this.generateTextures();
    this.scene.start('TitleScene');
  }

  private createWalkAnims(sprite: SpriteConfig): void {
    const directions: Direction[] = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'];
    for (const dir of directions) {
      const row = DIRECTION_ROW[dir];
      const startFrame = row * sprite.frameCount;
      const endFrame = startFrame + sprite.frameCount - 1;
      this.anims.create({
        key: `${sprite.key}-${dir}`,
        frames: this.anims.generateFrameNumbers(sprite.key, { start: startFrame, end: endFrame }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  private generateTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const T = 24;

    // ── Tiles do mapa ───────────────────────────────────────────
    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x68ab55, 0.5); g.fillRect(4, 6, 2, 3); g.fillRect(14, 12, 2, 3); g.fillRect(9, 18, 2, 3);
    g.generateTexture('tile-grass-1', T, T);

    g.clear(); g.fillStyle(0x4e8c40); g.fillRect(0, 0, T, T);
    g.fillStyle(0x5a9a4c, 0.5); g.fillRect(6, 4, 2, 3); g.fillRect(16, 16, 2, 3);
    g.generateTexture('tile-grass-2', T, T);

    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0xff6688); g.fillRect(5, 5, 2, 2);
    g.fillStyle(0xffee44); g.fillRect(15, 10, 2, 2);
    g.fillStyle(0xffffff); g.fillRect(10, 18, 2, 2);
    g.fillStyle(0x88bbff); g.fillRect(19, 3, 2, 2);
    g.generateTexture('tile-flowers', T, T);

    g.clear(); g.fillStyle(0x9b7653); g.fillRect(0, 0, T, T);
    g.fillStyle(0x8a6744, 0.5); g.fillRect(3, 8, 3, 2); g.fillRect(14, 4, 4, 2);
    g.generateTexture('tile-dirt', T, T);

    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x888888); g.fillCircle(12, 14, 4);
    g.fillStyle(0xaaaaaa, 0.6); g.fillCircle(11, 13, 2);
    g.generateTexture('tile-rock', T, T);

    g.clear(); g.fillStyle(0x3388cc); g.fillRect(0, 0, T, T);
    g.fillStyle(0x55aaee, 0.4); g.fillRect(2, 8, 8, 2); g.fillRect(12, 16, 6, 2);
    g.generateTexture('tile-water', T, T);

    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x6b4226); g.fillRect(9, 12, 6, 12);
    g.fillStyle(0x2d7a2d); g.fillCircle(12, 8, 10);
    g.fillStyle(0x3d8a3d, 0.6); g.fillCircle(10, 6, 6);
    g.generateTexture('tile-tree', T, T);

    // ── Projéteis do player ──────────────────────────────────────
    g.clear(); g.fillStyle(0xff6600); g.fillCircle(6, 6, 6);
    g.fillStyle(0xffcc00, 0.8); g.fillCircle(6, 6, 3);
    g.generateTexture('ember-projectile', 12, 12);

    g.clear(); g.fillStyle(0xff4400); g.fillCircle(5, 5, 5);
    g.fillStyle(0xffaa00, 0.8); g.fillCircle(5, 5, 3);
    g.generateTexture('fire-orb', 10, 10);

    g.clear(); g.fillStyle(0xff6600); g.fillCircle(3, 3, 3);
    g.generateTexture('fire-particle', 6, 6);

    // Inferno projectile (maior, mais intenso)
    g.clear(); g.fillStyle(0xff2200); g.fillCircle(8, 8, 8);
    g.fillStyle(0xff6600, 0.8); g.fillCircle(8, 8, 5);
    g.fillStyle(0xffcc00, 0.6); g.fillCircle(8, 8, 3);
    g.generateTexture('inferno-projectile', 16, 16);

    // ── Projéteis inimigos ───────────────────────────────────────
    // Shadow Ball (Gastly) - roxo escuro
    g.clear(); g.fillStyle(0x6622aa); g.fillCircle(6, 6, 6);
    g.fillStyle(0x9944dd, 0.7); g.fillCircle(6, 6, 3);
    g.fillStyle(0xcc88ff, 0.4); g.fillCircle(5, 4, 2);
    g.generateTexture('shadow-ball', 12, 12);

    // Rock Throw (Geodude) - pedra marrom
    g.clear(); g.fillStyle(0x888888); g.fillCircle(5, 5, 5);
    g.fillStyle(0xaaaaaa, 0.6); g.fillCircle(4, 3, 3);
    g.fillStyle(0x666666, 0.5); g.fillCircle(6, 7, 2);
    g.generateTexture('rock-throw', 10, 10);

    // Supersonic wave (Zubat) - onda azul
    g.clear(); g.fillStyle(0x44aaff, 0.6); g.fillCircle(6, 6, 6);
    g.fillStyle(0x88ccff, 0.4); g.fillCircle(6, 6, 4);
    g.fillStyle(0xcceeFF, 0.3); g.fillCircle(6, 6, 2);
    g.generateTexture('supersonic-wave', 12, 12);

    // ── XP Gem ───────────────────────────────────────────────────
    g.clear(); g.fillStyle(0x44bbff);
    g.fillTriangle(5, 0, 10, 5, 5, 10); g.fillTriangle(5, 0, 0, 5, 5, 10);
    g.generateTexture('xp-gem', 10, 10);

    // ── Sombra ───────────────────────────────────────────────────
    g.clear(); g.fillStyle(0x000000, 0.25); g.fillEllipse(8, 4, 16, 8);
    g.generateTexture('shadow', 16, 8);

    // ── Objetos destrutíveis ─────────────────────────────────────
    // Tall Grass - moita de grama alta
    g.clear(); g.fillStyle(0x3d8a3d);
    g.fillRect(2, 8, 4, 12); g.fillRect(7, 5, 4, 15); g.fillRect(12, 7, 4, 13);
    g.fillStyle(0x4da04d); g.fillRect(4, 3, 3, 8); g.fillRect(10, 2, 3, 7);
    g.fillStyle(0x2d7a2d); g.fillRect(6, 6, 2, 10);
    g.generateTexture('dest-tall-grass', 18, 20);

    // Berry Bush - arbusto com frutinhas
    g.clear(); g.fillStyle(0x2d7a2d); g.fillCircle(10, 12, 9);
    g.fillStyle(0x3d8a3d, 0.7); g.fillCircle(8, 10, 6);
    g.fillStyle(0xff3344); g.fillCircle(6, 9, 2); g.fillCircle(13, 8, 2); g.fillCircle(10, 14, 2);
    g.fillStyle(0xff5566, 0.8); g.fillCircle(4, 12, 1.5);
    g.generateTexture('dest-berry-bush', 20, 20);

    // Rock - pedra grande quebrável
    g.clear(); g.fillStyle(0x777777); g.fillCircle(10, 10, 9);
    g.fillStyle(0x999999, 0.6); g.fillCircle(8, 7, 5);
    g.fillStyle(0x555555); g.fillRect(6, 10, 8, 2);
    g.fillStyle(0xaaaaaa, 0.3); g.fillCircle(7, 6, 2);
    g.generateTexture('dest-rock', 20, 20);

    // Treasure Chest - baú dourado
    g.clear();
    g.fillStyle(0x8B6914); g.fillRect(2, 6, 16, 12);
    g.fillStyle(0xDAA520); g.fillRect(3, 7, 14, 4);
    g.fillStyle(0xFFD700); g.fillRect(7, 5, 6, 3);
    g.fillStyle(0xFFE44D, 0.5); g.fillRect(8, 6, 4, 1);
    g.fillStyle(0x6B4226); g.fillRect(2, 11, 16, 1);
    g.generateTexture('dest-chest', 20, 18);

    // ── Pickups ──────────────────────────────────────────────────
    // Oran Berry - bolinha azul
    g.clear(); g.fillStyle(0x4488ff); g.fillCircle(5, 5, 5);
    g.fillStyle(0x66aaff, 0.7); g.fillCircle(4, 3, 2);
    g.fillStyle(0x338833); g.fillRect(4, 0, 2, 2);
    g.generateTexture('pickup-oran', 10, 10);

    // Magnet Burst - ímã
    g.clear(); g.fillStyle(0xcc0000); g.fillRect(1, 1, 4, 8);
    g.fillStyle(0x0000cc); g.fillRect(7, 1, 4, 8);
    g.fillStyle(0xcccccc); g.fillRect(4, 1, 4, 3);
    g.generateTexture('pickup-magnet', 12, 10);

    // Rare Candy - diamante dourado
    g.clear(); g.fillStyle(0xFFD700);
    g.fillTriangle(6, 0, 12, 6, 6, 12); g.fillTriangle(6, 0, 0, 6, 6, 12);
    g.fillStyle(0xFFE44D, 0.6); g.fillTriangle(6, 2, 10, 6, 6, 10);
    g.generateTexture('pickup-candy', 12, 12);

    // Pokéball Bomb - pokébola
    g.clear(); g.fillStyle(0xff0000); g.fillCircle(6, 6, 6);
    g.fillStyle(0xffffff); g.fillRect(0, 5, 12, 3);
    g.fillStyle(0xffffff); g.fillCircle(6, 6, 6);
    g.fillStyle(0xff0000); g.fillCircle(6, 3, 5);
    g.fillStyle(0x333333); g.fillRect(0, 5, 12, 2);
    g.fillStyle(0xffffff); g.fillCircle(6, 6, 2);
    g.fillStyle(0x333333); g.fillCircle(6, 6, 1);
    g.generateTexture('pickup-bomb', 12, 12);

    // Held Items textures
    // Charcoal
    g.clear(); g.fillStyle(0x333333); g.fillCircle(6, 6, 5);
    g.fillStyle(0xff4400, 0.6); g.fillCircle(5, 4, 2);
    g.fillStyle(0xff6600, 0.4); g.fillCircle(7, 7, 1.5);
    g.generateTexture('held-charcoal', 12, 12);

    // Wide Lens
    g.clear(); g.fillStyle(0x88ccff, 0.8); g.fillCircle(6, 6, 5);
    g.fillStyle(0xaaddff, 0.5); g.fillCircle(6, 6, 3);
    g.fillStyle(0xcccccc); g.fillRect(10, 5, 3, 2);
    g.generateTexture('held-wide-lens', 14, 12);

    // Choice Specs
    g.clear(); g.fillStyle(0xaa44ff); g.fillCircle(4, 5, 3); g.fillCircle(10, 5, 3);
    g.fillStyle(0xcc66ff, 0.5); g.fillCircle(4, 4, 1.5); g.fillCircle(10, 4, 1.5);
    g.fillStyle(0x666666); g.fillRect(6, 4, 3, 1);
    g.generateTexture('held-choice-specs', 14, 10);

    // ── Shards para Title Screen ──────────────────────────────────
    // Shard vermelho (fogo)
    g.clear(); g.fillStyle(0xff4400);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0xff6600, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-fire', 10, 8);

    // Shard azul (água)
    g.clear(); g.fillStyle(0x4488ff);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0x66aaff, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-water', 10, 8);

    // Shard verde (planta)
    g.clear(); g.fillStyle(0x44bb44);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0x66dd66, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-grass', 10, 8);

    // Shard dourado
    g.clear(); g.fillStyle(0xFFD700);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0xFFE44D, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-gold', 10, 8);

    g.destroy();
  }
}
