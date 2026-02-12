import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import {
  initSaveSystem, getLifetimeStats, getSaveData,
} from '../systems/SaveSystem';
import type { LifetimeStats } from '../systems/SaveSystem';
import { fontSize, scaled } from '../utils/ui-scale';
import { t } from '../i18n';

// ── Category colors ────────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: number; border: number; title: number }> = {
  combat:  { bg: 0x2a1111, border: 0xcc4444, title: 0xff6644 },
  explore: { bg: 0x112233, border: 0x4488cc, title: 0x66aaff },
  economy: { bg: 0x2a2211, border: 0xccaa44, title: 0xffcc00 },
  records: { bg: 0x1a1133, border: 0x8855cc, title: 0xaa77ff },
};

interface StatEntry {
  readonly label: string;
  readonly value: string;
  readonly icon?: string;
}

export class StatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatsScene' });
  }

  create(): void {
    initSaveSystem();
    const { width, height } = this.cameras.main;
    const stats = getLifetimeStats();
    const save = getSaveData();

    // ── Background ─────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f23);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, 0xffffff, 0.03);
    const gridStep = scaled(40);
    for (let x = 0; x < width; x += gridStep) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += gridStep) bg.lineBetween(0, y, width, y);

    // ── Header ─────────────────────────────────────────────────────
    this.add.text(width / 2, scaled(28), t('statsScene.title'), {
      fontSize: fontSize(22), color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, scaled(52), t('statsScene.subtitle'), {
      fontSize: fontSize(10), color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // ── Build stat entries by category ─────────────────────────────
    const combat = this.buildCombatStats(stats);
    const explore = this.buildExploreStats(stats);
    const economy = this.buildEconomyStats(stats, save.coins);
    const records = this.buildRecordStats(stats, save.records);

    // ── Layout: 2 columns × 2 rows ───────────────────────────────
    const categories = [
      { key: 'combat',  title: t('statsScene.combat'),   entries: combat },
      { key: 'explore', title: t('statsScene.explore'),  entries: explore },
      { key: 'economy', title: t('statsScene.economy'),  entries: economy },
      { key: 'records', title: t('statsScene.records'),  entries: records },
    ];

    const cardW = Math.min(scaled(280), (width - scaled(50)) / 2);
    const cardGapX = scaled(14);
    const cardGapY = scaled(14);
    const totalW = 2 * cardW + cardGapX;
    const startX = (width - totalW) / 2;
    const startY = scaled(70);

    const container = this.add.container(0, 0).setDepth(5);

    categories.forEach((cat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = startX + col * (cardW + cardGapX);
      const entryH = scaled(16);
      const headerH = scaled(26);
      const paddingY = scaled(8);
      const cardH = headerH + cat.entries.length * entryH + paddingY * 2;
      const cy = startY + row * (Math.max(cardH, scaled(120)) + cardGapY);

      this.drawCategoryCard(container, cx, cy, cardW, cardH, cat.key, cat.title, cat.entries);
    });

    // ── Starter usage row ──────────────────────────────────────────
    const starterY = startY + 2 * (scaled(130) + cardGapY) + scaled(5);
    this.drawStarterUsage(container, width, starterY, stats);

    // ── Botão Voltar ──────────────────────────────────────────────
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

    const btnText = this.add.text(width / 2, btnY, t('ui.back'), {
      fontSize: fontSize(14), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    const btnHit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(12);

    btnHit.on('pointerover', () => { drawBtn(true); btnText.setColor('#ffcc00'); SoundManager.playHover(); });
    btnHit.on('pointerout', () => { drawBtn(false); btnText.setColor('#ffffff'); });
    btnHit.on('pointerdown', () => { SoundManager.playClick(); this.scene.start('TitleScene'); });

    // ── Fade in ───────────────────────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ── Category card renderer ────────────────────────────────────────
  private drawCategoryCard(
    container: Phaser.GameObjects.Container,
    x: number, y: number,
    w: number, h: number,
    catKey: string,
    title: string,
    entries: StatEntry[],
  ): void {
    const colors = CAT_COLORS[catKey] ?? CAT_COLORS.combat;
    const gfx = this.add.graphics();

    const r = scaled(8);
    // Shadow
    gfx.fillStyle(0x000000, 0.4);
    gfx.fillRoundedRect(x + 2, y + 2, w, h, r);
    // Background
    gfx.fillStyle(colors.bg, 0.95);
    gfx.fillRoundedRect(x, y, w, h, r);
    // Border
    gfx.lineStyle(2, colors.border, 0.7);
    gfx.strokeRoundedRect(x, y, w, h, r);
    // Header highlight
    gfx.fillStyle(colors.border, 0.15);
    gfx.fillRoundedRect(x + 2, y + 2, w - 4, scaled(22), { tl: scaled(6), tr: scaled(6), bl: 0, br: 0 });
    container.add(gfx);

    // Title
    container.add(this.add.text(x + scaled(10), y + scaled(6), title, {
      fontSize: fontSize(10), color: Phaser.Display.Color.IntegerToColor(colors.title).rgba,
      fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(6));

    // Entries
    const entryStartY = y + scaled(28);
    const rowH = scaled(16);
    entries.forEach((entry, i) => {
      const ey = entryStartY + i * rowH;

      // Icon (if texture exists)
      if (entry.icon && this.textures.exists(entry.icon)) {
        const iconScale = 0.8 * (scaled(16) / 16);
        const icon = this.add.image(x + scaled(14), ey + scaled(6), entry.icon).setScale(iconScale).setDepth(6);
        container.add(icon);
      }

      const labelX = entry.icon ? x + scaled(26) : x + scaled(10);

      // Label
      container.add(this.add.text(labelX, ey, entry.label, {
        fontSize: fontSize(9), color: '#aaaaaa', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 1,
      }).setDepth(6));

      // Value (right-aligned)
      container.add(this.add.text(x + w - scaled(10), ey, entry.value, {
        fontSize: fontSize(9), color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(1, 0).setDepth(6));
    });
  }

  // ── Starter usage bar ─────────────────────────────────────────────
  private drawStarterUsage(
    container: Phaser.GameObjects.Container,
    sceneWidth: number,
    y: number,
    stats: Readonly<LifetimeStats>,
  ): void {
    const starters = Object.entries(stats.starterRuns);
    if (starters.length === 0) return;

    const totalRuns = starters.reduce((sum, [, count]) => sum + count, 0);
    if (totalRuns === 0) return;

    const STARTER_COLORS: Record<string, number> = {
      charmander: 0xff6622,
      squirtle: 0x4488ff,
      bulbasaur: 0x44bb44,
    };

    const barW = Math.min(scaled(400), sceneWidth - scaled(60));
    const barH = scaled(16);
    const barX = (sceneWidth - barW) / 2;
    const barOffY = scaled(14);
    const barR = scaled(4);

    container.add(this.add.text(sceneWidth / 2, y, t('statsScene.startersUsed'), {
      fontSize: fontSize(9), color: '#888888', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(6));

    const gfx = this.add.graphics().setDepth(6);
    // Background bar
    gfx.fillStyle(0x222244, 0.8);
    gfx.fillRoundedRect(barX, y + barOffY, barW, barH, barR);

    let offsetX = 0;
    starters.forEach(([key, count]) => {
      const pct = count / totalRuns;
      const segW = Math.max(2, barW * pct);
      const color = STARTER_COLORS[key] ?? 0xaaaaaa;

      gfx.fillStyle(color, 0.9);
      if (offsetX === 0) {
        gfx.fillRoundedRect(barX + offsetX, y + barOffY, segW, barH, { tl: barR, tr: 0, bl: barR, br: 0 });
      } else if (offsetX + segW >= barW - 1) {
        gfx.fillRoundedRect(barX + offsetX, y + barOffY, segW, barH, { tl: 0, tr: barR, bl: 0, br: barR });
      } else {
        gfx.fillRect(barX + offsetX, y + barOffY, segW, barH);
      }

      // Label below
      const labelX = barX + offsetX + segW / 2;
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      container.add(this.add.text(labelX, y + scaled(34), `${name} ${Math.round(pct * 100)}%`, {
        fontSize: fontSize(8), color: Phaser.Display.Color.IntegerToColor(color).rgba,
        fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5, 0).setDepth(6));

      offsetX += segW;
    });

    container.add(gfx);
  }

  // ── Stat builders ─────────────────────────────────────────────────

  private buildCombatStats(s: Readonly<LifetimeStats>): StatEntry[] {
    const entries: StatEntry[] = [
      { label: t('statsScene.totalKills'), value: this.fmtNumber(s.totalKills) },
      { label: t('statsScene.bossesKilled'), value: this.fmtNumber(s.bossesKilled) },
      { label: t('statsScene.totalDamage'), value: this.fmtNumber(s.totalDamageDealt) },
      { label: t('statsScene.bestCombo'), value: `${s.bestCombo}x` },
    ];
    if (s.favoriteAttack.name) {
      entries.push({
        label: t('statsScene.favoriteAttack'),
        value: this.prettifyAttackName(s.favoriteAttack.name),
      });
    }
    return entries;
  }

  private buildExploreStats(s: Readonly<LifetimeStats>): StatEntry[] {
    const km = (s.distanceTraveled / 1000).toFixed(1);
    return [
      { label: t('statsScene.totalRuns'), value: this.fmtNumber(s.totalRuns) },
      { label: t('statsScene.totalDeaths'), value: this.fmtNumber(s.totalDeaths) },
      { label: t('statsScene.totalTime'), value: this.fmtDuration(s.totalTimePlayed) },
      { label: t('statsScene.distance'), value: `${km} km` },
      { label: t('statsScene.highestEvolution'), value: s.highestEvolution || '---' },
    ];
  }

  private buildEconomyStats(s: Readonly<LifetimeStats>, currentCoins: number): StatEntry[] {
    return [
      { label: t('statsScene.currentCoins'), value: `₽ ${this.fmtNumber(currentCoins)}` },
      { label: t('statsScene.totalCoinsEarned'), value: `₽ ${this.fmtNumber(s.totalCoinsEarned)}` },
      { label: t('statsScene.totalCoinsSpent'), value: `₽ ${this.fmtNumber(s.totalCoinsSpent)}` },
      { label: t('statsScene.berriesCollected'), value: this.fmtNumber(s.berriesCollected) },
      { label: t('statsScene.xpCollected'), value: this.fmtNumber(s.xpCollected) },
    ];
  }

  private buildRecordStats(
    s: Readonly<LifetimeStats>,
    records: Readonly<{ bestTime: number; bestKills: number; bestLevel: number }>,
  ): StatEntry[] {
    return [
      { label: t('statsScene.bestTime'), value: this.fmtDuration(records.bestTime) },
      { label: t('statsScene.bestKills'), value: this.fmtNumber(records.bestKills) },
      { label: t('statsScene.bestLevel'), value: `Lv. ${records.bestLevel}` },
      { label: t('statsScene.bestComboRecord'), value: `${s.bestCombo}x` },
    ];
  }

  // ── Formatters ────────────────────────────────────────────────────

  private fmtNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
  }

  private fmtDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }

  private prettifyAttackName(raw: string): string {
    return raw
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, c => c.toUpperCase())
      .trim();
  }
}
