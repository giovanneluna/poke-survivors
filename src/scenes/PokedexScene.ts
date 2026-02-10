import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { getSaveData, getPokedexCount, getPokedexTotal, initSaveSystem } from '../systems/SaveSystem';
import { ENEMIES } from '../config';
import { ENEMY_TYPES } from '../data/type-chart';
import { fontSize, scaled } from '../utils/ui-scale';
import type { EnemyType } from '../types';

// ── Color by element type ─────────────────────────────────────────
const TYPE_COLORS: Record<string, number> = {
  fire: 0xff6622, water: 0x4488ff, grass: 0x44bb44, ice: 0x66ccee,
  normal: 0xaaaaaa, dragon: 0x7744ff, flying: 0x8899ff, fighting: 0xbb3322,
  poison: 0x9944cc, ground: 0xcc9944, rock: 0xbbaa66, ghost: 0x664488,
  psychic: 0xff4488, bug: 0x88aa22, dark: 0x554444,
};

export class PokedexScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PokedexScene' });
  }

  create(): void {
    initSaveSystem();
    const { width, height } = this.cameras.main;
    const save = getSaveData();
    const discovered = getPokedexCount();
    const total = getPokedexTotal();

    // ── Background ─────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f23);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

    // ── Header ─────────────────────────────────────────────────────
    this.add.text(width / 2, scaled(28), 'POKÉDEX', {
      fontSize: fontSize(24), color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: scaled(4),
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, scaled(52), `${discovered} / ${total} Descobertos`, {
      fontSize: fontSize(12), color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: scaled(3),
    }).setOrigin(0.5).setDepth(10);

    // ── Progress bar ──────────────────────────────────────────────
    const barW = scaled(200);
    const barH = scaled(8);
    const barX = width / 2 - barW / 2;
    const barY = scaled(66);
    const progressGfx = this.add.graphics().setDepth(10);
    const barRadius = scaled(4);
    progressGfx.fillStyle(0x333355, 1);
    progressGfx.fillRoundedRect(barX, barY, barW, barH, barRadius);
    const fillW = Math.max(0, (discovered / total) * barW);
    if (fillW > 0) {
      progressGfx.fillStyle(0xff4444, 1);
      progressGfx.fillRoundedRect(barX, barY, fillW, barH, barRadius);
    }

    // ── Build all enemy keys (ordered) ────────────────────────────
    const allKeys = Object.keys(ENEMY_TYPES) as EnemyType[];

    // ── Grid layout ───────────────────────────────────────────────
    const cols = Math.min(8, Math.floor((width - 40) / scaled(75)));
    const cellW = scaled(70);
    const cellH = scaled(80);
    const gapX = scaled(6);
    const gapY = scaled(6);
    const totalGridW = cols * cellW + (cols - 1) * gapX;
    const startX = (width - totalGridW) / 2;
    const startY = scaled(86);

    const container = this.add.container(0, 0).setDepth(5);

    allKeys.forEach((key, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cellW + gapX) + cellW / 2;
      const cy = startY + row * (cellH + gapY) + cellH / 2;

      const entry = save.pokedex[key];
      const isUnlocked = !!entry;
      const enemyConfig = ENEMIES[key];
      const elemType = ENEMY_TYPES[key] ?? 'normal';
      const typeColor = TYPE_COLORS[elemType] ?? 0xaaaaaa;

      // ── Card background ─────────────────────────────────────────
      const cardRadius = scaled(6);
      const gfx = this.add.graphics();
      gfx.fillStyle(0x000000, 0.4);
      gfx.fillRoundedRect(cx - cellW / 2 + 2, cy - cellH / 2 + 2, cellW, cellH, cardRadius);
      gfx.fillStyle(isUnlocked ? 0x1a1a44 : 0x111122, 0.95);
      gfx.fillRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, cardRadius);
      gfx.lineStyle(1, isUnlocked ? typeColor : 0x222244, 0.7);
      gfx.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, cardRadius);
      container.add(gfx);

      if (isUnlocked && enemyConfig) {
        // ── Sprite ──────────────────────────────────────────────
        const spriteKey = enemyConfig.sprite.key;
        if (this.textures.exists(spriteKey)) {
          const sprite = this.add.sprite(cx, cy - scaled(12), spriteKey, 0)
            .setScale(Math.min(1.5, scaled(30) / enemyConfig.sprite.frameHeight))
            .setDepth(6);
          container.add(sprite);

          // Play walk animation if exists
          const animKey = `${spriteKey}-walk-down`;
          if (this.anims.exists(animKey)) {
            sprite.play(animKey);
          }
        }

        // ── Name ────────────────────────────────────────────────
        const name = enemyConfig.name ?? key.charAt(0).toUpperCase() + key.slice(1);
        container.add(this.add.text(cx, cy + scaled(18), name, {
          fontSize: fontSize(8), color: '#ffffff', fontFamily: 'monospace',
          stroke: '#000000', strokeThickness: scaled(2),
        }).setOrigin(0.5).setDepth(6));

        // ── Type badge ──────────────────────────────────────────
        const badgeGfx = this.add.graphics().setDepth(6);
        badgeGfx.fillStyle(typeColor, 0.8);
        badgeGfx.fillRoundedRect(cx - scaled(18), cy + scaled(27), scaled(36), scaled(10), scaled(3));
        container.add(badgeGfx);
        container.add(this.add.text(cx, cy + scaled(32), elemType.toUpperCase(), {
          fontSize: fontSize(6), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(7));

        // ── Kill count ──────────────────────────────────────────
        container.add(this.add.text(cx + cellW / 2 - scaled(5), cy - cellH / 2 + scaled(4), `×${entry.timesDefeated}`, {
          fontSize: fontSize(7), color: '#ffcc00', fontFamily: 'monospace',
          stroke: '#000000', strokeThickness: scaled(2),
        }).setOrigin(1, 0).setDepth(7));
      } else {
        // ── Silhouette (unknown) ────────────────────────────────
        container.add(this.add.text(cx, cy - scaled(5), '?', {
          fontSize: fontSize(28), color: '#222244', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(6));

        container.add(this.add.text(cx, cy + scaled(22), '???', {
          fontSize: fontSize(8), color: '#333355', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(6));
      }
    });

    // ── Botão Voltar ──────────────────────────────────────────────
    const btnW = scaled(160);
    const btnH = scaled(36);
    const btnY = height - scaled(35);

    const btnGfx = this.add.graphics().setDepth(10);
    const btnRadius = scaled(8);
    const drawBtn = (hover: boolean): void => {
      btnGfx.clear();
      btnGfx.fillStyle(0x000000, 0.4);
      btnGfx.fillRoundedRect(width / 2 - btnW / 2 + 2, btnY - btnH / 2 + 3, btnW, btnH, btnRadius);
      btnGfx.fillStyle(hover ? 0x555577 : 0x333355, 0.95);
      btnGfx.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, btnRadius);
      btnGfx.lineStyle(2, hover ? 0x8888aa : 0x555577);
      btnGfx.strokeRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, btnRadius);
    };
    drawBtn(false);

    const btnText = this.add.text(width / 2, btnY, '<- VOLTAR', {
      fontSize: fontSize(14), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: scaled(2),
    }).setOrigin(0.5).setDepth(11);

    const btnHit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(12);

    btnHit.on('pointerover', () => { drawBtn(true); btnText.setColor('#ffcc00'); SoundManager.playHover(); });
    btnHit.on('pointerout', () => { drawBtn(false); btnText.setColor('#ffffff'); });
    btnHit.on('pointerdown', () => { SoundManager.playClick(); this.scene.start('TitleScene'); });

    // ── Fade in ───────────────────────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
