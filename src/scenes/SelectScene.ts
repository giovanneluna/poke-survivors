import Phaser from 'phaser';
import { STARTERS, DIFFICULTY } from '../config';
import type { StarterConfig } from '../config';
import type { DevConfig, Difficulty, PokemonForm } from '../types';
import { SoundManager } from '../audio/SoundManager';
import { getCoins, getLastRun, initSaveSystem, isStarterUnlocked, isPhase2Unlocked } from '../systems/SaveSystem';
import { fontSize, scaled } from '../utils/ui-scale';
import { t } from '../i18n';
/** Check if a starter is effectively unlocked (config default OR save data). */
function isEffectivelyUnlocked(starter: StarterConfig): boolean {
  return starter.unlocked || isStarterUnlocked(starter.key);
}

export class SelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private selectedThemeId = 'emerald';
  private selectedStageId = 'phase1';
  private cards: Phaser.GameObjects.Container[] = [];
  private cardGraphics: Phaser.GameObjects.Graphics[] = [];
  private phaseOverlay: Phaser.GameObjects.Container | null = null;
  private difficultyOverlay: Phaser.GameObjects.Container | null = null;
  private devConfigOverlay: Phaser.GameObjects.Container | null = null;
  private wipOverlay: Phaser.GameObjects.Container | null = null;
  private devKeyHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super({ key: 'SelectScene' });
  }

  create(): void {
    this.selectedIndex = 0;
    this.selectedThemeId = 'emerald';
    this.selectedStageId = 'phase1';
    this.cards = [];
    this.cardGraphics = [];
    this.phaseOverlay = null;
    this.difficultyOverlay = null;
    this.devConfigOverlay = null;
    this.wipOverlay = null;
    // ── URL param shortcut: ?editor=true ─────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('editor') === 'true') {
      this.scene.start('MapEditorScene');
      return;
    }

    const { width, height } = this.cameras.main;

    // ── Background ───────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f23);
    bg.fillRect(0, 0, width, height);

    // Padrão de grid sutil
    bg.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

    // ── Título ───────────────────────────────────────────────────────
    this.add.text(width / 2, scaled(35), t('select.title'), {
      fontSize: fontSize(24),
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, scaled(60), t('select.subtitle'), {
      fontSize: fontSize(10),
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // ── Cards de personagem (grid 3 colunas) ─────────────────────────
    const COLS = 3;
    const maxCardW = scaled(160);
    const gap = scaled(15);
    const cardWidth = Math.min(maxCardW, (width - gap * (COLS + 1)) / COLS);
    const cardHeight = Math.min(scaled(230), (height - scaled(220)) / 2);
    const rowGap = scaled(12);

    STARTERS.forEach((starter, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const rowCount = Math.min(COLS, STARTERS.length - row * COLS);
      const rowTotalW = rowCount * cardWidth + (rowCount - 1) * gap;
      const rowStartX = (width - rowTotalW) / 2;
      const cx = rowStartX + col * (cardWidth + gap) + cardWidth / 2;
      const baseY = scaled(88) + cardHeight / 2;
      const cy = baseY + row * (cardHeight + rowGap);
      this.createCharacterCard(starter, i, cx, cy, cardWidth, cardHeight);
    });

    // Tema default — será atualizado por estágio em startGame()
    this.selectedThemeId = 'emerald';

    // ── Botão "COMEÇAR" ──────────────────────────────────────────────
    const btnY = height - scaled(55);
    const btnW = scaled(200);
    const btnH = scaled(45);

    const btnBg = this.add.graphics().setDepth(10);
    this.drawStartButton(btnBg, width / 2, btnY, btnW, btnH, false);

    const btnText = this.add.text(width / 2, btnY, t('select.start'), {
      fontSize: fontSize(18),
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    const btnHitbox = this.add.rectangle(width / 2, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(12);

    btnHitbox.on('pointerover', () => {
      this.drawStartButton(btnBg, width / 2, btnY, btnW, btnH, true);
      btnText.setColor('#ffcc00');
      SoundManager.playHover();
    });
    btnHitbox.on('pointerout', () => {
      this.drawStartButton(btnBg, width / 2, btnY, btnW, btnH, false);
      btnText.setColor('#ffffff');
    });
    btnHitbox.on('pointerdown', () => {
      const selected = STARTERS[this.selectedIndex];
      if (!isEffectivelyUnlocked(selected)) return;
      SoundManager.playClick();

      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (selected.key === 'bulbasaur' && !isLocal) {
        this.showWipWarning();
        return;
      }
      this.showPhaseSelection();
    });

    // ── Botão "Voltar" ───────────────────────────────────────────────
    const backBtn = this.add.text(scaled(20), height - scaled(25), t('ui.back'), {
      fontSize: fontSize(12),
      color: '#666666',
      fontFamily: 'monospace',
    }).setDepth(10).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => { backBtn.setColor('#ffffff'); SoundManager.playHover(); });
    backBtn.on('pointerout', () => backBtn.setColor('#666666'));
    backBtn.on('pointerdown', () => { SoundManager.playClick(); this.scene.start('TitleScene'); });

    // ── Botão [DATA] (só localhost) ──────────────────────────────
    {
      const host = window.location.hostname;
      const isLocalEnv = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (isLocalEnv) {
        const dataBtn = this.add.text(width - scaled(20), height - scaled(25), '[DATA]', {
          fontSize: fontSize(12), color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0.5).setDepth(10).setInteractive({ useHandCursor: true });

        dataBtn.on('pointerover', () => { dataBtn.setColor('#44ffaa'); SoundManager.playHover(); });
        dataBtn.on('pointerout', () => dataBtn.setColor('#00ff88'));
        dataBtn.on('pointerdown', () => {
          SoundManager.playClick();
          this.scene.start('DataViewerScene');
        });

        // ── Botão [EDITOR] ──────────────────────────────────────
        const editorBtn = this.add.text(width - scaled(20), height - scaled(45), '[EDITOR]', {
          fontSize: fontSize(12), color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0.5).setDepth(10).setInteractive({ useHandCursor: true });

        editorBtn.on('pointerover', () => { editorBtn.setColor('#ffdd44'); SoundManager.playHover(); });
        editorBtn.on('pointerout', () => editorBtn.setColor('#ffaa00'));
        editorBtn.on('pointerdown', () => {
          SoundManager.playClick();
          this.scene.start('MapEditorScene');
        });
      }
    }

    // ── Coin counter ────────────────────────────────────────────────
    initSaveSystem();
    const coins = getCoins();
    if (coins > 0) {
      this.add.text(width - scaled(20), scaled(15), `₽ ${coins}`, {
        fontSize: fontSize(14), color: '#ffcc00', fontFamily: 'monospace',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(1, 0.5).setDepth(10);
    }

    // ── Last Run info ────────────────────────────────────────────────
    const lastRun = getLastRun();
    if (lastRun) {
      const lm = Math.floor(lastRun.time / 60);
      const ls = lastRun.time % 60;
      const lTime = `${lm}:${String(ls).padStart(2, '0')}`;
      this.add.text(
        width / 2, scaled(76),
        t('select.lastRun', { form: lastRun.formName, level: lastRun.level, time: lTime, kills: lastRun.kills, coins: lastRun.coinsEarned }),
        { fontSize: fontSize(9), color: '#555555', fontFamily: 'monospace' },
      ).setOrigin(0.5).setDepth(10);
    }

    // ── Seleção inicial ──────────────────────────────────────────────
    this.selectCard(0);

    // ── Fade in ──────────────────────────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ── Overlay WIP Warning ───────────────────────────────────────────
  private showWipWarning(): void {
    if (this.wipOverlay) return;

    const { width, height } = this.cameras.main;
    this.wipOverlay = this.add.container(0, 0).setDepth(200);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    bg.setInteractive();
    this.wipOverlay.add(bg);

    // Ícone de alerta
    this.wipOverlay.add(this.add.text(width / 2, height / 2 - scaled(70), '!', {
      fontSize: fontSize(40), color: '#ff8800', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5));

    this.wipOverlay.add(this.add.text(width / 2, height / 2 - scaled(30), t('select.wipTitle'), {
      fontSize: fontSize(18), color: '#ff8800', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5));

    this.wipOverlay.add(this.add.text(width / 2, height / 2 + scaled(5), t('select.wipMsg'), {
      fontSize: fontSize(12), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5));

    this.wipOverlay.add(this.add.text(width / 2, height / 2 + scaled(45), t('select.wipConfirm'), {
      fontSize: fontSize(12), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Botão SIM
    const yesGfx = this.add.graphics();
    const btnW = scaled(120);
    const btnH = scaled(35);
    const btnY = height / 2 + scaled(85);
    const drawYes = (hover: boolean): void => {
      yesGfx.clear();
      yesGfx.fillStyle(hover ? 0x44bb44 : 0x228822, 0.95);
      yesGfx.fillRoundedRect(width / 2 - btnW - scaled(10), btnY - btnH / 2, btnW, btnH, 8);
      yesGfx.lineStyle(2, hover ? 0x66dd66 : 0x33aa33);
      yesGfx.strokeRoundedRect(width / 2 - btnW - scaled(10), btnY - btnH / 2, btnW, btnH, 8);
    };
    drawYes(false);
    this.wipOverlay.add(yesGfx);

    const yesText = this.add.text(width / 2 - btnW / 2 - scaled(10), btnY, t('select.wipYes'), {
      fontSize: fontSize(12), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.wipOverlay.add(yesText);

    const yesHit = this.add.rectangle(width / 2 - btnW / 2 - scaled(10), btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    yesHit.on('pointerover', () => { drawYes(true); SoundManager.playHover(); });
    yesHit.on('pointerout', () => drawYes(false));
    yesHit.on('pointerdown', () => {
      SoundManager.playClick();
      this.wipOverlay?.destroy(true);
      this.wipOverlay = null;
      this.showPhaseSelection();
    });
    this.wipOverlay.add(yesHit);

    // Botão NÃO
    const noGfx = this.add.graphics();
    const drawNo = (hover: boolean): void => {
      noGfx.clear();
      noGfx.fillStyle(hover ? 0x664444 : 0x442222, 0.95);
      noGfx.fillRoundedRect(width / 2 + scaled(10), btnY - btnH / 2, btnW, btnH, 8);
      noGfx.lineStyle(2, hover ? 0x886666 : 0x553333);
      noGfx.strokeRoundedRect(width / 2 + scaled(10), btnY - btnH / 2, btnW, btnH, 8);
    };
    drawNo(false);
    this.wipOverlay.add(noGfx);

    const noText = this.add.text(width / 2 + btnW / 2 + scaled(10), btnY, t('select.wipNo'), {
      fontSize: fontSize(12), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.wipOverlay.add(noText);

    const noHit = this.add.rectangle(width / 2 + btnW / 2 + scaled(10), btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    noHit.on('pointerover', () => { drawNo(true); SoundManager.playHover(); });
    noHit.on('pointerout', () => drawNo(false));
    noHit.on('pointerdown', () => {
      SoundManager.playClick();
      this.wipOverlay?.destroy(true);
      this.wipOverlay = null;
    });
    this.wipOverlay.add(noHit);

    // ESC para cancelar
    this.input.keyboard?.once('keydown-ESC', () => {
      SoundManager.playClick();
      this.wipOverlay?.destroy(true);
      this.wipOverlay = null;
    });
  }

  // ── Overlay de seleção de fase ─────────────────────────────────────
  private showPhaseSelection(): void {
    if (this.phaseOverlay) return;

    const { width, height } = this.cameras.main;
    this.phaseOverlay = this.add.container(0, 0).setDepth(200);

    // Fundo escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    bg.setInteractive();
    this.phaseOverlay.add(bg);

    // Título
    this.phaseOverlay.add(this.add.text(width / 2, height / 2 - scaled(120), t('phase.title'), {
      fontSize: fontSize(22), color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5));

    // Dev mode: só aparece em localhost
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    const phase2Unlocked = isPhase2Unlocked();
    const cardCount = isLocal ? 3 : 2;
    const cardY = height / 2 + scaled(10);
    const spacing = scaled(220);
    const totalW = (cardCount - 1) * spacing;
    const startX = width / 2 - totalW / 2;

    // Phase 1 card
    this.createPhaseCard(startX, cardY, t('phase.1.title'), t('phase.1.subtitle'), 0xff4400, 0xff6622,
      t('phase.1.desc'), () => {
        this.selectedStageId = 'phase1';
        this.showDifficultySelection();
      });

    // Phase 2 card
    const card2X = startX + spacing;
    if (phase2Unlocked) {
      this.createPhaseCard(card2X, cardY, 'FASE 2', 'Kanto Coast', 0x2288ff, 0x44aaff,
        'Novos Pokémon\nNovos Bosses\nNovos Eventos', () => {
          this.selectedStageId = 'phase2';
          this.showDifficultySelection();
        });
    } else {
      this.createLockedPhaseCard(card2X, cardY, 'FASE 2', 'Complete a Fase 1\npara desbloquear');
    }

    if (isLocal) {
      const card3X = startX + spacing * 2;
      this.createPhaseCard(card3X, cardY, t('phase.dev.title'), t('phase.dev.subtitle'), 0x44aaff, 0x66ccff,
        t('phase.dev.desc'), () => {
          this.showDevConfigOverlay();
        });
    }

    // Botão cancelar
    const cancelBtn = this.add.text(width / 2, height / 2 + scaled(145), t('ui.cancel'), {
      fontSize: fontSize(12), color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerover', () => cancelBtn.setColor('#ffffff'));
    cancelBtn.on('pointerout', () => cancelBtn.setColor('#666666'));
    cancelBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.hidePhaseSelection();
    });
    this.phaseOverlay.add(cancelBtn);

    // Esc para cancelar
    this.input.keyboard?.once('keydown-ESC', () => {
      SoundManager.playClick();
      this.hidePhaseSelection();
    });
  }

  private createPhaseCard(
    cx: number, cy: number,
    title: string, subtitle: string,
    color: number, hoverColor: number,
    description: string,
    onClick: () => void,
  ): void {
    if (!this.phaseOverlay) return;

    const cardW = scaled(200);
    const cardH = scaled(180);

    const gfx = this.add.graphics();
    const drawCard = (hover: boolean): void => {
      gfx.clear();
      // Sombra
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(cx - cardW / 2 + 3, cy - cardH / 2 + 3, cardW, cardH, 12);
      // Fundo
      gfx.fillStyle(hover ? 0x1e1e44 : 0x151530, 0.95);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      // Borda
      gfx.lineStyle(2, hover ? hoverColor : color, hover ? 1 : 0.7);
      gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      // Barra superior colorida
      gfx.fillStyle(color, hover ? 0.4 : 0.2);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, scaled(40), { tl: 12, tr: 12, bl: 0, br: 0 });
    };

    drawCard(false);
    this.phaseOverlay.add(gfx);

    // Título
    this.phaseOverlay.add(this.add.text(cx, cy - cardH / 2 + scaled(14), title, {
      fontSize: fontSize(14), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    // Subtítulo
    const subColor = color === 0xff4400 ? '#ff6622' : '#66ccff';
    this.phaseOverlay.add(this.add.text(cx, cy - cardH / 2 + scaled(32), subtitle, {
      fontSize: fontSize(10), color: subColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Descrição
    this.phaseOverlay.add(this.add.text(cx, cy + scaled(10), description, {
      fontSize: fontSize(11), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5));

    // Hitbox interativo
    const hitbox = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    hitbox.on('pointerover', () => { drawCard(true); SoundManager.playHover(); });
    hitbox.on('pointerout', () => drawCard(false));
    hitbox.on('pointerdown', () => {
      SoundManager.playStart();
      onClick();
    });
    this.phaseOverlay.add(hitbox);
  }

  private createLockedPhaseCard(cx: number, cy: number, title: string, description: string): void {
    if (!this.phaseOverlay) return;

    const cardW = scaled(200);
    const cardH = scaled(180);

    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.5);
    gfx.fillRoundedRect(cx - cardW / 2 + 3, cy - cardH / 2 + 3, cardW, cardH, 12);
    gfx.fillStyle(0x0a0a18, 0.95);
    gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    gfx.lineStyle(2, 0x333333, 0.5);
    gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    this.phaseOverlay.add(gfx);

    this.phaseOverlay.add(this.add.text(cx, cy - scaled(30), title, {
      fontSize: fontSize(14), color: '#444444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    this.phaseOverlay.add(this.add.text(cx, cy - scaled(10), '🔒', {
      fontSize: fontSize(24),
    }).setOrigin(0.5));

    this.phaseOverlay.add(this.add.text(cx, cy + scaled(25), description, {
      fontSize: fontSize(9), color: '#555555', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5));
  }

  private hidePhaseSelection(): void {
    if (this.devKeyHandler) {
      window.removeEventListener('keydown', this.devKeyHandler);
      this.devKeyHandler = null;
    }
    if (this.difficultyOverlay) {
      this.difficultyOverlay.destroy(true);
      this.difficultyOverlay = null;
    }
    if (this.devConfigOverlay) {
      this.devConfigOverlay.destroy(true);
      this.devConfigOverlay = null;
    }
    if (this.phaseOverlay) {
      this.phaseOverlay.destroy(true);
      this.phaseOverlay = null;
    }
  }

  // ── Overlay de seleção de dificuldade ──────────────────────────────
  private showDifficultySelection(): void {
    if (this.difficultyOverlay) return;

    const { width, height } = this.cameras.main;
    this.difficultyOverlay = this.add.container(0, 0).setDepth(300);

    // Fundo escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    bg.setInteractive();
    this.difficultyOverlay.add(bg);

    // Título
    this.difficultyOverlay.add(this.add.text(width / 2, height / 2 - scaled(130), t('difficulty.title'), {
      fontSize: fontSize(22), color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5));

    this.difficultyOverlay.add(this.add.text(width / 2, height / 2 - scaled(105), t('difficulty.subtitle'), {
      fontSize: fontSize(10), color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // Cards de dificuldade
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const cardW = scaled(160);
    const gap = scaled(20);
    const totalW = difficulties.length * cardW + (difficulties.length - 1) * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 + scaled(10);

    difficulties.forEach((diff, i) => {
      const cfg = DIFFICULTY[diff];
      const cx = startX + i * (cardW + gap);
      this.createDifficultyCard(cx, cardY, cfg, diff, cardW);
    });

    // Botão voltar
    const backBtn = this.add.text(width / 2, height / 2 + scaled(140), t('ui.back'), {
      fontSize: fontSize(12), color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => { backBtn.setColor('#ffffff'); SoundManager.playHover(); });
    backBtn.on('pointerout', () => backBtn.setColor('#666666'));
    backBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.difficultyOverlay?.destroy(true);
      this.difficultyOverlay = null;
    });
    this.difficultyOverlay.add(backBtn);
  }

  private createDifficultyCard(
    cx: number, cy: number,
    cfg: typeof DIFFICULTY[Difficulty],
    difficulty: Difficulty,
    cardW: number,
  ): void {
    if (!this.difficultyOverlay) return;

    const cardH = scaled(180);
    const gfx = this.add.graphics();

    const drawCard = (hover: boolean): void => {
      gfx.clear();
      // Sombra
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(cx - cardW / 2 + 3, cy - cardH / 2 + 3, cardW, cardH, 12);
      // Fundo
      gfx.fillStyle(hover ? 0x1e1e44 : 0x151530, 0.95);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      // Borda
      gfx.lineStyle(2, cfg.color, hover ? 1 : 0.7);
      gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      // Barra superior colorida
      gfx.fillStyle(cfg.color, hover ? 0.4 : 0.2);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, scaled(40), { tl: 12, tr: 12, bl: 0, br: 0 });
    };

    drawCard(false);
    this.difficultyOverlay.add(gfx);

    // Label
    this.difficultyOverlay.add(this.add.text(cx, cy - cardH / 2 + scaled(20), t(`difficulty.${difficulty}`), {
      fontSize: fontSize(16), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5));

    // Descrição
    this.difficultyOverlay.add(this.add.text(cx, cy + scaled(5), t(`difficulty.${difficulty}.desc`), {
      fontSize: fontSize(11), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(6),
    }).setOrigin(0.5));

    // XP badge
    const xpLabel = cfg.xpMultiplier > 1 ? `XP x${cfg.xpMultiplier}` : 'XP x1';
    const xpColor = cfg.xpMultiplier >= 2 ? '#44ff44' : cfg.xpMultiplier >= 1.5 ? '#ffcc00' : '#aaaaaa';
    this.difficultyOverlay.add(this.add.text(cx, cy + cardH / 2 - scaled(25), xpLabel, {
      fontSize: fontSize(13), color: xpColor, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    // Hitbox
    const hitbox = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    hitbox.on('pointerover', () => { drawCard(true); SoundManager.playHover(); });
    hitbox.on('pointerout', () => drawCard(false));
    hitbox.on('pointerdown', () => {
      SoundManager.playStart();
      this.hidePhaseSelection();
      this.startGame(false, undefined, difficulty);
    });
    this.difficultyOverlay.add(hitbox);
  }


  private startGame(debugMode: boolean, devConfig?: DevConfig, difficulty: Difficulty = 'hard'): void {
    const starterKey = devConfig?.starterKey ?? STARTERS[this.selectedIndex].key;
    const stageId = this.selectedStageId;
    const tileThemeId = stageId === 'phase2' ? 'route' : this.selectedThemeId;
    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) {
        this.scene.start('GameScene', { debugMode, starterKey, devConfig, difficulty, tileThemeId, stageId });
      }
    });
  }

  // ── Dev Config Overlay ───────────────────────────────────────────
  private showDevConfigOverlay(): void {
    if (this.devConfigOverlay) return;

    const { width, height } = this.cameras.main;
    this.devConfigOverlay = this.add.container(0, 0).setDepth(400);

    // Background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.92);
    bg.setInteractive();
    this.devConfigOverlay.add(bg);

    // Title
    this.devConfigOverlay.add(this.add.text(width / 2, scaled(30), 'DEV MODE', {
      fontSize: fontSize(22), color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5));

    // State
    let selectedStarter = this.selectedIndex;
    let selectedForm: PokemonForm = 'base';
    let selectedLevel = 1;
    let godMode = true;

    const panelX = width / 2;
    let yPos = scaled(70);

    // ── Starter selection ───────────────────────────────────────
    this.devConfigOverlay.add(this.add.text(panelX, yPos, 'POKÉMON', {
      fontSize: fontSize(12), color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5));
    yPos += scaled(20);

    const starterBtns: Phaser.GameObjects.Text[] = [];
    const starterNames = STARTERS.map(s => s.name);
    const starterStartX = panelX - ((starterNames.length - 1) * scaled(80)) / 2;

    starterNames.forEach((name, i) => {
      const btn = this.add.text(starterStartX + i * scaled(80), yPos, name, {
        fontSize: fontSize(13),
        color: i === selectedStarter ? '#44ff44' : '#666666',
        fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        selectedStarter = i;
        starterBtns.forEach((b, j) => b.setColor(j === i ? '#44ff44' : '#666666'));
        SoundManager.playClick();
      });
      starterBtns.push(btn);
      this.devConfigOverlay!.add(btn);
    });
    yPos += scaled(35);

    // ── Form selection ──────────────────────────────────────────
    this.devConfigOverlay.add(this.add.text(panelX, yPos, 'FORMA', {
      fontSize: fontSize(12), color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5));
    yPos += scaled(20);

    const forms: PokemonForm[] = ['base', 'stage1', 'stage2'];
    const formLabels = ['Base', 'Stage 1', 'Stage 2'];
    const formBtns: Phaser.GameObjects.Text[] = [];
    const formStartX = panelX - scaled(100);

    forms.forEach((form, i) => {
      const btn = this.add.text(formStartX + i * scaled(100), yPos, formLabels[i], {
        fontSize: fontSize(13),
        color: i === 0 ? '#44ff44' : '#666666',
        fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        selectedForm = form;
        formBtns.forEach((b, j) => b.setColor(j === i ? '#44ff44' : '#666666'));
        // Auto-ajuste do nível
        if (form === 'stage1' && selectedLevel < 16) selectedLevel = 16;
        if (form === 'stage2' && selectedLevel < 36) selectedLevel = 36;
        levelDisplay.setText(`${selectedLevel}`);
        SoundManager.playClick();
      });
      formBtns.push(btn);
      this.devConfigOverlay!.add(btn);
    });
    yPos += scaled(35);

    // ── Level ───────────────────────────────────────────────────
    this.devConfigOverlay.add(this.add.text(panelX, yPos, 'LEVEL', {
      fontSize: fontSize(12), color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5));
    yPos += scaled(20);

    const minusBtn = this.add.text(panelX - scaled(60), yPos, '[-]', {
      fontSize: fontSize(16), color: '#ff6666', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const levelDisplay = this.add.text(panelX, yPos, `${selectedLevel}`, {
      fontSize: fontSize(18), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    const plusBtn = this.add.text(panelX + scaled(60), yPos, '[+]', {
      fontSize: fontSize(16), color: '#66ff66', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    minusBtn.on('pointerdown', () => {
      selectedLevel = Math.max(1, selectedLevel - 5);
      levelDisplay.setText(`${selectedLevel}`);
      SoundManager.playClick();
    });
    plusBtn.on('pointerdown', () => {
      selectedLevel = Math.min(50, selectedLevel + 5);
      levelDisplay.setText(`${selectedLevel}`);
      SoundManager.playClick();
    });

    this.devConfigOverlay.add(minusBtn);
    this.devConfigOverlay.add(levelDisplay);
    this.devConfigOverlay.add(plusBtn);
    yPos += scaled(35);

    // ── God Mode ────────────────────────────────────────────────
    const godBtn = this.add.text(panelX, yPos, `GOD MODE: ${godMode ? 'ON' : 'OFF'}`, {
      fontSize: fontSize(13),
      color: godMode ? '#44ff44' : '#ff4444',
      fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    godBtn.on('pointerdown', () => {
      godMode = !godMode;
      godBtn.setText(`GOD MODE: ${godMode ? 'ON' : 'OFF'}`);
      godBtn.setColor(godMode ? '#44ff44' : '#ff4444');
      SoundManager.playClick();
    });
    this.devConfigOverlay.add(godBtn);
    yPos += scaled(40);

    // ── Start button ────────────────────────────────────────────
    const startGfx = this.add.graphics();
    const startBtnW = scaled(180);
    const startBtnH = scaled(40);
    const drawStart = (hover: boolean): void => {
      startGfx.clear();
      startGfx.fillStyle(hover ? 0x44bb44 : 0x228822, 0.95);
      startGfx.fillRoundedRect(panelX - startBtnW / 2, yPos - startBtnH / 2, startBtnW, startBtnH, 8);
      startGfx.lineStyle(2, hover ? 0x66dd66 : 0x33aa33);
      startGfx.strokeRoundedRect(panelX - startBtnW / 2, yPos - startBtnH / 2, startBtnW, startBtnH, 8);
    };
    drawStart(false);
    this.devConfigOverlay.add(startGfx);

    const startText = this.add.text(panelX, yPos, 'START DEV MODE', {
      fontSize: fontSize(14), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.devConfigOverlay.add(startText);

    const startHit = this.add.rectangle(panelX, yPos, startBtnW, startBtnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    startHit.on('pointerover', () => { drawStart(true); SoundManager.playHover(); });
    startHit.on('pointerout', () => drawStart(false));
    startHit.on('pointerdown', () => {
      SoundManager.playStart();
      const devConfig: DevConfig = {
        starterKey: STARTERS[selectedStarter].key,
        form: selectedForm,
        level: selectedLevel,
        godMode,
        attacks: [],
      };
      this.hidePhaseSelection();
      this.startGame(true, devConfig);
    });
    this.devConfigOverlay.add(startHit);
    yPos += scaled(50);

    // ── Skills VIEW ────────────────────────────────────────────
    const skillsBtn = this.add.text(panelX, yPos, 'Skills VIEW', {
      fontSize: fontSize(12), color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skillsBtn.on('pointerover', () => skillsBtn.setColor('#ffdd44'));
    skillsBtn.on('pointerout', () => skillsBtn.setColor('#ffaa00'));
    skillsBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.hidePhaseSelection();
      this.scene.start('ShowcaseScene');
    });
    this.devConfigOverlay.add(skillsBtn);
    yPos += scaled(22);

    // ── Back to debugger ────────────────────────────────────────
    const debugBtn = this.add.text(panelX, yPos, 'Debugger (cenários)', {
      fontSize: fontSize(11), color: '#44aaff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    debugBtn.on('pointerover', () => debugBtn.setColor('#88ccff'));
    debugBtn.on('pointerout', () => debugBtn.setColor('#44aaff'));
    debugBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.hidePhaseSelection();
      this.startGame(true);
    });
    this.devConfigOverlay.add(debugBtn);

    // ── Cancel ──────────────────────────────────────────────────
    const cancelBtn = this.add.text(panelX, yPos + scaled(25), t('ui.cancel'), {
      fontSize: fontSize(11), color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerover', () => cancelBtn.setColor('#ffffff'));
    cancelBtn.on('pointerout', () => cancelBtn.setColor('#666666'));
    cancelBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.hidePhaseSelection();
    });
    this.devConfigOverlay.add(cancelBtn);

    // ESC to cancel
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        SoundManager.playClick();
        this.hidePhaseSelection();
      }
    };
    this.devKeyHandler = onKeyDown;
    window.addEventListener('keydown', onKeyDown);
    this.events.once('shutdown', () => {
      if (this.devKeyHandler) {
        window.removeEventListener('keydown', this.devKeyHandler);
        this.devKeyHandler = null;
      }
    });
  }

  private createCharacterCard(
    starter: StarterConfig,
    index: number,
    cx: number,
    cy: number,
    cardWidth: number,
    cardHeight: number,
  ): void {
    const container = this.add.container(0, 0).setDepth(5);
    const cardGfx = this.add.graphics();

    const unlocked = isEffectivelyUnlocked(starter);

    // Desenha card base
    this.drawCard(cardGfx, cx, cy, cardWidth, cardHeight, unlocked, index === this.selectedIndex);
    container.add(cardGfx);

    // ── Sprite do Pokémon ────────────────────────────────────────────
    const sprite = this.add.sprite(cx, cy - scaled(45), starter.sprite.key);
    sprite.setScale(2.5);

    if (!unlocked) {
      sprite.setFrame(0);
      sprite.setTint(0x000000);
    } else {
      sprite.play(`${starter.sprite.key}-down`);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 4,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    container.add(sprite);

    // Sombra
    const shadow = this.add.image(cx, cy - scaled(15), 'shadow').setScale(2.5).setAlpha(unlocked ? 0.3 : 0.1);
    container.add(shadow);

    // ── Nome ─────────────────────────────────────────────────────────
    const nameColor = unlocked ? '#ffffff' : '#444444';
    const nameText = this.add.text(cx, cy + scaled(15), starter.name.toUpperCase(), {
      fontSize: fontSize(13),
      color: nameColor,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(nameText);

    // ── Tipo badge ───────────────────────────────────────────────────
    const typeColors: Record<string, number> = {
      'Fogo': 0xff6600, 'Água': 0x4488ff, 'Planta': 0x44bb44,
      'Fada': 0xff77cc, 'Fantasma': 0x6644aa, 'Psíquico': 0xff4488,
    };
    const TYPE_KEY_MAP: Record<string, string> = {
      'Fogo': 'type.fire', 'Água': 'type.water', 'Planta': 'type.grass',
      'Fada': 'type.fairy', 'Fantasma': 'type.ghost', 'Psíquico': 'type.psychic',
    };
    const typeColor = typeColors[starter.type] ?? 0x888888;

    const typeBadge = this.add.graphics();
    const badgeW = scaled(60);
    const badgeH = scaled(18);
    typeBadge.fillStyle(unlocked ? typeColor : 0x333333, 0.8);
    typeBadge.fillRoundedRect(cx - badgeW / 2, cy + scaled(28), badgeW, badgeH, 5);
    container.add(typeBadge);

    const typeText = this.add.text(cx, cy + scaled(37), t(TYPE_KEY_MAP[starter.type] ?? 'type.normal').toUpperCase(), {
      fontSize: fontSize(9),
      color: unlocked ? '#ffffff' : '#555555',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(typeText);

    // ── Descrição ────────────────────────────────────────────────────
    if (unlocked) {
      const desc = this.add.text(cx, cy + scaled(55), t(`starter.${starter.key}.desc`), {
        fontSize: fontSize(8),
        color: '#aaaaaa',
        fontFamily: 'monospace',
        wordWrap: { width: cardWidth - scaled(20) },
        align: 'center',
      }).setOrigin(0.5, 0);
      container.add(desc);
    }

    // ── Badge WIP ───────────────────────────────────────────────────
    if (starter.key === 'bulbasaur') {
      const wipBadgeGfx = this.add.graphics();
      const wipW = scaled(45);
      const wipH = scaled(16);
      wipBadgeGfx.fillStyle(0xff8800, 0.9);
      wipBadgeGfx.fillRoundedRect(cx + cardWidth / 2 - wipW - scaled(5), cy - cardHeight / 2 + scaled(6), wipW, wipH, 4);
      container.add(wipBadgeGfx);
      const wipLabel = this.add.text(cx + cardWidth / 2 - wipW / 2 - scaled(5), cy - cardHeight / 2 + scaled(14), 'WIP', {
        fontSize: fontSize(9), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(wipLabel);
    }

    // ── Overlay de lock ──────────────────────────────────────────────
    if (!unlocked) {
      const lockText = this.add.text(cx, cy + scaled(60), '🔒', {
        fontSize: fontSize(22),
      }).setOrigin(0.5);
      container.add(lockText);

      const lockedLabel = this.add.text(cx, cy + scaled(85), t('select.comingSoon'), {
        fontSize: fontSize(9),
        color: '#666666',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(lockedLabel);
    }

    // ── Hitbox para seleção ──────────────────────────────────────────
    const hitbox = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0xffffff, 0)
      .setInteractive({ useHandCursor: unlocked }).setDepth(6);

    hitbox.on('pointerdown', () => {
      if (unlocked) {
        SoundManager.playClick();
        this.selectCard(index);
      } else {
        this.tweens.add({
          targets: container,
          x: container.x + 5,
          duration: 50,
          yoyo: true,
          repeat: 3,
        });
      }
    });

    hitbox.on('pointerover', () => {
      if (unlocked) SoundManager.playHover();
      if (unlocked && index !== this.selectedIndex) {
        this.drawCard(cardGfx, cx, cy, cardWidth, cardHeight, true, false, true);
      }
    });

    hitbox.on('pointerout', () => {
      if (unlocked) {
        this.drawCard(cardGfx, cx, cy, cardWidth, cardHeight, true, index === this.selectedIndex);
      }
    });

    this.cards.push(container);
    this.cardGraphics.push(cardGfx);
  }

  private getCardPos(index: number): { cx: number; cy: number; w: number; h: number } {
    const { width, height } = this.cameras.main;
    const COLS = 3;
    const maxCardW = scaled(160);
    const gap = scaled(15);
    const cardWidth = Math.min(maxCardW, (width - gap * (COLS + 1)) / COLS);
    const cardHeight = Math.min(scaled(230), (height - scaled(220)) / 2);
    const rowGap = scaled(12);
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const rowCount = Math.min(COLS, STARTERS.length - row * COLS);
    const rowTotalW = rowCount * cardWidth + (rowCount - 1) * gap;
    const rowStartX = (width - rowTotalW) / 2;
    const cx = rowStartX + col * (cardWidth + gap) + cardWidth / 2;
    const baseY = scaled(88) + cardHeight / 2;
    const cy = baseY + row * (cardHeight + rowGap);
    return { cx, cy, w: cardWidth, h: cardHeight };
  }

  private selectCard(index: number): void {
    const prevIndex = this.selectedIndex;
    this.selectedIndex = index;

    if (prevIndex !== index && isEffectivelyUnlocked(STARTERS[prevIndex])) {
      const prev = this.getCardPos(prevIndex);
      this.drawCard(this.cardGraphics[prevIndex], prev.cx, prev.cy, prev.w, prev.h, true, false);
    }

    const pos = this.getCardPos(index);
    this.drawCard(this.cardGraphics[index], pos.cx, pos.cy, pos.w, pos.h, true, true);
  }

  private drawCard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    w: number,
    h: number,
    unlocked: boolean,
    selected: boolean,
    hover: boolean = false,
  ): void {
    g.clear();

    const x = cx - w / 2;
    const y = cy - h / 2;

    // Sombra
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(x + 3, y + 3, w, h, 12);

    // Fundo
    if (!unlocked) {
      g.fillStyle(0x111122, 0.95);
    } else if (selected) {
      g.fillStyle(0x1a1a3e, 0.95);
    } else {
      g.fillStyle(0x151530, hover ? 0.98 : 0.9);
    }
    g.fillRoundedRect(x, y, w, h, 12);

    // Borda
    if (selected && unlocked) {
      g.lineStyle(3, 0xffcc00);
      g.strokeRoundedRect(x, y, w, h, 12);
      g.lineStyle(1, 0xffcc00, 0.3);
      g.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, 10);
    } else if (hover && unlocked) {
      g.lineStyle(2, 0xff8800, 0.7);
      g.strokeRoundedRect(x, y, w, h, 12);
    } else if (unlocked) {
      g.lineStyle(2, 0x333366, 0.8);
      g.strokeRoundedRect(x, y, w, h, 12);
    } else {
      g.lineStyle(1, 0x222233, 0.5);
      g.strokeRoundedRect(x, y, w, h, 12);
    }

    // Highlight superior
    if (unlocked) {
      g.fillStyle(0xffffff, selected ? 0.06 : 0.03);
      g.fillRoundedRect(x + 4, y + 2, w - 8, h * 0.3, { tl: 10, tr: 10, bl: 0, br: 0 });
    }
  }

  private drawStartButton(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, hover: boolean): void {
    g.clear();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 3, w, h, 10);
    g.fillStyle(hover ? 0x44bb44 : 0x339933, 0.95);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    g.lineStyle(2, hover ? 0x66dd66 : 0x227722);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    g.fillStyle(0xffffff, hover ? 0.15 : 0.08);
    g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 2, w - 6, h * 0.4, { tl: 8, tr: 8, bl: 0, br: 0 });
  }
}
