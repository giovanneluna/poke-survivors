import Phaser from 'phaser';
import { STARTERS } from '../config';
import type { StarterConfig } from '../config';
import { SoundManager } from '../audio/SoundManager';

const TEST_MODE_PASSWORD = 'lulu';

export class SelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private cardGraphics: Phaser.GameObjects.Graphics[] = [];
  private passwordOverlay!: Phaser.GameObjects.Container;
  private passwordInput = '';
  private passwordDisplay!: Phaser.GameObjects.Text;
  private passwordError!: Phaser.GameObjects.Text;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super({ key: 'SelectScene' });
  }

  create(): void {
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

    const btnText = this.add.text(width / 2, btnY, '⚔  COMEÇAR!', {
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
      SoundManager.playStart();
      this.cameras.main.fade(500, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) {
          this.scene.start('GameScene');
        }
      });
    });

    // ── Botão "MODO TESTE" ───────────────────────────────────────────
    const testBtn = this.add.text(width - 20, height - 25, 'MODO TESTE', {
      fontSize: '12px',
      color: '#44aaff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(10).setInteractive({ useHandCursor: true });

    testBtn.on('pointerover', () => { testBtn.setColor('#ffffff'); SoundManager.playHover(); });
    testBtn.on('pointerout', () => testBtn.setColor('#44aaff'));
    testBtn.on('pointerdown', () => { SoundManager.playClick(); this.showPasswordPrompt(); });

    // ── Botão "Voltar" ───────────────────────────────────────────────
    const backBtn = this.add.text(20, height - 25, '← Voltar', {
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
      // Silhueta preta — frame estático para não gerar silhuetas estranhas
      sprite.setFrame(0);
      sprite.setTint(0x000000);
    } else {
      sprite.play(`${starter.sprite.key}-down`);
      // Flutuação animada
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
      // Cadeado
      const lockText = this.add.text(cx, cy + 75, '🔒', {
        fontSize: '28px',
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
        // Shake no card travado
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

    // Redesenha o card anterior (deseleciona)
    if (prevIndex !== index && STARTERS[prevIndex].unlocked) {
      const prevCx = startX + prevIndex * (cardWidth + gap) + cardWidth / 2;
      const prevCy = this.cameras.main.height / 2 + 20;
      this.drawCard(this.cardGraphics[prevIndex], prevCx, prevCy, cardWidth, cardHeight, true, false);
    }

    // Desenha o card selecionado
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
      // Borda dourada brilhante
      g.lineStyle(3, 0xffcc00);
      g.strokeRoundedRect(x, y, w, h, 12);
      // Glow interno
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

  private showPasswordPrompt(): void {
    const { width, height } = this.cameras.main;
    this.passwordInput = '';

    this.passwordOverlay = this.add.container(0, 0).setDepth(100);

    // Fundo escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    bg.setInteractive(); // Bloqueia cliques nos elementos abaixo
    this.passwordOverlay.add(bg);

    // Caixa do prompt
    const boxW = 300;
    const boxH = 200;
    const boxGfx = this.add.graphics();
    boxGfx.fillStyle(0x1a1a2e, 0.98);
    boxGfx.fillRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 12);
    boxGfx.lineStyle(2, 0x44aaff, 0.8);
    boxGfx.strokeRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 12);
    this.passwordOverlay.add(boxGfx);

    // Ícone de cadeado
    const lockIcon = this.add.text(width / 2, height / 2 - 70, '🔒', {
      fontSize: '28px',
    }).setOrigin(0.5);
    this.passwordOverlay.add(lockIcon);

    // Título
    const title = this.add.text(width / 2, height / 2 - 42, 'MODO TESTE', {
      fontSize: '16px', color: '#44aaff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.passwordOverlay.add(title);

    // Label
    const label = this.add.text(width / 2, height / 2 - 18, 'Digite a senha:', {
      fontSize: '12px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.passwordOverlay.add(label);

    // Campo de input visual
    const inputW = 200;
    const inputH = 32;
    const inputGfx = this.add.graphics();
    inputGfx.fillStyle(0x0a0a1a, 0.9);
    inputGfx.fillRoundedRect(width / 2 - inputW / 2, height / 2 - inputH / 2 + 5, inputW, inputH, 6);
    inputGfx.lineStyle(1, 0x44aaff, 0.5);
    inputGfx.strokeRoundedRect(width / 2 - inputW / 2, height / 2 - inputH / 2 + 5, inputW, inputH, 6);
    this.passwordOverlay.add(inputGfx);

    // Texto mascarado (dots)
    this.passwordDisplay = this.add.text(width / 2, height / 2 + 5, '|', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.passwordOverlay.add(this.passwordDisplay);

    // Cursor piscante
    this.tweens.add({
      targets: this.passwordDisplay, alpha: 0.5, duration: 500,
      yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    // Mensagem de erro (inicialmente invisível)
    this.passwordError = this.add.text(width / 2, height / 2 + 34, '', {
      fontSize: '11px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.passwordOverlay.add(this.passwordError);

    // Hint
    const hint = this.add.text(width / 2, height / 2 + 55, 'Enter para confirmar  •  Esc para cancelar', {
      fontSize: '9px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.passwordOverlay.add(hint);

    // Captura de teclas via DOM (mais confiável para texto)
    this.keydownHandler = (event: KeyboardEvent) => {
      if (!this.passwordOverlay?.visible) return;

      if (event.key === 'Escape') {
        this.hidePasswordPrompt();
        return;
      }

      if (event.key === 'Enter') {
        if (this.passwordInput === TEST_MODE_PASSWORD) {
          SoundManager.playStart();
          this.hidePasswordPrompt();
          this.cameras.main.fade(400, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
            if (progress >= 1) this.scene.start('ShowcaseScene');
          });
        } else {
          SoundManager.playClick();
          this.passwordError.setText('Senha incorreta!');
          this.passwordInput = '';
          this.passwordDisplay.setText('|');

          // Shake na caixa
          this.tweens.add({
            targets: this.passwordOverlay, x: 5, duration: 40,
            yoyo: true, repeat: 3,
            onComplete: () => { this.passwordOverlay.x = 0; },
          });
        }
        return;
      }

      if (event.key === 'Backspace') {
        this.passwordInput = this.passwordInput.slice(0, -1);
      } else if (event.key.length === 1 && this.passwordInput.length < 20) {
        this.passwordInput += event.key;
        this.passwordError.setText('');
      }

      const masked = '•'.repeat(this.passwordInput.length);
      this.passwordDisplay.setText(masked.length > 0 ? masked : '|');

      // Parar blink quando há texto, restaurar quando vazio
      if (this.passwordInput.length > 0) {
        this.passwordDisplay.setAlpha(1);
        this.tweens.killTweensOf(this.passwordDisplay);
      } else {
        this.tweens.add({
          targets: this.passwordDisplay, alpha: 0.5, duration: 500,
          yoyo: true, repeat: -1, ease: 'Sine.InOut',
        });
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
  }

  private hidePasswordPrompt(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.passwordOverlay) {
      this.passwordOverlay.destroy(true);
    }
    this.passwordInput = '';
  }

  shutdown(): void {
    this.hidePasswordPrompt();
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
