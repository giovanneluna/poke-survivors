import Phaser from 'phaser';
import type { UpgradeOption, PlayerState, HeldItemType, AttackType, GachaRewardType, PokemonForm, EnemyType } from '../types';
import { ATTACKS } from '../config';
import { SoundManager } from '../audio/SoundManager';
import { Boss } from '../entities/Boss';
import { GameScene } from './GameScene';
import type { RunStats } from '../systems/RunRecorder';
import { getCoins } from '../systems/SaveSystem';
import { MiniMap } from '../ui/MiniMap';
import { getComboSystem } from '../systems/ComboSystem';

interface StatsData extends PlayerState {
  time: number;
  starterKey: string;
  formName: string;
  heldItems: HeldItemType[];
  attacks: Array<{ type: AttackType; level: number }>;
  damageTotals: Record<string, number>;
  combo: number;
  comboActive: boolean;
}

interface GameOverData {
  readonly level: number;
  readonly kills: number;
  readonly time: number;
  readonly runStats?: RunStats;
  readonly coinsEarned?: number;
  readonly newRecords?: { time: boolean; kills: boolean; level: boolean };
  readonly bestCombo?: number;
  readonly starterKey?: string;
  readonly formName?: string;
}

export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private formText!: Phaser.GameObjects.Text;
  private slotsText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private reviveText!: Phaser.GameObjects.Text;
  private itemsContainer!: Phaser.GameObjects.Container;
  private attacksContainer!: Phaser.GameObjects.Container;
  private lastItemsHash = '';
  private lastAttacksHash = '';
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
  private comboText!: Phaser.GameObjects.Text;
  private comboLabelText!: Phaser.GameObjects.Text;
  private miniMap: MiniMap | null = null;
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
    const { width, height } = this.cameras.main;

    this.hpBar = this.add.graphics().setDepth(100);
    this.add.text(10, 8, 'HP', { ...this.textStyle, fontSize: '12px' }).setDepth(100);
    this.reviveText = this.add.text(190, 12, '', {
      ...this.textStyle, fontSize: '10px', color: '#ffaa00',
    }).setDepth(100);
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

    // ── Botão Debug Hitbox (localhost only) ──────────────────────────
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let debugYOffset = 0;
    if (isLocal) {
      const debugBtn = this.add.text(width - 10, 74, '☐', {
        fontSize: '14px', color: '#888888',
      }).setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
      let debugOn = false;
      debugBtn.on('pointerdown', () => {
        debugOn = !debugOn;
        debugBtn.setText(debugOn ? '☑' : '☐');
        debugBtn.setColor(debugOn ? '#ff4444' : '#888888');
        // Toggle debug em TODAS as scenes com physics
        this.game.scene.scenes.forEach((s) => {
          if (s.physics?.world) {
            if (debugOn) {
              if (!s.physics.world.debugGraphic) {
                s.physics.world.createDebugGraphic();
              }
              s.physics.world.drawDebug = true;
            } else {
              s.physics.world.drawDebug = false;
              s.physics.world.debugGraphic?.clear();
            }
          }
        });
      });
      debugYOffset = 22;
    }

    // ── Combo Display ─────────────────────────────────────────────────
    this.comboText = this.add.text(width / 2, 32, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.comboLabelText = this.add.text(width / 2, 50, '', {
      fontSize: '12px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    // ── Mini-Map ──────────────────────────────────────────────────────
    this.miniMap = new MiniMap(this, width - 130, height - 140, 120, 3000, 3000);

    // ── Damage Tracker (abaixo de kills/mute/pause/debug) ──────────────
    this.damageContainer = this.add.container(width - 10, 72 + debugYOffset).setDepth(100);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('stats-update', (stats: StatsData) => this.updateHUD(stats));
    gameScene.events.on('level-up', (options: UpgradeOption[], level: number, rerolls: number) => this.showLevelUp(options, level, rerolls));
    gameScene.events.on('game-over', (data: GameOverData) => this.showGameOver(data));
    gameScene.events.on('pokemon-evolved', (data: { fromName: string; toName: string; form: string; newSlots: number }) => {
      this.showEvolutionOverlay(data.fromName, data.toName);
    });
    gameScene.events.on('revive-used', (remaining: number) => {
      const cam = this.cameras.main;
      const msg = this.add.text(cam.width / 2, cam.height / 2 - 60, 'REVIVE!', {
        fontSize: '28px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(999);
      const sub = this.add.text(cam.width / 2, cam.height / 2 - 30, `${remaining} restante${remaining !== 1 ? 's' : ''}`, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(999);
      this.tweens.add({ targets: [msg, sub], alpha: 0, y: '-=40', duration: 2000, delay: 800, onComplete: () => { msg.destroy(); sub.destroy(); } });
    });

    // ── Type effectiveness floating text ──────────────────────────────
    gameScene.events.on('type-effectiveness', (data: { x: number; y: number; label: string; color: string; multiplier: number }) => {
      const cam = this.scene.get('GameScene').cameras.main;
      const screenX = data.x - cam.scrollX;
      const screenY = data.y - cam.scrollY;
      if (screenX < -50 || screenX > cam.width + 50 || screenY < -50 || screenY > cam.height + 50) return;
      const txt = this.add.text(screenX, screenY, data.label, {
        fontSize: data.multiplier >= 1.5 ? '11px' : '9px',
        color: data.color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: txt, y: screenY - 25, alpha: 0, duration: 800, ease: 'Power2', onComplete: () => txt.destroy() });
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
    const nameColor = stats.starterKey === 'squirtle' ? '#44aaff'
      : stats.starterKey === 'bulbasaur' ? '#22cc44'
      : '#ff8844';
    this.formText.setColor(nameColor);
    const atkCount = stats.attacks?.length ?? 0;
    const itemCount = stats.heldItems?.length ?? 0;
    this.slotsText.setText(`Atk: ${atkCount}/${stats.attackSlots}  Item: ${itemCount}/${stats.passiveSlots}`);
    this.killsText.setText(`Kills: ${stats.kills}`);
    if (stats.revives > 0) {
      const label = stats.reviveIsMax ? 'MAX REV' : 'REV';
      this.reviveText.setText(`${label} x${stats.revives}`);
      this.reviveText.setColor(stats.reviveIsMax ? '#ff44ff' : '#ffaa00');
      this.reviveText.setVisible(true);
    } else {
      this.reviveText.setVisible(false);
    }
    const minutes = Math.floor(stats.time / 60);
    const seconds = stats.time % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Held Items (bottom-left) — skip rebuild if unchanged
    const itemsHash = stats.heldItems?.join(',') ?? '';
    if (itemsHash !== this.lastItemsHash) {
      this.lastItemsHash = itemsHash;
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
          mysticWater: 'held-mystic-water',
          neverMeltIce: 'held-never-melt-ice',
          miracleSeed: 'held-miracle-seed',
          blackSludge: 'held-black-sludge',
          bigRoot: 'held-big-root',
          leafStone: 'held-leaf-stone',
        };

        stats.heldItems.forEach((item, i) => {
          const icon = this.add.image(45 + i * 18, 5, textureMap[item] ?? 'held-charcoal').setScale(1.2);
          this.itemsContainer.add(icon);
        });
      }
    }

    // Attacks display (top-left, below slots) — skip rebuild if unchanged
    const attacksHash = stats.attacks?.map(a => `${a.type}:${a.level}`).join(',') ?? '';
    if (attacksHash !== this.lastAttacksHash) {
      this.lastAttacksHash = attacksHash;
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

    // Damage tracker (top-right, below pause button)
    this.updateDamageDisplay(stats.damageTotals);

    // Combo display
    if (stats.comboActive && stats.combo >= 10) {
      const tier = getComboSystem().getCurrentTier();
      if (tier) {
        this.comboText.setText(`${stats.combo}x COMBO!`);
        this.comboText.setFontSize(tier.fontSize);
        this.comboText.setColor(`#${tier.color.toString(16).padStart(6, '0')}`);
        this.comboText.setAlpha(1);
        if (tier.label) {
          this.comboLabelText.setText(tier.label);
          this.comboLabelText.setAlpha(1);
        } else {
          this.comboLabelText.setAlpha(0);
        }
      }
    } else {
      this.comboText.setAlpha(0);
      this.comboLabelText.setAlpha(0);
    }

    // Mini-map update
    if (this.miniMap) {
      const gs = this.scene.get('GameScene') as GameScene;
      const enemies = gs.enemyGroup?.getChildren().map(c => {
        const s = c as Phaser.Physics.Arcade.Sprite;
        return { x: s.x, y: s.y, active: s.active };
      }) ?? [];
      this.miniMap.update({
        playerX: gs.player?.x ?? 0,
        playerY: gs.player?.y ?? 0,
        enemies,
        boss: null,
        pickups: [],
      });
    }
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

      // Classificar tipo do upgrade pelo prefixo do ID
      const tag = option.id.startsWith('evolve') ? { label: 'EVOLUÇÃO', color: '#ff4400', bg: 0x442200, hoverBg: 0x663300, border: 3 }
        : option.id.startsWith('new')     ? { label: 'HABILIDADE', color: '#44dd66', bg: 0x1a3322, hoverBg: 0x2a4433, border: 2 }
        : option.id.startsWith('upgrade') ? { label: 'MELHORIA', color: '#44aaff', bg: 0x1a2244, hoverBg: 0x2a3355, border: 2 }
        : option.id.startsWith('item')    ? { label: 'ITEM', color: '#ffcc00', bg: 0x332b1a, hoverBg: 0x443c2a, border: 2 }
        :                                   { label: 'PASSIVA', color: '#cc88ff', bg: 0x2a1a33, hoverBg: 0x3b2a44, border: 2 };

      const card = this.add.graphics();
      card.fillStyle(tag.bg, 0.95);
      card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      card.lineStyle(tag.border, option.color);
      card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      this.levelUpContainer.add(card);

      // Tag de categoria
      const tagBadgeW = tag.label.length * 7 + 10;
      const tagBadgeH = 16;
      const tagBadgeX = cx - tagBadgeW / 2;
      const tagBadgeY = cy - cardHeight / 2 + 4;
      const badgeGfx = this.add.graphics();
      badgeGfx.fillStyle(Phaser.Display.Color.HexStringToColor(tag.color).color, 0.2);
      badgeGfx.fillRoundedRect(tagBadgeX, tagBadgeY, tagBadgeW, tagBadgeH, 3);
      this.levelUpContainer.add(badgeGfx);
      const tagText = this.add.text(cx, tagBadgeY + tagBadgeH / 2, tag.label, {
        fontSize: '8px', color: tag.color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.levelUpContainer.add(tagText);

      const icon = this.add.image(cx, cy - 35, option.icon).setScale(2).setOrigin(0.5);
      this.levelUpContainer.add(icon);

      const name = this.add.text(cx, cy, option.name, {
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
        card.fillStyle(tag.hoverBg, 0.95);
        card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(3, option.color);
        card.strokeRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
      });

      hitbox.on('pointerout', () => {
        card.clear();
        card.fillStyle(tag.bg, 0.95);
        card.fillRoundedRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(tag.border, option.color);
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

    const diceIcon = hasRerolls ? '\uD83C\uDFB2 ' : '';
    const rerollBtn = this.add.text(width / 2, rerollY, `${diceIcon}${rerollText}`, {
      fontSize: '15px',
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

    if (roll < 30) {
      rewardType = 'skillUpgrade';
      rewardName = 'SKILL UPGRADE!';
      rewardColor = '#44ff44';
    } else if (roll < 52) {
      rewardType = 'heldItem';
      rewardName = 'HELD ITEM!';
      rewardColor = '#44aaff';
    } else if (roll < 70) {
      rewardType = 'rareCandy';
      rewardName = 'RARE CANDY!';
      rewardColor = '#FFD700';
    } else if (roll < 85) {
      rewardType = 'evolutionStone';
      rewardName = 'EVOLUTION STONE!';
      rewardColor = '#ff8800';
    } else if (roll < 93) {
      rewardType = 'revive';
      rewardName = 'REVIVE!';
      rewardColor = '#ffaa00';
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
        this.showBossSelector(gs);
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
      grass: '#22cc44', poison: '#9944cc',
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

  private showBossSelector(gs: GameScene): void {
    const { width, height } = this.cameras.main;

    // Overlay container sobre tudo
    const container = this.add.container(0, 0).setDepth(600);

    // Background escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setInteractive(); // bloqueia cliques atrás
    container.add(bg);

    const bosses: Array<{ key: string; label: string; color: string }> = [
      { key: 'raticate', label: 'Raticate', color: '#cc9966' },
      { key: 'arbok', label: 'Arbok', color: '#aa44aa' },
      { key: 'nidoking', label: 'Nidoking', color: '#9944cc' },
      { key: 'snorlax', label: 'Snorlax', color: '#44aa88' },
      { key: 'beedrill', label: 'Beedrill', color: '#cccc22' },
      { key: 'vileplume', label: 'Vileplume', color: '#ff4488' },
      { key: 'primeape', label: 'Primeape', color: '#cc6644' },
      { key: 'gengar', label: 'Gengar', color: '#9944ff' },
      { key: 'fearow', label: 'Fearow', color: '#aa8866' },
      { key: 'pidgeot', label: 'Pidgeot', color: '#ffaa44' },
      { key: 'machamp', label: 'Machamp', color: '#6688cc' },
      { key: 'golem', label: 'Golem', color: '#886644' },
      { key: 'alakazam-boss', label: 'Alakazam', color: '#ffdd44' },
    ];

    // Título
    const title = this.add.text(width / 2, 40, 'SPAWN BOSS', {
      fontSize: '16px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(title);

    // Grid 3 colunas
    const cols = 3;
    const btnW = 100;
    const btnH = 28;
    const gap = 8;
    const gridW = cols * btnW + (cols - 1) * gap;
    const startX = (width - gridW) / 2;
    const startY = 70;

    bosses.forEach((boss, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * (btnW + gap);
      const by = startY + row * (btnH + gap);

      const gfx = this.add.graphics();
      gfx.fillStyle(0x1a1a3e, 0.95);
      gfx.fillRoundedRect(bx, by, btnW, btnH, 4);
      gfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(boss.color).color, 0.6);
      gfx.strokeRoundedRect(bx, by, btnW, btnH, 4);
      container.add(gfx);

      const label = this.add.text(bx + btnW / 2, by + btnH / 2, boss.label, {
        fontSize: '11px', color: boss.color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(label);

      const hit = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => label.setColor('#ffffff'));
      hit.on('pointerout', () => label.setColor(boss.color));
      hit.on('pointerdown', () => {
        SoundManager.playClick();
        gs.getSpawnSystem().spawnBoss(boss.key as EnemyType);
        container.destroy();
      });
      container.add(hit);
    });

    // Botão fechar
    const closeBtn = this.add.text(width / 2, startY + Math.ceil(bosses.length / cols) * (btnH + gap) + 10,
      '[ FECHAR ]', {
        fontSize: '12px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
    closeBtn.on('pointerdown', () => { SoundManager.playClick(); container.destroy(); });
    container.add(closeBtn);
  }

  private showGameOver(data: GameOverData): void {
    const { width, height } = this.cameras.main;
    this.gameOverContainer.removeAll(true);

    // ── Background ────────────────────────────────────────────────
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    this.gameOverContainer.add(bg);

    // ── Camera shake ──────────────────────────────────────────────
    this.cameras.main.shake(400, 0.008);

    // ── Title ─────────────────────────────────────────────────────
    const title = this.add.text(width / 2, 30, 'GAME OVER', {
      fontSize: '36px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);
    this.gameOverContainer.add(title);
    this.tweens.add({ targets: title, alpha: 1, scaleX: { from: 1.5, to: 1 }, scaleY: { from: 1.5, to: 1 }, duration: 400, ease: 'Back.Out' });

    // ── Form name ─────────────────────────────────────────────────
    const nameColor = data.starterKey === 'squirtle' ? '#44aaff' : data.starterKey === 'bulbasaur' ? '#22cc44' : '#ff8844';
    const formText = this.add.text(width / 2, 62, data.formName ?? 'Pokémon', {
      fontSize: '14px', color: nameColor, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.gameOverContainer.add(formText);

    const minutes = Math.floor(data.time / 60);
    const seconds = data.time % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const rs = data.runStats;

    // ── Stats grid (staggered fade-in) ────────────────────────────
    const colLeftX = width / 2 - 100;
    const colRightX = width / 2 + 100;
    let yPos = 90;
    const rowH = 22;
    let animDelay = 200;

    const addStatRow = (x: number, label: string, value: string, color = '#ffffff', isRecord = false): void => {
      const labelText = this.add.text(x - 5, yPos, label, {
        fontSize: '11px', color: '#888888', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0).setAlpha(0);
      this.gameOverContainer.add(labelText);

      const valueText = this.add.text(x + 5, yPos, value, {
        fontSize: '12px', color, fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0).setAlpha(0);
      this.gameOverContainer.add(valueText);

      this.tweens.add({ targets: [labelText, valueText], alpha: 1, y: yPos - 3, duration: 300, delay: animDelay, ease: 'Power2' });

      if (isRecord) {
        const recordBadge = this.add.text(x + 5 + value.length * 8 + 8, yPos, 'NOVO RECORDE!', {
          fontSize: '9px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0, 0).setAlpha(0);
        this.gameOverContainer.add(recordBadge);
        this.tweens.add({
          targets: recordBadge, alpha: 1, duration: 300, delay: animDelay + 200,
          onComplete: () => {
            this.tweens.add({ targets: recordBadge, scaleX: { from: 1, to: 1.2 }, scaleY: { from: 1, to: 1.2 }, duration: 400, yoyo: true, repeat: 2 });
          },
        });
      }

      animDelay += 80;
    };

    // Left column
    addStatRow(colLeftX, 'Tempo:', timeStr, '#ffffff', data.newRecords?.time);
    yPos += rowH;
    addStatRow(colLeftX, 'Level:', `${data.level}`, '#ffcc00', data.newRecords?.level);
    yPos += rowH;
    addStatRow(colLeftX, 'Kills:', `${data.kills}`, '#ff6666', data.newRecords?.kills);
    yPos += rowH;
    addStatRow(colLeftX, 'Best Combo:', `${data.bestCombo ?? 0}x`, data.bestCombo && data.bestCombo >= 50 ? '#ffd700' : '#ffffff');

    // Right column
    yPos = 90;
    if (rs) {
      addStatRow(colRightX, 'Dano Total:', rs.totalDamageDealt >= 1000 ? `${(rs.totalDamageDealt / 1000).toFixed(1)}k` : `${Math.floor(rs.totalDamageDealt)}`, '#ff8844');
      yPos += rowH;
      addStatRow(colRightX, 'Bosses:', `${rs.bossesDefeated.length}`, '#ffdd44');
      yPos += rowH;
      addStatRow(colRightX, 'Berries:', `${rs.berriesCollected}`, '#44ff44');
      yPos += rowH;
      addStatRow(colRightX, 'XP Coletado:', `${rs.xpCollected}`, '#44bbff');
    }

    // ── Kill breakdown (top 5) ────────────────────────────────────
    yPos = 182;
    if (rs && Object.keys(rs.killsByType).length > 0) {
      const killLabel = this.add.text(width / 2, yPos, '── KILLS POR TIPO ──', {
        fontSize: '10px', color: '#666666', fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0);
      this.gameOverContainer.add(killLabel);
      this.tweens.add({ targets: killLabel, alpha: 1, duration: 300, delay: animDelay });
      animDelay += 60;
      yPos += 16;

      const sortedKills = Object.entries(rs.killsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const totalW = sortedKills.length * 65;
      const startKillX = (width - totalW) / 2 + 32;

      sortedKills.forEach(([type, count], i) => {
        const kx = startKillX + i * 65;
        const name = type.charAt(0).toUpperCase() + type.slice(1);
        const nameT = this.add.text(kx, yPos, name, {
          fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace',
        }).setOrigin(0.5, 0).setAlpha(0);
        const countT = this.add.text(kx, yPos + 12, `×${count}`, {
          fontSize: '11px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 0).setAlpha(0);
        this.gameOverContainer.add(nameT);
        this.gameOverContainer.add(countT);
        this.tweens.add({ targets: [nameT, countT], alpha: 1, duration: 200, delay: animDelay + i * 50 });
      });
      animDelay += sortedKills.length * 50 + 100;
      yPos += 30;
    }

    // ── Attacks used ──────────────────────────────────────────────
    yPos += 5;
    if (rs && rs.attacksUsed.length > 0) {
      const atkLabel = this.add.text(width / 2, yPos, '── ATAQUES USADOS ──', {
        fontSize: '10px', color: '#666666', fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0);
      this.gameOverContainer.add(atkLabel);
      this.tweens.add({ targets: atkLabel, alpha: 1, duration: 300, delay: animDelay });
      animDelay += 60;
      yPos += 16;

      const totalAtkW = rs.attacksUsed.length * 55;
      const startAtkX = (width - totalAtkW) / 2 + 27;

      rs.attacksUsed.forEach((atk, i) => {
        const ax = startAtkX + i * 55;
        const name = atk.type.charAt(0).toUpperCase() + atk.type.slice(1);
        const atkT = this.add.text(ax, yPos, `${name}\nLv${atk.level}`, {
          fontSize: '8px', color: '#ff8844', fontFamily: 'monospace', align: 'center',
        }).setOrigin(0.5, 0).setAlpha(0);
        this.gameOverContainer.add(atkT);
        this.tweens.add({ targets: atkT, alpha: 1, duration: 200, delay: animDelay + i * 40 });
      });
      animDelay += rs.attacksUsed.length * 40 + 100;
      yPos += 28;
    }

    // ── PokéDollars earned (animated counter) ────────────────────
    yPos += 8;
    const coinsEarned = data.coinsEarned ?? 0;
    const coinLabel = this.add.text(width / 2, yPos, 'POKÉDOLLARS GANHOS', {
      fontSize: '10px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);
    this.gameOverContainer.add(coinLabel);

    const coinValueText = this.add.text(width / 2, yPos + 16, '₽ 0', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.gameOverContainer.add(coinValueText);

    const totalCoins = getCoins();
    const totalCoinText = this.add.text(width / 2, yPos + 40, `Total: ₽ ${totalCoins}`, {
      fontSize: '10px', color: '#aa8833', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);
    this.gameOverContainer.add(totalCoinText);

    // Animate coin counter
    this.tweens.add({
      targets: [coinLabel, coinValueText, totalCoinText], alpha: 1, duration: 300, delay: animDelay,
      onComplete: () => {
        const counter = { value: 0 };
        this.tweens.add({
          targets: counter,
          value: coinsEarned,
          duration: Math.min(1500, coinsEarned * 5),
          ease: 'Power2',
          onUpdate: () => {
            coinValueText.setText(`₽ ${Math.floor(counter.value)}`);
          },
        });
      },
    });
    animDelay += 200;
    yPos += 60;

    // ── Buttons ───────────────────────────────────────────────────
    const btnY = Math.min(yPos + 10, height - 60);

    const restartBtn = this.add.text(width / 2, btnY, '[ TENTAR DE NOVO ]', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);
    this.gameOverContainer.add(restartBtn);

    restartBtn.on('pointerover', () => { restartBtn.setColor('#ffffff'); SoundManager.playHover(); });
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffcc00'));
    restartBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.stop();
      this.scene.get('GameScene').scene.restart();
    });

    const menuBtn = this.add.text(width / 2, btnY + 30, '[ MENU PRINCIPAL ]', {
      fontSize: '12px', color: '#888888', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);
    this.gameOverContainer.add(menuBtn);

    menuBtn.on('pointerover', () => { menuBtn.setColor('#ffffff'); SoundManager.playHover(); });
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
    });

    this.tweens.add({ targets: [restartBtn, menuBtn], alpha: 1, duration: 400, delay: animDelay + 300 });

    this.gameOverContainer.setVisible(true);
  }
}
