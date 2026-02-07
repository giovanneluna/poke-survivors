import Phaser from 'phaser';
import type { UpgradeOption, PlayerState } from '../types';

interface GameOverData {
  readonly level: number;
  readonly kills: number;
  readonly time: number;
}

/**
 * UIScene: HUD overlay (HP, XP, timer, kills) + tela de level up + game over.
 * Roda em paralelo com o GameScene, desenhando por cima.
 */
export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private levelUpContainer!: Phaser.GameObjects.Container;
  private gameOverContainer!: Phaser.GameObjects.Container;

  private readonly textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: '14px',
    color: '#ffffff',
    fontFamily: 'monospace',
    stroke: '#000000',
    strokeThickness: 3,
  };

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width } = this.cameras.main;

    // ── HP Bar ─────────────────────────────────────────────────
    this.hpBar = this.add.graphics().setDepth(100);

    this.add.text(10, 8, 'HP', { ...this.textStyle, fontSize: '12px' }).setDepth(100);

    // ── XP Bar (bottom) ────────────────────────────────────────
    this.xpBar = this.add.graphics().setDepth(100);

    // ── Level ──────────────────────────────────────────────────
    this.levelText = this.add.text(10, 30, 'Lv 1', {
      ...this.textStyle,
      fontSize: '16px',
      color: '#ffcc00',
    }).setDepth(100);

    // ── Kills ──────────────────────────────────────────────────
    this.killsText = this.add.text(width - 10, 10, 'Kills: 0', {
      ...this.textStyle,
    }).setOrigin(1, 0).setDepth(100);

    // ── Timer ──────────────────────────────────────────────────
    this.timerText = this.add.text(width / 2, 10, '0:00', {
      ...this.textStyle,
      fontSize: '18px',
    }).setOrigin(0.5, 0).setDepth(100);

    // ── Level Up Container (hidden) ────────────────────────────
    this.levelUpContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

    // ── Game Over Container (hidden) ───────────────────────────
    this.gameOverContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

    // ── Escutar eventos do GameScene ───────────────────────────
    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('stats-update', (stats: PlayerState & { time: number }) => {
      this.updateHUD(stats);
    });

    gameScene.events.on('level-up', (options: UpgradeOption[], level: number) => {
      this.showLevelUp(options, level);
    });

    gameScene.events.on('game-over', (data: GameOverData) => {
      this.showGameOver(data);
    });
  }

  private updateHUD(stats: PlayerState & { time: number }): void {
    const { width, height } = this.cameras.main;

    // HP Bar
    this.hpBar.clear();
    const hpBarWidth = 150;
    const hpRatio = stats.hp / stats.maxHp;

    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRoundedRect(30, 10, hpBarWidth, 12, 3);

    const hpColor = hpRatio > 0.5 ? 0x44dd44 : hpRatio > 0.25 ? 0xdddd44 : 0xdd4444;
    this.hpBar.fillStyle(hpColor);
    this.hpBar.fillRoundedRect(30, 10, hpBarWidth * hpRatio, 12, 3);

    // XP Bar (bottom of screen)
    this.xpBar.clear();
    const xpRatio = stats.xp / stats.xpToNext;

    this.xpBar.fillStyle(0x222222, 0.8);
    this.xpBar.fillRect(0, height - 8, width, 8);

    this.xpBar.fillStyle(0x44bbff);
    this.xpBar.fillRect(0, height - 8, width * xpRatio, 8);

    // Textos
    this.levelText.setText(`Lv ${stats.level}`);
    this.killsText.setText(`Kills: ${stats.kills}`);

    const minutes = Math.floor(stats.time / 60);
    const seconds = stats.time % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  private showLevelUp(options: UpgradeOption[], level: number): void {
    const { width, height } = this.cameras.main;

    this.levelUpContainer.removeAll(true);

    // Fundo escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.levelUpContainer.add(bg);

    // Título
    const title = this.add.text(width / 2, 60, `LEVEL ${level}!`, {
      fontSize: '32px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.levelUpContainer.add(title);

    const subtitle = this.add.text(width / 2, 95, 'Escolha um aprimoramento:', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.levelUpContainer.add(subtitle);

    // Cards de upgrade
    const cardWidth = 200;
    const cardHeight = 160;
    const gap = 20;
    const totalWidth = options.length * cardWidth + (options.length - 1) * gap;
    const startX = (width - totalWidth) / 2;

    options.forEach((option, i) => {
      const cx = startX + i * (cardWidth + gap) + cardWidth / 2;
      const cy = height / 2 + 20;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x222244, 0.95);
      card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      card.lineStyle(2, option.color);
      card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      this.levelUpContainer.add(card);

      // Icon
      const icon = this.add.text(cx, cy - 45, option.icon, {
        fontSize: '28px',
      }).setOrigin(0.5);
      this.levelUpContainer.add(icon);

      // Nome
      const name = this.add.text(cx, cy - 10, option.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.levelUpContainer.add(name);

      // Descrição
      const desc = this.add.text(cx, cy + 20, option.description, {
        fontSize: '11px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
        wordWrap: { width: cardWidth - 20 },
        align: 'center',
      }).setOrigin(0.5, 0);
      this.levelUpContainer.add(desc);

      // Botão interativo (hitbox invisível)
      const hitbox = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitbox.on('pointerover', () => {
        card.clear();
        card.fillStyle(0x333366, 0.95);
        card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(3, option.color);
        card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      });

      hitbox.on('pointerout', () => {
        card.clear();
        card.fillStyle(0x222244, 0.95);
        card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(2, option.color);
        card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      });

      hitbox.on('pointerdown', () => {
        this.levelUpContainer.setVisible(false);
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('upgrade-selected', option.id);
      });

      this.levelUpContainer.add(hitbox);
    });

    this.levelUpContainer.setVisible(true);
  }

  private showGameOver(data: GameOverData): void {
    const { width, height } = this.cameras.main;

    this.gameOverContainer.removeAll(true);

    // Fundo
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    this.gameOverContainer.add(bg);

    // Título
    const title = this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '40px',
      color: '#ff4444',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.gameOverContainer.add(title);

    // Stats
    const minutes = Math.floor(data.time / 60);
    const seconds = data.time % 60;
    const statsText = [
      `Level: ${data.level}`,
      `Kills: ${data.kills}`,
      `Tempo: ${minutes}:${seconds.toString().padStart(2, '0')}`,
    ].join('\n');

    const stats = this.add.text(width / 2, height / 2, statsText, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);
    this.gameOverContainer.add(stats);

    // Botão de restart
    const restartBtn = this.add.text(width / 2, height / 2 + 80, '[ TENTAR DE NOVO ]', {
      fontSize: '20px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor('#ffffff'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffcc00'));
    restartBtn.on('pointerdown', () => {
      this.gameOverContainer.setVisible(false);
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.gameOverContainer.add(restartBtn);
    this.gameOverContainer.setVisible(true);
  }
}
