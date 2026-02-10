import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import {
  initSaveSystem, exportSaveCode, downloadSaveFile,
  importSaveCode, importSaveFile, resetSave,
} from '../systems/SaveSystem';
import { fontSize, scaled } from '../utils/ui-scale';

export class SaveScene extends Phaser.Scene {
  private overlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'SaveScene' });
  }

  create(): void {
    this.overlay = null;
    initSaveSystem();
    const { width, height } = this.cameras.main;

    // ── Background ─────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f23);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, 0xffffff, 0.03);
    const gridStep = scaled(40);
    for (let x = 0; x < width; x += gridStep) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += gridStep) bg.lineBetween(0, y, width, y);

    // ── Header ───────────────────────────────────────────────────
    this.add.text(width / 2, scaled(28), 'SAVE DATA', {
      fontSize: fontSize(22), color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, scaled(52), 'Gerencie seus dados de jogo', {
      fontSize: fontSize(10), color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // ── 3 Action cards ──────────────────────────────────────────
    const cardW = scaled(180);
    const cardH = scaled(160);
    const cardGap = scaled(20);
    const totalW = 3 * cardW + 2 * cardGap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height * 0.45;

    this.createActionCard(startX, cardY, cardW, cardH,
      'EXPORTAR', 'Baixe seu save como\narquivo .txt ou copie\no código para transferir',
      0x225522, 0x338833, '#66cc66',
      () => this.showExportOverlay());

    this.createActionCard(startX + cardW + cardGap, cardY, cardW, cardH,
      'IMPORTAR', 'Carregue um arquivo .txt\nou cole um código para\nrestaurar seu progresso',
      0x222255, 0x333388, '#6688cc',
      () => this.showImportOverlay());

    this.createActionCard(startX + 2 * (cardW + cardGap), cardY, cardW, cardH,
      'APAGAR', 'Apague TODOS os dados\nde jogo permanentemente.\nUse com cuidado!',
      0x442222, 0x663333, '#cc6666',
      () => this.showDeleteOverlay());

    // ── Botão Voltar ────────────────────────────────────────────
    const btnW = scaled(160);
    const btnH = scaled(36);
    const btnY = height - scaled(35);

    const btnGfx = this.add.graphics().setDepth(10);
    const drawBtn = (hover: boolean): void => {
      btnGfx.clear();
      btnGfx.fillStyle(0x000000, 0.4);
      btnGfx.fillRoundedRect(width / 2 - btnW / 2 + 2, btnY - btnH / 2 + 3, btnW, btnH, scaled(8));
      btnGfx.fillStyle(hover ? 0x555577 : 0x333355, 0.95);
      btnGfx.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, scaled(8));
      btnGfx.lineStyle(2, hover ? 0x8888aa : 0x555577);
      btnGfx.strokeRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, scaled(8));
    };
    drawBtn(false);

    const btnText = this.add.text(width / 2, btnY, '<- VOLTAR', {
      fontSize: fontSize(14), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    const btnHit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(12);

    btnHit.on('pointerover', () => { drawBtn(true); btnText.setColor('#ffcc00'); SoundManager.playHover(); });
    btnHit.on('pointerout', () => { drawBtn(false); btnText.setColor('#ffffff'); });
    btnHit.on('pointerdown', () => { SoundManager.playClick(); this.scene.start('TitleScene'); });

    // ── Fade in ─────────────────────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ── Action card ─────────────────────────────────────────────────
  private createActionCard(
    cx: number, cy: number, w: number, h: number,
    title: string, desc: string,
    color: number, hoverColor: number, textColor: string,
    onClick: () => void,
  ): void {
    const r = scaled(10);
    const gfx = this.add.graphics().setDepth(5);

    const draw = (hover: boolean): void => {
      gfx.clear();
      // Shadow
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(cx - w / 2 + 3, cy - h / 2 + 3, w, h, r);
      // Background
      gfx.fillStyle(hover ? hoverColor : color, 0.95);
      gfx.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
      // Border
      const borderAlpha = hover ? 1 : 0.6;
      gfx.lineStyle(2, Phaser.Display.Color.IntegerToColor(
        hover ? 0xaaaaaa : parseInt(textColor.replace('#', ''), 16)
      ).color, borderAlpha);
      gfx.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
      // Top highlight
      gfx.fillStyle(0xffffff, hover ? 0.08 : 0.04);
      gfx.fillRoundedRect(cx - w / 2 + 3, cy - h / 2 + 2, w - 6, h * 0.25, { tl: 8, tr: 8, bl: 0, br: 0 });
    };
    draw(false);

    // Title
    this.add.text(cx, cy - h / 2 + scaled(24), title, {
      fontSize: fontSize(14), color: textColor, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    // Divider
    const divGfx = this.add.graphics().setDepth(6);
    divGfx.lineStyle(1, parseInt(textColor.replace('#', ''), 16), 0.3);
    divGfx.lineBetween(cx - w / 2 + scaled(16), cy - h / 2 + scaled(40),
                       cx + w / 2 - scaled(16), cy - h / 2 + scaled(40));

    // Description
    this.add.text(cx, cy + scaled(6), desc, {
      fontSize: fontSize(9), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5).setDepth(6);

    // Hitbox
    const hit = this.add.rectangle(cx, cy, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(7);
    hit.on('pointerover', () => { draw(true); SoundManager.playHover(); });
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => { SoundManager.playClick(); onClick(); });
  }

  // ── Overlay helpers ─────────────────────────────────────────────
  private closeOverlay(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }

  private createOverlayBase(titleText: string): {
    container: Phaser.GameObjects.Container;
    cx: number;
    cy: number;
    panelW: number;
    contentY: number;
  } {
    this.closeOverlay();
    const { width, height } = this.cameras.main;
    const container = this.add.container(0, 0).setDepth(50);
    this.overlay = container;

    const cx = width / 2;
    const cy = height / 2;
    const panelW = Math.min(scaled(420), width - scaled(40));
    const panelH = scaled(280);
    const r = scaled(10);

    // Dim background
    const dim = this.add.rectangle(cx, cy, width, height, 0x000000, 0.7)
      .setInteractive().setDepth(50);
    container.add(dim);

    // Panel
    const gfx = this.add.graphics().setDepth(51);
    gfx.fillStyle(0x000000, 0.5);
    gfx.fillRoundedRect(cx - panelW / 2 + 3, cy - panelH / 2 + 3, panelW, panelH, r);
    gfx.fillStyle(0x1a1a33, 0.98);
    gfx.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, r);
    gfx.lineStyle(2, 0x555577);
    gfx.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, r);
    container.add(gfx);

    // Title
    container.add(this.add.text(cx, cy - panelH / 2 + scaled(20), titleText, {
      fontSize: fontSize(16), color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(52));

    // Close X button
    const closeX = this.add.text(cx + panelW / 2 - scaled(16), cy - panelH / 2 + scaled(10), 'X', {
      fontSize: fontSize(14), color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(53).setInteractive({ useHandCursor: true });
    closeX.on('pointerover', () => closeX.setColor('#ff8888'));
    closeX.on('pointerout', () => closeX.setColor('#ff4444'));
    closeX.on('pointerdown', () => { SoundManager.playClick(); this.closeOverlay(); });
    container.add(closeX);

    const contentY = cy - panelH / 2 + scaled(50);
    return { container, cx, cy, panelW, contentY };
  }

  private createOverlayBtn(
    container: Phaser.GameObjects.Container,
    x: number, y: number, w: number, h: number,
    label: string, color: number, hoverColor: number,
    textColor: string, onClick: () => void,
  ): void {
    const gfx = this.add.graphics().setDepth(52);
    const r = scaled(6);
    const draw = (hover: boolean): void => {
      gfx.clear();
      gfx.fillStyle(0x000000, 0.3);
      gfx.fillRoundedRect(x - w / 2 + 1, y - h / 2 + 2, w, h, r);
      gfx.fillStyle(hover ? hoverColor : color, 0.95);
      gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
      gfx.lineStyle(1, hover ? 0xaaaaaa : 0x666666);
      gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    };
    draw(false);
    container.add(gfx);

    const txt = this.add.text(x, y, label, {
      fontSize: fontSize(10), color: textColor, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(53);
    container.add(txt);

    const hit = this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(54);
    hit.on('pointerover', () => { draw(true); SoundManager.playHover(); });
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => { SoundManager.playClick(); onClick(); });
    container.add(hit);
  }

  // ── Export Overlay ──────────────────────────────────────────────
  private showExportOverlay(): void {
    const { container, cx, contentY, panelW } = this.createOverlayBase('EXPORTAR DADOS');

    container.add(this.add.text(cx, contentY, 'Baixe seu save como arquivo .txt\nou copie o código para colar em outro dispositivo.', {
      fontSize: fontSize(9), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5, 0).setDepth(52));

    // Code preview
    const code = exportSaveCode();
    const preview = code.length > 40 ? code.substring(0, 37) + '...' : code;
    const codeGfx = this.add.graphics().setDepth(52);
    const codeY = contentY + scaled(45);
    const codeW = panelW - scaled(40);
    const codeH = scaled(28);
    codeGfx.fillStyle(0x000000, 0.5);
    codeGfx.fillRoundedRect(cx - codeW / 2, codeY - codeH / 2, codeW, codeH, scaled(4));
    codeGfx.lineStyle(1, 0x333355);
    codeGfx.strokeRoundedRect(cx - codeW / 2, codeY - codeH / 2, codeW, codeH, scaled(4));
    container.add(codeGfx);

    container.add(this.add.text(cx, codeY, preview, {
      fontSize: fontSize(7), color: '#88ff88', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(53));

    // Buttons
    const btnW = scaled(140);
    const btnH = scaled(36);
    const btnGap = scaled(16);
    const btnsY = codeY + scaled(55);

    this.createOverlayBtn(container, cx - btnW / 2 - btnGap / 2, btnsY, btnW, btnH,
      'BAIXAR .TXT', 0x225522, 0x338833, '#88ff88', () => {
        downloadSaveFile();
        this.showFeedback(container, cx, btnsY + scaled(35), 'Arquivo baixado!', '#88ff88');
      });

    this.createOverlayBtn(container, cx + btnW / 2 + btnGap / 2, btnsY, btnW, btnH,
      'COPIAR CÓDIGO', 0x222255, 0x333388, '#8888ff', () => {
        navigator.clipboard.writeText(code).then(() => {
          this.showFeedback(container, cx, btnsY + scaled(35), 'Código copiado!', '#8888ff');
        }).catch(() => {
          this.showFeedback(container, cx, btnsY + scaled(35), 'Erro ao copiar', '#ff4444');
        });
      });
  }

  // ── Import Overlay ──────────────────────────────────────────────
  private showImportOverlay(): void {
    const { container, cx, contentY, panelW } = this.createOverlayBase('IMPORTAR DADOS');

    container.add(this.add.text(cx, contentY, 'Envie um arquivo .txt ou cole o código\npara restaurar seu save.', {
      fontSize: fontSize(9), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5, 0).setDepth(52));

    container.add(this.add.text(cx, contentY + scaled(35), 'ISTO SUBSTITUIRÁ SEUS DADOS ATUAIS!', {
      fontSize: fontSize(9), color: '#ff6644', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(52));

    // Code input area
    const codeY = contentY + scaled(65);
    const codeW = panelW - scaled(40);
    const codeH = scaled(28);
    const codeGfx = this.add.graphics().setDepth(52);
    codeGfx.fillStyle(0x000000, 0.5);
    codeGfx.fillRoundedRect(cx - codeW / 2, codeY - codeH / 2, codeW, codeH, scaled(4));
    codeGfx.lineStyle(1, 0x333355);
    codeGfx.strokeRoundedRect(cx - codeW / 2, codeY - codeH / 2, codeW, codeH, scaled(4));
    container.add(codeGfx);

    const codePlaceholder = this.add.text(cx, codeY, 'Clique em COLAR CÓDIGO para importar...', {
      fontSize: fontSize(7), color: '#555577', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(53);
    container.add(codePlaceholder);

    // Buttons
    const btnW = scaled(140);
    const btnH = scaled(36);
    const btnGap = scaled(16);
    const btnsY = codeY + scaled(45);

    this.createOverlayBtn(container, cx - btnW / 2 - btnGap / 2, btnsY, btnW, btnH,
      'CARREGAR .TXT', 0x225522, 0x338833, '#88ff88', () => {
        importSaveFile().then((success) => {
          if (success) {
            this.showFeedback(container, cx, btnsY + scaled(35), 'Dados importados! Recarregando...', '#88ff88');
            this.time.delayedCall(1200, () => this.scene.start('SaveScene'));
          } else {
            this.showFeedback(container, cx, btnsY + scaled(35), 'Arquivo inválido!', '#ff4444');
          }
        });
      });

    this.createOverlayBtn(container, cx + btnW / 2 + btnGap / 2, btnsY, btnW, btnH,
      'COLAR CÓDIGO', 0x222255, 0x333388, '#8888ff', () => {
        navigator.clipboard.readText().then((text) => {
          if (!text.trim()) {
            this.showFeedback(container, cx, btnsY + scaled(35), 'Clipboard vazio!', '#ff4444');
            return;
          }
          const success = importSaveCode(text);
          if (success) {
            codePlaceholder.setText(text.substring(0, 40) + (text.length > 40 ? '...' : ''));
            codePlaceholder.setColor('#88ff88');
            this.showFeedback(container, cx, btnsY + scaled(35), 'Dados importados! Recarregando...', '#88ff88');
            this.time.delayedCall(1200, () => this.scene.start('SaveScene'));
          } else {
            this.showFeedback(container, cx, btnsY + scaled(35), 'Código inválido!', '#ff4444');
          }
        }).catch(() => {
          this.showFeedback(container, cx, btnsY + scaled(35), 'Erro ao ler clipboard', '#ff4444');
        });
      });
  }

  // ── Delete Overlay ──────────────────────────────────────────────
  private showDeleteOverlay(): void {
    const { container, cx, contentY } = this.createOverlayBase('APAGAR DADOS');

    container.add(this.add.text(cx, contentY, 'Tem certeza que deseja APAGAR\nTODOS os seus dados?\n\nIsto inclui: coins, upgrades,\npokédex, recordes e estatísticas.', {
      fontSize: fontSize(10), color: '#aaaaaa', fontFamily: 'monospace',
      align: 'center', lineSpacing: scaled(4),
    }).setOrigin(0.5, 0).setDepth(52));

    container.add(this.add.text(cx, contentY + scaled(75), 'ESTA AÇÃO NÃO PODE SER DESFEITA!', {
      fontSize: fontSize(10), color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(52));

    const btnW = scaled(140);
    const btnH = scaled(36);
    const btnGap = scaled(16);
    const btnsY = contentY + scaled(120);

    this.createOverlayBtn(container, cx - btnW / 2 - btnGap / 2, btnsY, btnW, btnH,
      'CANCELAR', 0x333355, 0x444466, '#aaaacc', () => {
        this.closeOverlay();
      });

    this.createOverlayBtn(container, cx + btnW / 2 + btnGap / 2, btnsY, btnW, btnH,
      'CONFIRMAR', 0x662222, 0x883333, '#ff6666', () => {
        resetSave();
        this.showFeedback(container, cx, btnsY + scaled(35), 'Dados apagados! Recarregando...', '#ff8888');
        this.time.delayedCall(1200, () => this.scene.start('SaveScene'));
      });
  }

  // ── Feedback ───────────────────────────────────────────────────
  private showFeedback(
    container: Phaser.GameObjects.Container,
    x: number, y: number,
    message: string, color: string,
  ): void {
    const fb = this.add.text(x, y, message, {
      fontSize: fontSize(9), color, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(55);
    container.add(fb);

    this.tweens.add({
      targets: fb,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => fb.destroy(),
    });
  }
}
