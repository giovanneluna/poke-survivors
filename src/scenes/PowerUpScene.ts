import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { getCoins, getPowerUpLevel, buyPowerUp } from '../systems/SaveSystem';
import { POWER_UPS, getNextCost } from '../data/meta-progression';
import type { PowerUpDef } from '../data/meta-progression';
import { fontSize, scaled } from '../utils/ui-scale';

export class PowerUpScene extends Phaser.Scene {
  private uiContainer: Phaser.GameObjects.Container | null = null;
  private coinText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'PowerUpScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // ── Background ───────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f23);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0xffffff, 0.03);
    const gridStep = scaled(40);
    for (let x = 0; x < width; x += gridStep) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += gridStep) bg.lineBetween(0, y, width, y);

    // ── Header ──────────────────────────────────────────────────────
    this.add.text(width / 2, scaled(30), 'MELHORIAS PERMANENTES', {
      fontSize: fontSize(22),
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: scaled(4),
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, scaled(55), 'Invista moedas para ficar mais forte a cada run', {
      fontSize: fontSize(10),
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // ── Coin display ────────────────────────────────────────────────
    this.coinText = this.add.text(width - scaled(20), scaled(30), '', {
      fontSize: fontSize(16),
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: scaled(3),
    }).setOrigin(1, 0.5).setDepth(10);
    this.updateCoinDisplay();

    // ── Cards container ─────────────────────────────────────────────
    this.uiContainer = this.add.container(0, 0).setDepth(5);
    this.buildCards();

    // ── Botao VOLTAR ────────────────────────────────────────────────
    const btnW = scaled(160);
    const btnH = scaled(40);
    const btnY = height - scaled(40);

    const btnGfx = this.add.graphics().setDepth(10);
    const drawBack = (hover: boolean): void => {
      btnGfx.clear();
      btnGfx.fillStyle(0x000000, 0.4);
      btnGfx.fillRoundedRect(width / 2 - btnW / 2 + 2, btnY - btnH / 2 + 3, btnW, btnH, 8);
      btnGfx.fillStyle(hover ? 0x555577 : 0x333355, 0.95);
      btnGfx.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btnGfx.lineStyle(2, hover ? 0x8888aa : 0x555577);
      btnGfx.strokeRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    drawBack(false);

    const btnText = this.add.text(width / 2, btnY, '<- VOLTAR', {
      fontSize: fontSize(14),
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: scaled(2),
    }).setOrigin(0.5).setDepth(11);

    const btnHit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(12);

    btnHit.on('pointerover', () => {
      drawBack(true);
      btnText.setColor('#ffcc00');
      SoundManager.playHover();
    });
    btnHit.on('pointerout', () => {
      drawBack(false);
      btnText.setColor('#ffffff');
    });
    btnHit.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.start('TitleScene');
    });

    // ── Fade in ─────────────────────────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private updateCoinDisplay(): void {
    if (this.coinText) {
      this.coinText.setText(`₽ ${getCoins()}`);
    }
  }

  private buildCards(): void {
    if (!this.uiContainer) return;
    this.uiContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const cols = 4;
    const rows = 2;
    const cardW = scaled(170);
    const cardH = scaled(120);
    const gapX = scaled(14);
    const gapY = scaled(14);
    const totalW = cols * cardW + (cols - 1) * gapX;
    const totalH = rows * cardH + (rows - 1) * gapY;
    const startX = (width - totalW) / 2;
    const startY = (height - totalH) / 2 - scaled(5);

    const coins = getCoins();

    POWER_UPS.forEach((def, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX) + cardW / 2;
      const cy = startY + row * (cardH + gapY) + cardH / 2;
      this.createPowerUpCard(def, cx, cy, cardW, cardH, coins);
    });
  }

  private createPowerUpCard(
    def: PowerUpDef,
    cx: number,
    cy: number,
    cardW: number,
    cardH: number,
    coins: number,
  ): void {
    if (!this.uiContainer) return;

    const level = getPowerUpLevel(def.id);
    const isMaxed = level >= def.maxLevel;
    const cost = getNextCost(def, level);
    const canAfford = !isMaxed && coins >= cost;

    const gfx = this.add.graphics();
    const drawCard = (hover: boolean): void => {
      gfx.clear();
      // Sombra
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(cx - cardW / 2 + 3, cy - cardH / 2 + 3, cardW, cardH, 10);
      // Fundo
      gfx.fillStyle(hover ? 0x1e1e44 : 0x151530, 0.95);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);
      // Borda
      const borderColor = isMaxed ? 0x44bb44 : canAfford ? 0xffcc00 : 0x333366;
      const borderAlpha = hover ? 1 : 0.7;
      gfx.lineStyle(2, borderColor, borderAlpha);
      gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);
      // Highlight superior
      gfx.fillStyle(0xffffff, hover ? 0.06 : 0.03);
      gfx.fillRoundedRect(cx - cardW / 2 + 3, cy - cardH / 2 + 2, cardW - 6, cardH * 0.25, { tl: 8, tr: 8, bl: 0, br: 0 });
    };
    drawCard(false);
    this.uiContainer.add(gfx);

    // ── Icone ────────────────────────────────────────────────────────
    const iconX = cx - cardW / 2 + scaled(28);
    const iconY = cy - cardH / 2 + scaled(30);
    if (this.textures.exists(def.icon)) {
      const icon = this.add.image(iconX, iconY, def.icon).setScale(scaled(2)).setDepth(6);
      this.uiContainer.add(icon);
    } else {
      const placeholder = this.add.text(iconX, iconY, '?', {
        fontSize: fontSize(20), color: '#666666', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6);
      this.uiContainer.add(placeholder);
    }

    // ── Nome ─────────────────────────────────────────────────────────
    const nameText = this.add.text(cx + scaled(10), cy - cardH / 2 + scaled(16), def.name, {
      fontSize: fontSize(11),
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: scaled(2),
    }).setOrigin(0.5, 0).setDepth(6);
    this.uiContainer.add(nameText);

    // ── Efeito por nivel ─────────────────────────────────────────────
    this.uiContainer.add(this.add.text(cx + scaled(10), cy - cardH / 2 + scaled(32), def.effect, {
      fontSize: fontSize(9),
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(6));

    // ── Level bar ────────────────────────────────────────────────────
    const barY = cy + scaled(12);
    const barStartX = cx - cardW / 2 + scaled(14);
    const squareSize = scaled(10);
    const squareGap = scaled(3);

    for (let i = 0; i < def.maxLevel; i++) {
      const sx = barStartX + i * (squareSize + squareGap);
      const filled = i < level;
      const barGfx = this.add.graphics().setDepth(6);

      if (filled) {
        barGfx.fillStyle(isMaxed ? 0x44bb44 : 0xffcc00, 0.9);
      } else {
        barGfx.fillStyle(0x333355, 0.6);
      }
      barGfx.fillRect(sx, barY, squareSize, squareSize);

      if (filled) {
        barGfx.lineStyle(1, isMaxed ? 0x66dd66 : 0xffdd44, 0.6);
        barGfx.strokeRect(sx, barY, squareSize, squareSize);
      }
      this.uiContainer.add(barGfx);
    }

    // ── Card hover hitbox (added before buy button so buy is on top for input) ──
    const cardHit = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0)
      .setInteractive().setDepth(5);
    cardHit.on('pointerover', () => drawCard(true));
    cardHit.on('pointerout', () => drawCard(false));
    this.uiContainer.add(cardHit);

    // ── Cost / Max label ─────────────────────────────────────────────
    const costY = cy + cardH / 2 - scaled(18);
    if (isMaxed) {
      this.uiContainer.add(this.add.text(cx, costY, 'MAXIMO', {
        fontSize: fontSize(11),
        color: '#44bb44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: scaled(2),
      }).setOrigin(0.5).setDepth(6));
    } else {
      const costColor = canAfford ? '#ffcc00' : '#666666';
      this.uiContainer.add(this.add.text(cx - scaled(20), costY, `₽ ${cost}`, {
        fontSize: fontSize(11),
        color: costColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: scaled(2),
      }).setOrigin(0.5).setDepth(6));

      // ── Buy button ─────────────────────────────────────────────
      const buyW = scaled(50);
      const buyH = scaled(20);
      const buyX = cx + cardW / 2 - scaled(40);

      const buyGfx = this.add.graphics().setDepth(6);
      const drawBuy = (hover: boolean): void => {
        buyGfx.clear();
        if (canAfford) {
          buyGfx.fillStyle(hover ? 0x44bb44 : 0x228822, 0.95);
          buyGfx.fillRoundedRect(buyX - buyW / 2, costY - buyH / 2, buyW, buyH, 4);
          buyGfx.lineStyle(1, hover ? 0x66dd66 : 0x33aa33);
          buyGfx.strokeRoundedRect(buyX - buyW / 2, costY - buyH / 2, buyW, buyH, 4);
        } else {
          buyGfx.fillStyle(0x333344, 0.7);
          buyGfx.fillRoundedRect(buyX - buyW / 2, costY - buyH / 2, buyW, buyH, 4);
        }
      };
      drawBuy(false);
      this.uiContainer.add(buyGfx);

      const buyLabel = this.add.text(buyX, costY, canAfford ? 'COMPRAR' : '---', {
        fontSize: fontSize(8),
        color: canAfford ? '#ffffff' : '#555555',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(7);
      this.uiContainer.add(buyLabel);

      if (canAfford) {
        const buyHit = this.add.rectangle(buyX, costY, buyW, buyH, 0xffffff, 0)
          .setInteractive({ useHandCursor: true }).setDepth(8);
        buyHit.on('pointerover', () => { drawBuy(true); SoundManager.playHover(); });
        buyHit.on('pointerout', () => drawBuy(false));
        buyHit.on('pointerdown', () => {
          const success = buyPowerUp(def.id, cost);
          if (success) {
            SoundManager.playClick();
            this.updateCoinDisplay();
            this.buildCards();
          }
        });
        this.uiContainer.add(buyHit);
      }
    }

  }
}
