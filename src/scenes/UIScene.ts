import Phaser from 'phaser';
import type { UpgradeOption, PlayerState, HeldItemType, AttackType, GachaRewardType, PokemonForm } from '../types';
import { ATTACKS } from '../config';
import { SoundManager } from '../audio/SoundManager';
import { Boss } from '../entities/Boss';
import { GameScene } from './GameScene';

interface StatsData extends PlayerState {
  time: number;
  starterKey: string;
  formName: string;
  heldItems: HeldItemType[];
  attacks: Array<{ type: AttackType; level: number }>;
  damageTotals: Record<string, number>;
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
  private bossHpContainer!: Phaser.GameObjects.Container;
  private gachaContainer!: Phaser.GameObjects.Container;
  private activeBoss: Boss | null = null;
  private devPanelContainer!: Phaser.GameObjects.Container;
  private devPanelOpen = false;
  private devSearchText = '';
  private devPanelKeyHandler: ((event: KeyboardEvent) => void) | null = null;
  private pauseContainer!: Phaser.GameObjects.Container;
  private damageContainer!: Phaser.GameObjects.Container;
  private userPaused = false;

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
    this.bossHpContainer = this.add.container(0, 0).setDepth(150).setVisible(false);
    this.gachaContainer = this.add.container(0, 0).setDepth(300).setVisible(false);

    // ── Botão Mute ─────────────────────────────────────────────────
    const muteBtn = this.add.text(width - 10, 30, SoundManager.isMuted() ? '🔇' : '🔊', {
      fontSize: '18px',
    }).setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', () => {
      const nowMuted = !SoundManager.isMuted();
      SoundManager.setMuted(nowMuted);
      muteBtn.setText(nowMuted ? '🔇' : '🔊');
    });

    // ── Botão Pause ──────────────────────────────────────────────────
    const pauseBtn = this.add.text(width - 10, 52, '⏸', {
      fontSize: '16px',
    }).setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });

    this.pauseContainer = this.add.container(0, 0).setDepth(180).setVisible(false);
    this.userPaused = false;

    pauseBtn.on('pointerdown', () => {
      if (this.userPaused) return;
      this.userPaused = true;
      pauseBtn.setText('▶');
      this.showPauseOverlay(pauseBtn);
    });

    // ── Damage Tracker (abaixo de kills/mute/pause) ──────────────────
    this.damageContainer = this.add.container(width - 10, 72).setDepth(100);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('stats-update', (stats: StatsData) => this.updateHUD(stats));
    gameScene.events.on('level-up', (options: UpgradeOption[], level: number, rerolls: number) => this.showLevelUp(options, level, rerolls));
    gameScene.events.on('game-over', (data: GameOverData) => this.showGameOver(data));
    gameScene.events.on('pokemon-evolved', (data: { fromName: string; toName: string; form: string; newSlots: number }) => {
      this.showEvolutionOverlay(data.fromName, data.toName);
    });

    // ── Boss events ──────────────────────────────────────────────────
    gameScene.events.on('boss-warning', (name: string, archetype?: string) => this.showBossWarning(name, archetype));
    gameScene.events.on('boss-spawned', (data: { name: string; hp: number; maxHp: number; boss: Boss }) => {
      this.activeBoss = data.boss;
      this.showBossHpBar(data.name, data.hp, data.maxHp);
    });
    gameScene.events.on('boss-killed', () => {
      this.activeBoss = null;
      this.bossHpContainer.setVisible(false);
    });

    // ── Boss damage numbers (resisted = gray) ───────────────────────
    gameScene.events.on('boss-damage-number', (data: { x: number; y: number; amount: number; resisted: boolean }) => {
      this.showBossDamageNumber(data);
    });

    // ── Gacha ────────────────────────────────────────────────────────
    gameScene.events.on('show-gacha', () => this.showGachaOverlay());

    // ── Dev Panel (only in dev mode) ──────────────────────────────
    this.devPanelContainer = this.add.container(0, 0).setDepth(500).setVisible(false);
    // Auto-open when dev-mode-ready fires from GameScene
    gameScene.events.on('dev-mode-ready', () => {
      this.createDevButton(width);
      // Auto-open the panel
      if (!this.devPanelOpen) {
        this.devPanelOpen = true;
        this.rebuildDevPanel();
        this.devPanelContainer.setVisible(true);
      }
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
    this.formText.setText(stats.formName ?? stats.form);
    const nameColor = stats.starterKey === 'squirtle' ? '#44aaff' : '#ff8844';
    this.formText.setColor(nameColor);
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

    // Damage tracker (top-right, below pause button)
    this.updateDamageDisplay(stats.damageTotals);
  }

  // ── Damage Display ───────────────────────────────────────────────
  private updateDamageDisplay(damageTotals: Record<string, number> | undefined): void {
    this.damageContainer.removeAll(true);
    if (!damageTotals) return;

    const entries = Object.entries(damageTotals)
      .filter(([, dmg]) => dmg > 0)
      .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) return;

    const maxVisible = 8;
    entries.slice(0, maxVisible).forEach(([type, dmg], i) => {
      const name = type.charAt(0).toUpperCase() + type.slice(1);
      const dmgStr = dmg >= 1000 ? `${(dmg / 1000).toFixed(1)}k` : Math.floor(dmg).toString();
      const text = this.add.text(0, i * 13, `${name} ${dmgStr}`, {
        fontSize: '9px', color: '#cccccc', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0);
      this.damageContainer.add(text);
    });
  }

  // ── Pause Overlay ──────────────────────────────────────────────────
  private showPauseOverlay(pauseBtn: Phaser.GameObjects.Text): void {
    const { width, height } = this.cameras.main;
    const gameScene = this.scene.get('GameScene');
    gameScene.events.emit('pause-game');

    this.pauseContainer.removeAll(true);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this.pauseContainer.add(bg);

    const title = this.add.text(width / 2, height / 2 - 30, 'PAUSADO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.pauseContainer.add(title);

    const resumeBtn = this.add.text(width / 2, height / 2 + 20, '[ CONTINUAR ]', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.pauseContainer.add(resumeBtn);

    resumeBtn.on('pointerover', () => { resumeBtn.setColor('#ffffff'); SoundManager.playHover(); });
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#ffcc00'));
    resumeBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.userPaused = false;
      pauseBtn.setText('⏸');
      this.pauseContainer.setVisible(false);
      gameScene.events.emit('resume-game');
    });

    this.pauseContainer.setVisible(true);
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

  // ── Boss Warning ────────────────────────────────────────────────────
  private static readonly ARCHETYPE_INFO: Readonly<Record<string, { icon: string; color: string }>> = {
    tank:       { icon: 'TANK',       color: '#44aaff' },
    striker:    { icon: 'STRIKER',    color: '#ff4444' },
    caster:     { icon: 'CASTER',     color: '#cc66ff' },
    skirmisher: { icon: 'SKIRMISHER', color: '#ffaa44' },
  };

  private showBossWarning(name: string, archetype?: string): void {
    const { width, height } = this.cameras.main;

    // Flash vermelho
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.3).setDepth(140);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    // Texto principal
    const text = this.add.text(width / 2, height / 2 - 12, `WILD ${name.toUpperCase()} APPEARED!`, {
      fontSize: '28px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(160);

    this.tweens.add({
      targets: text, alpha: 1, scaleX: { from: 0.5, to: 1 }, scaleY: { from: 0.5, to: 1 },
      duration: 500, ease: 'Back.Out',
    });

    // Archetype tag
    const destroyTargets: Phaser.GameObjects.GameObject[] = [text];
    if (archetype) {
      const info = UIScene.ARCHETYPE_INFO[archetype];
      if (info) {
        const tag = this.add.text(width / 2, height / 2 + 18, info.icon, {
          fontSize: '14px', color: info.color, fontFamily: 'monospace', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setAlpha(0).setDepth(160);

        this.tweens.add({
          targets: tag, alpha: 1, duration: 300, delay: 400, ease: 'Power2',
        });
        destroyTargets.push(tag);
      }
    }

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: destroyTargets, alpha: 0, duration: 300,
        onComplete: () => destroyTargets.forEach(t => t.destroy()),
      });
    });
  }

  // ── Boss Damage Numbers ─────────────────────────────────────────
  private showBossDamageNumber(data: { x: number; y: number; amount: number; resisted: boolean }): void {
    // Convert world coords to screen coords via GameScene camera
    const gameScene = this.scene.get('GameScene') as GameScene;
    const cam = gameScene.cameras?.main;
    if (!cam) return;

    const screenX = data.x - cam.scrollX;
    const screenY = data.y - cam.scrollY;

    // Jitter horizontal para evitar sobreposição
    const jitter = Phaser.Math.Between(-15, 15);
    const color = data.resisted ? '#888888' : '#ffffff';
    const dmgStr = Math.floor(data.amount).toString();

    const text = this.add.text(screenX + jitter, screenY, dmgStr, {
      fontSize: '12px', color, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(170);

    this.tweens.add({
      targets: text,
      y: screenY - 25,
      alpha: { from: 1, to: 0 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  // ── Boss HP Bar ───────────────────────────────────────────────────
  private showBossHpBar(name: string, _hp: number, _maxHp: number): void {
    const { width } = this.cameras.main;
    this.bossHpContainer.removeAll(true);

    // Nome
    const nameText = this.add.text(width / 2, 55, name, {
      fontSize: '14px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.bossHpContainer.add(nameText);

    // Barra
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 0.8);
    barBg.fillRoundedRect(width / 2 - 200, 70, 400, 14, 4);
    this.bossHpContainer.add(barBg);

    const barFill = this.add.graphics();
    barFill.fillStyle(0x44dd44);
    barFill.fillRoundedRect(width / 2 - 200, 70, 400, 14, 4);
    this.bossHpContainer.add(barFill);

    // Salvar referência para update
    barFill.setData('barFill', true);

    this.bossHpContainer.setVisible(true);
  }

  private regenGlowAlpha = 0;
  private regenGlowDir = 1;

  override update(_time: number, delta: number): void {
    // Atualizar boss HP bar
    if (this.activeBoss && this.activeBoss.active && this.bossHpContainer.visible) {
      const { width } = this.cameras.main;
      const barFill = this.bossHpContainer.getAll().find(
        c => c instanceof Phaser.GameObjects.Graphics && c.getData('barFill')
      ) as Phaser.GameObjects.Graphics | undefined;
      if (barFill) {
        barFill.clear();
        const hpRatio = Math.max(0, this.activeBoss.getHp() / this.activeBoss.getMaxHp());
        const color = hpRatio > 0.5 ? 0x44dd44 : hpRatio > 0.25 ? 0xdddd44 : 0xdd4444;
        barFill.fillStyle(color);
        barFill.fillRoundedRect(width / 2 - 200, 70, 400 * hpRatio, 14, 4);

        // Regen glow: green shimmer overlay when boss is regenerating HP
        if (this.activeBoss.hpRegenPerSec > 0 && hpRatio < 1) {
          this.regenGlowAlpha += this.regenGlowDir * (delta / 500);
          if (this.regenGlowAlpha >= 0.35) { this.regenGlowAlpha = 0.35; this.regenGlowDir = -1; }
          if (this.regenGlowAlpha <= 0.05) { this.regenGlowAlpha = 0.05; this.regenGlowDir = 1; }
          barFill.fillStyle(0x88ff88, this.regenGlowAlpha);
          barFill.fillRoundedRect(width / 2 - 200, 70, 400 * hpRatio, 14, 4);
        }
      }
    } else if (this.activeBoss && !this.activeBoss.active) {
      this.activeBoss = null;
      this.bossHpContainer.setVisible(false);
    }
  }

  // ── Gacha Overlay ─────────────────────────────────────────────────
  private showGachaOverlay(): void {
    const { width, height } = this.cameras.main;
    this.gachaContainer.removeAll(true);

    // Fundo escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    this.gachaContainer.add(bg);

    // Pokeball girando
    const pokeball = this.add.image(width / 2, height / 2 - 30, 'gacha-box').setScale(3);
    this.gachaContainer.add(pokeball);

    this.tweens.add({
      targets: pokeball,
      angle: 720,
      duration: 2000,
      ease: 'Cubic.InOut',
      onComplete: () => this.revealGachaReward(),
    });

    this.gachaContainer.setVisible(true);
  }

  private revealGachaReward(): void {
    const { width, height } = this.cameras.main;

    // Roll reward
    const roll = Math.random() * 100;
    let rewardType: GachaRewardType;
    let rewardName: string;
    let rewardColor: string;

    if (roll < 35) {
      rewardType = 'skillUpgrade';
      rewardName = 'SKILL UPGRADE!';
      rewardColor = '#44ff44';
    } else if (roll < 60) {
      rewardType = 'heldItem';
      rewardName = 'HELD ITEM!';
      rewardColor = '#44aaff';
    } else if (roll < 80) {
      rewardType = 'rareCandy';
      rewardName = 'RARE CANDY!';
      rewardColor = '#FFD700';
    } else if (roll < 95) {
      rewardType = 'evolutionStone';
      rewardName = 'EVOLUTION STONE!';
      rewardColor = '#ff8800';
    } else {
      rewardType = 'maxRevive';
      rewardName = 'MAX REVIVE!';
      rewardColor = '#ff44ff';
    }

    // Texto do resultado
    const resultText = this.add.text(width / 2, height / 2 + 30, rewardName, {
      fontSize: '24px', color: rewardColor, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.gachaContainer.add(resultText);

    this.tweens.add({
      targets: resultText, alpha: 1, scaleX: { from: 0.5, to: 1 }, scaleY: { from: 0.5, to: 1 },
      duration: 400, ease: 'Back.Out',
    });

    // Botão continuar
    const continueBtn = this.add.text(width / 2, height / 2 + 80, '[ CONTINUAR ]', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.gachaContainer.add(continueBtn);

    this.time.delayedCall(500, () => {
      continueBtn.setAlpha(1);
      continueBtn.setInteractive({ useHandCursor: true });

      continueBtn.on('pointerover', () => { continueBtn.setColor('#ffffff'); SoundManager.playHover(); });
      continueBtn.on('pointerout', () => continueBtn.setColor('#ffcc00'));
      continueBtn.on('pointerdown', () => {
        SoundManager.playClick();
        this.gachaContainer.setVisible(false);
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('gacha-reward', rewardType);
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // ═══ DEV PANEL ═════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════

  private createDevButton(screenWidth: number): void {
    const btnX = screenWidth - 35;
    const btnY = 55;
    const btnW = 50;
    const btnH = 22;

    const btnGfx = this.add.graphics().setDepth(500);
    const drawBtn = (hover: boolean): void => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? 0x228844 : 0x114422, 0.9);
      btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
      btnGfx.lineStyle(1, hover ? 0x44ff44 : 0x228822);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
    };
    drawBtn(false);

    this.add.text(btnX, btnY, 'DEV', {
      fontSize: '10px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(501);

    const hitbox = this.add.rectangle(btnX, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(502);
    hitbox.on('pointerover', () => drawBtn(true));
    hitbox.on('pointerout', () => drawBtn(false));
    hitbox.on('pointerdown', () => {
      SoundManager.playClick();
      this.toggleDevPanel();
    });
  }

  private toggleDevPanel(): void {
    if (this.devPanelOpen) {
      this.devPanelContainer.setVisible(false);
      this.devPanelOpen = false;
      if (this.devPanelKeyHandler) {
        window.removeEventListener('keydown', this.devPanelKeyHandler);
        this.devPanelKeyHandler = null;
      }
      return;
    }
    this.devPanelOpen = true;
    this.rebuildDevPanel();
    this.devPanelContainer.setVisible(true);
  }

  private rebuildDevPanel(): void {
    this.devPanelContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const panelW = Math.min(340, width - 20);
    const panelH = height - 40;
    const panelX = width - panelW - 10;
    const panelY = 20;

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.95);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(1, 0x44ff44, 0.5);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);
    this.devPanelContainer.add(bg);

    // Title
    this.devPanelContainer.add(this.add.text(panelX + panelW / 2, panelY + 12, 'DEV PANEL', {
      fontSize: '12px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Close button
    const closeBtn = this.add.text(panelX + panelW - 15, panelY + 8, 'X', {
      fontSize: '12px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { SoundManager.playClick(); this.toggleDevPanel(); });
    this.devPanelContainer.add(closeBtn);

    let yPos = panelY + 30;
    const gs = this.scene.get('GameScene') as GameScene;

    // ── Utility buttons ──────────────────────────────────────────
    const utilBtns = [
      { label: 'Level Up', color: '#ffcc00', action: () => gs.events.emit('request-level-up') },
      { label: 'God Mode', color: gs.player.godMode ? '#44ff44' : '#ff4444', action: () => {
        gs.player.godMode = !gs.player.godMode;
        gs.player.stats.hp = gs.player.stats.maxHp;
        gs.events.emit('stats-refresh');
        this.rebuildDevPanel();
      }},
      { label: 'Kill All', color: '#ff6666', action: () => gs.events.emit('pokeball-bomb') },
      { label: 'Spawn x5', color: '#ff8844', action: () => {
        for (let i = 0; i < 5; i++) gs.spawnSingleDummy();
      }},
      { label: 'Full Heal', color: '#66ff66', action: () => {
        gs.player.stats.hp = gs.player.stats.maxHp;
        gs.events.emit('stats-refresh');
      }},
      { label: 'Boss', color: '#ff2222', action: () => {
        gs.getSpawnSystem().spawnBoss('raticate');
      }},
    ];

    const btnW = (panelW - 20) / 2 - 5;
    utilBtns.forEach((btn, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = panelX + 10 + col * (btnW + 10);
      const by = yPos + row * 25;

      const gfx = this.add.graphics();
      gfx.fillStyle(0x1a1a3e, 0.9);
      gfx.fillRoundedRect(bx, by, btnW, 20, 3);
      this.devPanelContainer.add(gfx);

      const text = this.add.text(bx + btnW / 2, by + 10, btn.label, {
        fontSize: '10px', color: btn.color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.devPanelContainer.add(text);

      const hit = this.add.rectangle(bx + btnW / 2, by + 10, btnW, 20, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { SoundManager.playClick(); btn.action(); });
      this.devPanelContainer.add(hit);
    });
    yPos += Math.ceil(utilBtns.length / 2) * 25 + 10;

    // ── Form buttons ─────────────────────────────────────────────
    this.devPanelContainer.add(this.add.text(panelX + 10, yPos, 'FORMA:', {
      fontSize: '9px', color: '#888888', fontFamily: 'monospace',
    }));
    yPos += 14;

    const forms: PokemonForm[] = ['base', 'stage1', 'stage2'];
    const formLabels = ['Base', 'Stage1', 'Stage2'];
    const formBtnW = (panelW - 30) / 3;
    forms.forEach((form, i) => {
      const bx = panelX + 10 + i * (formBtnW + 5);
      const isActive = gs.player.getForm() === form;
      const gfx = this.add.graphics();
      gfx.fillStyle(isActive ? 0x228822 : 0x1a1a3e, 0.9);
      gfx.fillRoundedRect(bx, yPos, formBtnW, 18, 3);
      if (isActive) { gfx.lineStyle(1, 0x44ff44); gfx.strokeRoundedRect(bx, yPos, formBtnW, 18, 3); }
      this.devPanelContainer.add(gfx);

      this.devPanelContainer.add(this.add.text(bx + formBtnW / 2, yPos + 9, formLabels[i], {
        fontSize: '9px', color: isActive ? '#44ff44' : '#aaaaaa', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5));

      const hit = this.add.rectangle(bx + formBtnW / 2, yPos + 9, formBtnW, 18, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        SoundManager.playClick();
        gs.player.evolve(form, true);
        gs.events.emit('stats-refresh');
        this.rebuildDevPanel();
      });
      this.devPanelContainer.add(hit);
    });
    yPos += 28;

    // ── Search bar ───────────────────────────────────────────────
    this.devPanelContainer.add(this.add.text(panelX + 10, yPos, 'ATAQUES:', {
      fontSize: '9px', color: '#888888', fontFamily: 'monospace',
    }));
    yPos += 14;

    const searchBg = this.add.graphics();
    searchBg.fillStyle(0x111133, 0.9);
    searchBg.fillRoundedRect(panelX + 10, yPos, panelW - 20, 20, 3);
    searchBg.lineStyle(1, 0x333366);
    searchBg.strokeRoundedRect(panelX + 10, yPos, panelW - 20, 20, 3);
    this.devPanelContainer.add(searchBg);

    const searchDisplay = this.add.text(panelX + 15, yPos + 10,
      this.devSearchText || 'Clique para buscar...', {
        fontSize: '10px',
        color: this.devSearchText ? '#ffffff' : '#555555',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
    this.devPanelContainer.add(searchDisplay);

    // Click-to-focus search: only captures keys when user clicks the search bar
    if (this.devPanelKeyHandler) {
      window.removeEventListener('keydown', this.devPanelKeyHandler);
      this.devPanelKeyHandler = null;
    }
    const searchHit = this.add.rectangle(panelX + 10 + (panelW - 20) / 2, yPos + 10, panelW - 20, 20, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    searchHit.on('pointerdown', () => {
      if (this.devPanelKeyHandler) return; // already focused
      searchBg.clear();
      searchBg.fillStyle(0x111155, 0.95);
      searchBg.fillRoundedRect(panelX + 10, yPos, panelW - 20, 20, 3);
      searchBg.lineStyle(1, 0x44ff44);
      searchBg.strokeRoundedRect(panelX + 10, yPos, panelW - 20, 20, 3);

      const onKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          // Unfocus search, remove handler
          window.removeEventListener('keydown', onKey);
          this.devPanelKeyHandler = null;
          this.rebuildDevPanel();
          return;
        }
        if (event.key === 'Backspace') {
          event.preventDefault();
          this.devSearchText = this.devSearchText.slice(0, -1);
          this.rebuildDevPanel();
          return;
        }
        if (event.key.length === 1 && this.devSearchText.length < 20) {
          event.preventDefault();
          this.devSearchText += event.key.toLowerCase();
          this.rebuildDevPanel();
        }
      };
      this.devPanelKeyHandler = onKey;
      window.addEventListener('keydown', onKey);
    });
    this.devPanelContainer.add(searchHit);

    // Cleanup on scene shutdown
    this.events.once('shutdown', () => {
      if (this.devPanelKeyHandler) {
        window.removeEventListener('keydown', this.devPanelKeyHandler);
        this.devPanelKeyHandler = null;
      }
    });

    yPos += 25;

    // ── Attack list ──────────────────────────────────────────────
    const allAttacks = Object.values(ATTACKS);
    const filtered = this.devSearchText
      ? allAttacks.filter(a =>
          a.name.toLowerCase().includes(this.devSearchText) ||
          a.key.toLowerCase().includes(this.devSearchText))
      : allAttacks;

    const attackFactory = gs.getAttackFactory();
    const listHeight = panelH - (yPos - panelY) - 10;
    const itemH = 22;
    const maxVisible = Math.floor(listHeight / itemH);

    const elementColors: Record<string, string> = {
      fire: '#ff6600', water: '#4488ff', ice: '#88ddff',
      dragon: '#7744ff', flying: '#aaddff', normal: '#aaaaaa',
    };

    filtered.slice(0, maxVisible).forEach((atk, i) => {
      const iy = yPos + i * itemH;
      const isActive = gs.player.hasAttack(atk.key as AttackType);
      const currentAttack = gs.player.getAttack(atk.key as AttackType);
      const level = currentAttack?.level ?? 0;

      // Row background
      const rowGfx = this.add.graphics();
      rowGfx.fillStyle(isActive ? 0x1a2a1a : 0x111122, 0.8);
      rowGfx.fillRoundedRect(panelX + 5, iy, panelW - 10, itemH - 2, 2);
      this.devPanelContainer.add(rowGfx);

      // Element color indicator
      const elemColor = Phaser.Display.Color.HexStringToColor(elementColors[atk.element] ?? '#888888').color;
      rowGfx.fillStyle(elemColor, 0.8);
      rowGfx.fillRect(panelX + 5, iy, 3, itemH - 2);

      // Name + level
      const nameStr = isActive ? `${atk.name} Lv${level}` : atk.name;
      this.devPanelContainer.add(this.add.text(panelX + 12, iy + (itemH - 2) / 2, nameStr, {
        fontSize: '9px',
        color: isActive ? '#44ff44' : '#cccccc',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5));

      // Toggle button
      const toggleX = panelX + panelW - 60;
      const toggleText = isActive ? 'OFF' : 'ON';
      const toggleColor = isActive ? '#ff4444' : '#44ff44';

      const toggleBtn = this.add.text(toggleX, iy + (itemH - 2) / 2, `[${toggleText}]`, {
        fontSize: '9px', color: toggleColor, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      toggleBtn.on('pointerdown', () => {
        SoundManager.playClick();
        const type = atk.key as AttackType;
        if (isActive) {
          attackFactory.removeAttack(type);
        } else if (attackFactory.isRegistered(type)) {
          attackFactory.createAttack(type);
        }
        gs.events.emit('stats-refresh');
        this.rebuildDevPanel();
      });
      this.devPanelContainer.add(toggleBtn);

      // Level +/- buttons (only if active)
      if (isActive && currentAttack) {
        const lvUpBtn = this.add.text(panelX + panelW - 22, iy + (itemH - 2) / 2, '+', {
          fontSize: '10px', color: '#66ff66', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        lvUpBtn.on('pointerdown', () => {
          SoundManager.playClick();
          if (currentAttack.level < 8) currentAttack.upgrade();
          gs.events.emit('stats-refresh');
          this.rebuildDevPanel();
        });
        this.devPanelContainer.add(lvUpBtn);
      }
    });

    // Show count
    if (filtered.length > maxVisible) {
      this.devPanelContainer.add(this.add.text(panelX + panelW / 2, panelY + panelH - 5,
        `+${filtered.length - maxVisible} mais...`, {
          fontSize: '8px', color: '#555555', fontFamily: 'monospace',
        }).setOrigin(0.5, 1));
    }
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
