import Phaser from 'phaser';
import type { UpgradeOption, PlayerState, HeldItemType, AttackType } from '../types';
import { SoundManager } from '../audio/SoundManager';

interface StatsData extends PlayerState {
  time: number;
  heldItems: HeldItemType[];
  attacks: Array<{ type: AttackType; level: number }>;
}

interface GameOverData {
  readonly level: number;
  readonly kills: number;
  readonly time: number;
}

export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private formText!: Phaser.GameObjects.Text;
  private slotsText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private itemsContainer!: Phaser.GameObjects.Container;
  private attacksContainer!: Phaser.GameObjects.Container;
  private levelUpContainer!: Phaser.GameObjects.Container;
  private gameOverContainer!: Phaser.GameObjects.Container;
  private evolutionContainer!: Phaser.GameObjects.Container;

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

    this.hpBar = this.add.graphics().setDepth(100);
    this.add.text(10, 8, 'HP', { ...this.textStyle, fontSize: '12px' }).setDepth(100);
    this.xpBar = this.add.graphics().setDepth(100);

    this.levelText = this.add.text(10, 30, 'Lv 1', {
      ...this.textStyle, fontSize: '16px', color: '#ffcc00',
    }).setDepth(100);

    this.formText = this.add.text(70, 33, 'Charmander', {
      ...this.textStyle, fontSize: '11px', color: '#ff8844',
    }).setDepth(100);

    this.slotsText = this.add.text(10, 48, '', {
      ...this.textStyle, fontSize: '9px', color: '#aaaaaa',
    }).setDepth(100);

    this.killsText = this.add.text(width - 10, 10, 'Kills: 0', {
      ...this.textStyle,
    }).setOrigin(1, 0).setDepth(100);

    this.timerText = this.add.text(width / 2, 10, '0:00', {
      ...this.textStyle, fontSize: '18px',
    }).setOrigin(0.5, 0).setDepth(100);

    // Held Items display (bottom-left)
    this.itemsContainer = this.add.container(10, 0).setDepth(100);
    // Attacks display (bottom-left, above items)
    this.attacksContainer = this.add.container(10, 0).setDepth(100);

    this.levelUpContainer = this.add.container(0, 0).setDepth(200).setVisible(false);
    this.gameOverContainer = this.add.container(0, 0).setDepth(200).setVisible(false);
    this.evolutionContainer = this.add.container(0, 0).setDepth(250).setVisible(false);

    // ── Botão Mute ─────────────────────────────────────────────────
    const muteBtn = this.add.text(width - 10, 30, SoundManager.isMuted() ? '🔇' : '🔊', {
      fontSize: '18px',
    }).setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', () => {
      const nowMuted = !SoundManager.isMuted();
      SoundManager.setMuted(nowMuted);
      muteBtn.setText(nowMuted ? '🔇' : '🔊');
    });

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('stats-update', (stats: StatsData) => this.updateHUD(stats));
    gameScene.events.on('level-up', (options: UpgradeOption[], level: number, rerolls: number) => this.showLevelUp(options, level, rerolls));
    gameScene.events.on('game-over', (data: GameOverData) => this.showGameOver(data));
    gameScene.events.on('pokemon-evolved', (data: { fromName: string; toName: string; form: string; newSlots: number }) => {
      this.showEvolutionOverlay(data.fromName, data.toName);
    });
  }

  private updateHUD(stats: StatsData): void {
    if (!this.cameras?.main) return;
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

    // XP Bar
    this.xpBar.clear();
    const xpRatio = stats.xp / stats.xpToNext;
    this.xpBar.fillStyle(0x222222, 0.8);
    this.xpBar.fillRect(0, height - 8, width, 8);
    this.xpBar.fillStyle(0x44bbff);
    this.xpBar.fillRect(0, height - 8, width * xpRatio, 8);

    // Textos
    this.levelText.setText(`Lv ${stats.level}`);
    const formNames: Record<string, string> = { base: 'Charmander', stage1: 'Charmeleon', stage2: 'Charizard' };
    this.formText.setText(formNames[stats.form] ?? 'Charmander');
    const atkCount = stats.attacks?.length ?? 0;
    const itemCount = stats.heldItems?.length ?? 0;
    this.slotsText.setText(`Atk: ${atkCount}/${stats.attackSlots}  Item: ${itemCount}/${stats.passiveSlots}`);
    this.killsText.setText(`Kills: ${stats.kills}`);
    const minutes = Math.floor(stats.time / 60);
    const seconds = stats.time % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Held Items (bottom-left)
    this.itemsContainer.removeAll(true);
    const itemY = height - 35;
    this.itemsContainer.setPosition(10, itemY);

    if (stats.heldItems && stats.heldItems.length > 0) {
      const label = this.add.text(0, 0, 'Items:', {
        fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      });
      this.itemsContainer.add(label);

      const textureMap: Partial<Record<HeldItemType, string>> = {
        charcoal: 'held-charcoal',
        wideLens: 'held-wide-lens',
        choiceSpecs: 'held-choice-specs',
        quickClaw: 'held-quick-claw',
        leftovers: 'held-leftovers',
        dragonFang: 'held-dragon-fang',
        sharpBeak: 'held-sharp-beak',
        silkScarf: 'held-silk-scarf',
        shellBell: 'held-shell-bell',
        scopeLens: 'held-scope-lens',
        razorClaw: 'held-razor-claw',
        focusBand: 'held-focus-band',
        metronome: 'held-metronome',
        magnet: 'held-magnet',
      };

      stats.heldItems.forEach((item, i) => {
        const icon = this.add.image(45 + i * 18, 5, textureMap[item] ?? 'held-charcoal').setScale(1.2);
        this.itemsContainer.add(icon);
      });
    }

    // Attacks display (top-left, below slots)
    this.attacksContainer.removeAll(true);
    this.attacksContainer.setPosition(10, 62);

    if (stats.attacks) {
      stats.attacks.forEach((atk, i) => {
        const name = atk.type.charAt(0).toUpperCase() + atk.type.slice(1);
        const atkText = this.add.text(0, i * 14, `${name} Lv${atk.level}`, {
          fontSize: '10px', color: '#ff8844', fontFamily: 'monospace',
          stroke: '#000000', strokeThickness: 2,
        });
        this.attacksContainer.add(atkText);
      });
    }
  }

  private showLevelUp(options: UpgradeOption[], level: number, rerolls: number = 0): void {
    const { width, height } = this.cameras.main;
    this.levelUpContainer.removeAll(true);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.levelUpContainer.add(bg);

    const title = this.add.text(width / 2, 60, `LEVEL ${level}!`, {
      fontSize: '32px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.levelUpContainer.add(title);

    const subtitle = this.add.text(width / 2, 95, 'Escolha um aprimoramento:', {
      fontSize: '14px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.levelUpContainer.add(subtitle);

    const cardWidth = 200;
    const cardHeight = 160;
    const gap = 20;
    const totalWidth = options.length * cardWidth + (options.length - 1) * gap;
    const startX = (width - totalWidth) / 2;

    options.forEach((option, i) => {
      const cx = startX + i * (cardWidth + gap) + cardWidth / 2;
      const cy = height / 2 + 20;

      // Cor de fundo especial para evoluções
      const isEvolution = option.id.startsWith('evolve');
      const bgColor = isEvolution ? 0x442200 : 0x222244;
      const borderWidth = isEvolution ? 3 : 2;

      const card = this.add.graphics();
      card.fillStyle(bgColor, 0.95);
      card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      card.lineStyle(borderWidth, option.color);
      card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      this.levelUpContainer.add(card);

      // Tag de evolução
      if (isEvolution) {
        const evoTag = this.add.text(cx, cy - cardHeight / 2 + 8, 'EVOLUÇÃO', {
          fontSize: '9px', color: '#ff4400', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.levelUpContainer.add(evoTag);
      }

      const icon = this.add.image(cx, cy - 40, option.icon).setScale(2).setOrigin(0.5);
      this.levelUpContainer.add(icon);

      const name = this.add.text(cx, cy - 5, option.name, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.levelUpContainer.add(name);

      const desc = this.add.text(cx, cy + 18, option.description, {
        fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace',
        wordWrap: { width: cardWidth - 20 }, align: 'center',
      }).setOrigin(0.5, 0);
      this.levelUpContainer.add(desc);

      const hitbox = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitbox.on('pointerover', () => {
        SoundManager.playHover();
        card.clear();
        card.fillStyle(isEvolution ? 0x663300 : 0x333366, 0.95);
        card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(3, option.color);
        card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      });

      hitbox.on('pointerout', () => {
        card.clear();
        card.fillStyle(bgColor, 0.95);
        card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(borderWidth, option.color);
        card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      });

      hitbox.on('pointerdown', () => {
        SoundManager.playClick();
        this.levelUpContainer.setVisible(false);
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('upgrade-selected', option.id);
      });

      this.levelUpContainer.add(hitbox);
    });

    // ── Botão de Reroll ────────────────────────────────────────────
    const rerollY = height / 2 + 120;
    const hasRerolls = rerolls > 0;
    const rerollText = hasRerolls
      ? `Reroll (${rerolls} restante${rerolls > 1 ? 's' : ''})`
      : 'Sem rerolls';

    const rerollBtn = this.add.text(width / 2, rerollY, rerollText, {
      fontSize: '13px',
      color: hasRerolls ? '#aaaaaa' : '#444444',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.levelUpContainer.add(rerollBtn);

    if (hasRerolls) {
      // Delay para evitar double-fire (novo botão captura o pointer do click anterior)
      this.time.delayedCall(150, () => {
        if (!rerollBtn.active) return;
        rerollBtn.setInteractive({ useHandCursor: true });

        rerollBtn.on('pointerover', () => {
          rerollBtn.setColor('#ffcc00');
          SoundManager.playHover();
        });
        rerollBtn.on('pointerout', () => rerollBtn.setColor('#aaaaaa'));
        rerollBtn.on('pointerdown', () => {
          rerollBtn.disableInteractive();
          const gameScene = this.scene.get('GameScene');
          gameScene.events.emit('reroll-requested');
        });
      });
    }

    this.levelUpContainer.setVisible(true);
  }

  private showEvolutionOverlay(fromName: string, toName: string): void {
    const { width, height } = this.cameras.main;
    this.evolutionContainer.removeAll(true);

    // Fundo semi-transparente
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this.evolutionContainer.add(bg);

    // Texto de evolução
    const text1 = this.add.text(width / 2, height / 2 - 30, `${fromName} está evoluindo...`, {
      fontSize: '20px', color: '#FFdd44', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.evolutionContainer.add(text1);

    const text2 = this.add.text(width / 2, height / 2 + 10, `${toName}!`, {
      fontSize: '28px', color: '#FFFFFF', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
    this.evolutionContainer.add(text2);

    // Slots info
    const text3 = this.add.text(width / 2, height / 2 + 50, '+1 Slot de Ataque  •  +1 Slot de Item', {
      fontSize: '12px', color: '#88ff88', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.evolutionContainer.add(text3);

    this.evolutionContainer.setVisible(true);

    // Animação de entrada
    this.tweens.add({ targets: text1, alpha: 1, duration: 400, ease: 'Power2' });
    this.tweens.add({ targets: text2, alpha: 1, y: height / 2 + 5, duration: 500, delay: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: text3, alpha: 1, duration: 300, delay: 800, ease: 'Power2' });

    // Auto-fechar após 1.4s
    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: [bg, text1, text2, text3], alpha: 0, duration: 300,
        onComplete: () => this.evolutionContainer.setVisible(false),
      });
    });
  }

  private showGameOver(data: GameOverData): void {
    const { width, height } = this.cameras.main;
    this.gameOverContainer.removeAll(true);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    this.gameOverContainer.add(bg);

    const title = this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '40px', color: '#ff4444', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.gameOverContainer.add(title);

    const minutes = Math.floor(data.time / 60);
    const seconds = data.time % 60;
    const statsText = [
      `Level: ${data.level}`,
      `Kills: ${data.kills}`,
      `Tempo: ${minutes}:${seconds.toString().padStart(2, '0')}`,
    ].join('\n');

    const stats = this.add.text(width / 2, height / 2, statsText, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);
    this.gameOverContainer.add(stats);

    const restartBtn = this.add.text(width / 2, height / 2 + 70, '[ TENTAR DE NOVO ]', {
      fontSize: '20px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => { restartBtn.setColor('#ffffff'); SoundManager.playHover(); });
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffcc00'));
    restartBtn.on('pointerdown', () => {
      SoundManager.playClick();
      // GameScene.create() relança UIScene automaticamente
      this.scene.start('GameScene');
    });

    this.gameOverContainer.add(restartBtn);

    const menuBtn = this.add.text(width / 2, height / 2 + 120, '[ VOLTAR AO MENU ]', {
      fontSize: '16px', color: '#888888', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => { menuBtn.setColor('#ffffff'); SoundManager.playHover(); });
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
    });

    this.gameOverContainer.add(menuBtn);
    this.gameOverContainer.setVisible(true);
  }
}
