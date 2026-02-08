import Phaser from 'phaser';
import { STARTERS } from '../config';
import type { StarterConfig } from '../config';
import { SoundManager } from '../audio/SoundManager';

export class SelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private cardGraphics: Phaser.GameObjects.Graphics[] = [];
  private phaseOverlay: Phaser.GameObjects.Container | null = null;
  private passwordOverlay: Phaser.GameObjects.Container | null = null;
  private passwordKeyHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super({ key: 'SelectScene' });
  }

  create(): void {
    this.phaseOverlay = null;
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
    this.add.text(width / 2, 35, 'ESCOLHA SEU POKÉMON', {
      fontSize: '24px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, 60, 'Apenas o Charmander está disponível por enquanto', {
      fontSize: '10px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // ── Cards de personagem ──────────────────────────────────────────
    const cardWidth = 200;
    const cardHeight = 340;
    const gap = 30;
    const totalWidth = STARTERS.length * cardWidth + (STARTERS.length - 1) * gap;
    const startX = (width - totalWidth) / 2;

    STARTERS.forEach((starter, i) => {
      const cx = startX + i * (cardWidth + gap) + cardWidth / 2;
      const cy = height / 2 + 20;
      this.createCharacterCard(starter, i, cx, cy, cardWidth, cardHeight);
    });

    // ── Botão "COMEÇAR" ──────────────────────────────────────────────
    const btnY = height - 55;
    const btnW = 200;
    const btnH = 45;

    const btnBg = this.add.graphics().setDepth(10);
    this.drawStartButton(btnBg, width / 2, btnY, btnW, btnH, false);

    const btnText = this.add.text(width / 2, btnY, 'COMEÇAR!', {
      fontSize: '18px',
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
      if (!selected.unlocked) return;
      SoundManager.playClick();
      this.showPhaseSelection();
    });

    // ── Botão "Voltar" ───────────────────────────────────────────────
    const backBtn = this.add.text(20, height - 25, '<- Voltar', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setDepth(10).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => { backBtn.setColor('#ffffff'); SoundManager.playHover(); });
    backBtn.on('pointerout', () => backBtn.setColor('#666666'));
    backBtn.on('pointerdown', () => { SoundManager.playClick(); this.scene.start('TitleScene'); });

    // ── Seleção inicial ──────────────────────────────────────────────
    this.selectCard(0);

    // ── Fade in ──────────────────────────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);
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
    this.phaseOverlay.add(this.add.text(width / 2, height / 2 - 120, 'SELECIONE A FASE', {
      fontSize: '22px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5));

    // ── Card: Fase 1 — Fire Red ──────────────────────────────────────
    const card1X = width / 2 - 130;
    const cardY = height / 2 + 10;
    this.createPhaseCard(card1X, cardY, 'FASE 1', 'FIRE RED', 0xff4400, 0xff6622,
      'Jogo completo com\ninimigos, bosses\ne evoluções.', () => {
        this.startGame(false);
      });

    // ── Card: Fase Dev — Debugger ────────────────────────────────────
    const card2X = width / 2 + 130;
    this.createPhaseCard(card2X, cardY, 'FASE DEV', 'DEBUGGER', 0x44aaff, 0x66ccff,
      'Cenários de teste\npré-configurados\npara debugging.', () => {
        this.showPasswordPrompt();
      });

    // Botão cancelar
    const cancelBtn = this.add.text(width / 2, height / 2 + 145, 'Cancelar', {
      fontSize: '12px', color: '#666666', fontFamily: 'monospace',
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

    const cardW = 200;
    const cardH = 180;

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
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, 40, { tl: 12, tr: 12, bl: 0, br: 0 });
    };

    drawCard(false);
    this.phaseOverlay.add(gfx);

    // Título
    this.phaseOverlay.add(this.add.text(cx, cy - cardH / 2 + 14, title, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    // Subtítulo
    const subColor = color === 0xff4400 ? '#ff6622' : '#66ccff';
    this.phaseOverlay.add(this.add.text(cx, cy - cardH / 2 + 32, subtitle, {
      fontSize: '10px', color: subColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Descrição
    this.phaseOverlay.add(this.add.text(cx, cy + 10, description, {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: 4,
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

  private showPasswordPrompt(): void {
    if (this.passwordOverlay) return;

    const { width, height } = this.cameras.main;
    this.passwordOverlay = this.add.container(0, 0).setDepth(300);

    // Fundo escuro sobre o overlay de fases
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    bg.setInteractive();
    this.passwordOverlay.add(bg);

    this.passwordOverlay.add(this.add.text(width / 2, height / 2 - 60, 'ACESSO RESTRITO', {
      fontSize: '16px', color: '#44aaff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5));

    this.passwordOverlay.add(this.add.text(width / 2, height / 2 - 35, 'Digite a senha:', {
      fontSize: '12px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // Caixa de input visual
    const boxGfx = this.add.graphics();
    boxGfx.fillStyle(0x111133, 0.95);
    boxGfx.fillRoundedRect(width / 2 - 80, height / 2 - 15, 160, 30, 6);
    boxGfx.lineStyle(1, 0x44aaff, 0.5);
    boxGfx.strokeRoundedRect(width / 2 - 80, height / 2 - 15, 160, 30, 6);
    this.passwordOverlay.add(boxGfx);

    let password = '';
    const pwDisplay = this.add.text(width / 2, height / 2, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.passwordOverlay.add(pwDisplay);

    const errorText = this.add.text(width / 2, height / 2 + 25, '', {
      fontSize: '11px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.passwordOverlay.add(errorText);

    this.passwordOverlay.add(this.add.text(width / 2, height / 2 + 55, 'ESC para cancelar', {
      fontSize: '10px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5));

    const cleanup = (): void => {
      if (this.passwordKeyHandler) {
        window.removeEventListener('keydown', this.passwordKeyHandler);
        this.passwordKeyHandler = null;
      }
      if (this.passwordOverlay) {
        this.passwordOverlay.destroy(true);
        this.passwordOverlay = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape') {
        SoundManager.playClick();
        cleanup();
        return;
      }
      if (event.key === 'Backspace') {
        password = password.slice(0, -1);
        pwDisplay.setText('*'.repeat(password.length));
        return;
      }
      if (event.key === 'Enter') {
        if (password === 'lulu') {
          cleanup();
          this.hidePhaseSelection();
          this.startGame(true);
        } else {
          errorText.setText('Senha incorreta!');
          password = '';
          pwDisplay.setText('');
          this.time.delayedCall(1500, () => { if (errorText.active) errorText.setText(''); });
        }
        return;
      }
      if (event.key.length === 1 && password.length < 20) {
        password += event.key;
        pwDisplay.setText('*'.repeat(password.length));
      }
    };

    this.passwordKeyHandler = onKeyDown;
    window.addEventListener('keydown', onKeyDown);

    // Cleanup automático se a scene for destruída
    this.events.once('shutdown', cleanup);
  }

  private hidePhaseSelection(): void {
    if (this.passwordKeyHandler) {
      window.removeEventListener('keydown', this.passwordKeyHandler);
      this.passwordKeyHandler = null;
    }
    if (this.passwordOverlay) {
      this.passwordOverlay.destroy(true);
      this.passwordOverlay = null;
    }
    if (this.phaseOverlay) {
      this.phaseOverlay.destroy(true);
      this.phaseOverlay = null;
    }
  }

  private startGame(debugMode: boolean): void {
    const starterKey = STARTERS[this.selectedIndex].key;
    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) {
        this.scene.start('GameScene', { debugMode, starterKey });
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

    // Desenha card base
    this.drawCard(cardGfx, cx, cy, cardWidth, cardHeight, starter.unlocked, index === this.selectedIndex);
    container.add(cardGfx);

    // ── Sprite do Pokémon ────────────────────────────────────────────
    const sprite = this.add.sprite(cx, cy - 60, starter.sprite.key);
    sprite.setScale(3);

    if (!starter.unlocked) {
      sprite.setFrame(0);
      sprite.setTint(0x000000);
    } else {
      sprite.play(`${starter.sprite.key}-down`);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    container.add(sprite);

    // Sombra
    const shadow = this.add.image(cx, cy - 25, 'shadow').setScale(3).setAlpha(starter.unlocked ? 0.3 : 0.1);
    container.add(shadow);

    // ── Nome ─────────────────────────────────────────────────────────
    const nameColor = starter.unlocked ? '#ffffff' : '#444444';
    const nameText = this.add.text(cx, cy + 15, starter.name.toUpperCase(), {
      fontSize: '16px',
      color: nameColor,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(nameText);

    // ── Tipo badge ───────────────────────────────────────────────────
    const typeColors: Record<string, number> = { 'Fogo': 0xff6600, 'Água': 0x4488ff, 'Planta': 0x44bb44 };
    const typeColor = typeColors[starter.type] ?? 0x888888;

    const typeBadge = this.add.graphics();
    const badgeW = 70;
    const badgeH = 20;
    typeBadge.fillStyle(starter.unlocked ? typeColor : 0x333333, 0.8);
    typeBadge.fillRoundedRect(cx - badgeW / 2, cy + 32, badgeW, badgeH, 5);
    container.add(typeBadge);

    const typeText = this.add.text(cx, cy + 42, starter.type.toUpperCase(), {
      fontSize: '10px',
      color: starter.unlocked ? '#ffffff' : '#555555',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(typeText);

    // ── Descrição ────────────────────────────────────────────────────
    if (starter.unlocked) {
      const desc = this.add.text(cx, cy + 70, starter.description, {
        fontSize: '9px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
        wordWrap: { width: cardWidth - 30 },
        align: 'center',
      }).setOrigin(0.5, 0);
      container.add(desc);
    }

    // ── Overlay de lock ──────────────────────────────────────────────
    if (!starter.unlocked) {
      const lockText = this.add.text(cx, cy + 75, 'X', {
        fontSize: '28px', color: '#444444', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(lockText);

      const lockedLabel = this.add.text(cx, cy + 105, 'EM BREVE', {
        fontSize: '11px',
        color: '#666666',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(lockedLabel);
    }

    // ── Hitbox para seleção ──────────────────────────────────────────
    const hitbox = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0xffffff, 0)
      .setInteractive({ useHandCursor: starter.unlocked }).setDepth(6);

    hitbox.on('pointerdown', () => {
      if (starter.unlocked) {
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
      if (starter.unlocked) SoundManager.playHover();
      if (starter.unlocked && index !== this.selectedIndex) {
        this.drawCard(cardGfx, cx, cy, cardWidth, cardHeight, true, false, true);
      }
    });

    hitbox.on('pointerout', () => {
      if (starter.unlocked) {
        this.drawCard(cardGfx, cx, cy, cardWidth, cardHeight, true, index === this.selectedIndex);
      }
    });

    this.cards.push(container);
    this.cardGraphics.push(cardGfx);
  }

  private selectCard(index: number): void {
    const prevIndex = this.selectedIndex;
    this.selectedIndex = index;

    const cardWidth = 200;
    const cardHeight = 340;
    const gap = 30;
    const { width } = this.cameras.main;
    const totalWidth = STARTERS.length * cardWidth + (STARTERS.length - 1) * gap;
    const startX = (width - totalWidth) / 2;

    if (prevIndex !== index && STARTERS[prevIndex].unlocked) {
      const prevCx = startX + prevIndex * (cardWidth + gap) + cardWidth / 2;
      const prevCy = this.cameras.main.height / 2 + 20;
      this.drawCard(this.cardGraphics[prevIndex], prevCx, prevCy, cardWidth, cardHeight, true, false);
    }

    const cx = startX + index * (cardWidth + gap) + cardWidth / 2;
    const cy = this.cameras.main.height / 2 + 20;
    this.drawCard(this.cardGraphics[index], cx, cy, cardWidth, cardHeight, true, true);
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
