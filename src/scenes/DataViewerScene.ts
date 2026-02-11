import Phaser from 'phaser';
import { STARTERS, ATTACKS } from '../config';
import { WAVES, BOSS_SCHEDULE } from '../data/enemies/index';
import { RATICATE } from '../data/enemies/raticate';
import { ARBOK } from '../data/enemies/arbok';
import { NIDOKING } from '../data/enemies/nidoking';
import { SNORLAX } from '../data/enemies/snorlax';
import { BEEDRILL } from '../data/enemies/beedrill';
import { VILEPLUME } from '../data/enemies/vileplume';
import { PRIMEAPE } from '../data/enemies/primeape';
import { GENGAR } from '../data/enemies/gengar';
import { FEAROW } from '../data/enemies/fearow';
import { PIDGEOT } from '../data/enemies/pidgeot';
import { MACHAMP } from '../data/enemies/machamp';
import { GOLEM } from '../data/enemies/golem';
import { ALAKAZAM_BOSS } from '../data/enemies/alakazam-boss';
import { HELD_ITEMS } from '../data/items/held-items';
import { fontSize, scaled } from '../utils/ui-scale';

// ── Colors ─────────────────────────────────────────────────────────────
const GREEN = '#00ff88';
const YELLOW = '#ffcc00';
const ORANGE = '#ff6644';
const RED = '#ff4444';
const DIM = '#666666';
const WHITE = '#ffffff';
const GRAY = '#aaaaaa';

const ELEMENT_COLORS: Readonly<Record<string, string>> = {
  fire: '#ff6600', water: '#3388ff', grass: '#22cc44', dragon: '#7744ff',
  normal: '#aaaaaa', flying: '#88ccff', ice: '#88ddff', poison: '#9944cc',
};

// ── Tab names ──────────────────────────────────────────────────────────
const TABS = ['WAVES', 'ATAQUES', 'ITENS', 'EVENTOS'] as const;

// ── Starter → attack keys ──────────────────────────────────────────────
const STARTER_ATTACK_KEYS: readonly string[][] = [
  // Charmander
  ['ember','scratch','fireSpin','smokescreen','fireFang','flameCharge',
   'dragonBreath','slash','flamethrower','dragonClaw',
   'airSlash','flareBlitz','hurricane','outrage','heatWave','dracoMeteor',
   'inferno','fireBlast','blastBurn','furySwipes','blazeKick',
   'dragonPulse','nightSlash','aerialAce','flareRush','dragonRush'],
  // Squirtle
  ['waterGun','bubble','tackle','rapidSpin','withdraw','aquaJet',
   'waterPulse','hydroPump','aquaTail','whirlpool',
   'iceBeam','flashCannon','surf','liquidation','rainDance','hydroCannon',
   'scald','bubbleBeam','bodySlam','gyroBall','waterfall',
   'originPulse','muddyWater','crabhammer','waterSpout','blizzard'],
  // Bulbasaur
  ['vineWhip','razorLeaf','leechSeed','growl','poisonPowder2',
   'sleepPowder','stunSpore','leafBlade','sludgeBomb',
   'solarBeam','petalDance','gigaDrain','energyBall','frenzyPlant','petalBlizzard',
   'powerWhip','leafStorm','seedBomb','bodySlam2','toxic',
   'spore','solarBlade','sludgeWave2','hyperBeam2','floraBurst'],
];

// ── Boss configs ───────────────────────────────────────────────────────
const BOSS_MAP: Readonly<Record<string, typeof RATICATE>> = {
  raticate: RATICATE, arbok: ARBOK, nidoking: NIDOKING, snorlax: SNORLAX,
  beedrill: BEEDRILL, vileplume: VILEPLUME, primeape: PRIMEAPE, gengar: GENGAR,
  fearow: FEAROW, pidgeot: PIDGEOT, machamp: MACHAMP, golem: GOLEM,
  'alakazam-boss': ALAKAZAM_BOSS,
};

// ── Event data (hardcoded from EventSystem) ────────────────────────────
interface EventInfo {
  readonly name: string;
  readonly trigger: 'timed' | 'wave';
  readonly timeMs?: number;
  readonly repeatMs?: number;
  readonly chance?: number;
  readonly minTimeMs?: number;
  readonly cooldownMs?: number;
  readonly description: string;
  readonly details: string;
}

const EVENT_DATA: readonly EventInfo[] = [
  { name: 'PokéCenter',    trigger: 'timed', timeMs: 180_000, repeatMs: 180_000, description: 'Zona de cura',           details: 'Raio 80px, +5HP/500ms, duração 15s' },
  { name: 'Prof. Oak',     trigger: 'timed', timeMs: 240_000, repeatMs: 0,       description: 'Spawna gacha box',       details: 'One-shot, reward aleatório' },
  { name: 'Swarm',         trigger: 'wave',  chance: 0.05, minTimeMs: 120_000, cooldownMs: 60_000, description: '40 inimigos extras', details: 'Min 2:00, CD 60s' },
  { name: 'Eclipse',       trigger: 'timed', timeMs: 360_000, repeatMs: 0,       description: 'Escuridão 30s',          details: 'Brightness 0.35, one-shot' },
  { name: 'Legendary Mew', trigger: 'timed', timeMs: 480_000, repeatMs: 0,       description: 'Mew aparece 15s',        details: 'One-shot, Mew invencível' },
  { name: 'Treasure Room',  trigger: 'wave', chance: 0.08, minTimeMs: 180_000, cooldownMs: 90_000, description: '3-5 baús + 3 Machop', details: 'Min 3:00, CD 90s' },
];

// ── Type boost items for calculator ────────────────────────────────────
const TYPE_BOOST: Readonly<Record<string, string>> = {
  fire: 'Charcoal', water: 'Mystic Water', grass: 'Miracle Seed',
  dragon: 'Dragon Fang', flying: 'Sharp Beak', ice: 'Never-Melt Ice', poison: 'Black Sludge',
};

// ── Helpers ────────────────────────────────────────────────────────────
function fmtTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ════════════════════════════════════════════════════════════════════════
export class DataViewerScene extends Phaser.Scene {
  // ── State ──────────────────────────────────────────────────────────
  private currentTab = 0;
  private wavesMode: 'timeline' | 'table' = 'timeline';
  private selectedStarter = 0;
  private selectedAtkIdx = 0;
  private calcKey: string | null = null;
  private itemsSubTab = 0;

  // ── UI refs ────────────────────────────────────────────────────────
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private content: Phaser.GameObjects.Container | null = null;
  private maskGfx: Phaser.GameObjects.Graphics | null = null;
  private scrollOffset = 0;
  private contentH = 0;
  private vTop = 0;
  private vHeight = 0;
  private atkKeys: string[] = [];

  constructor() {
    super({ key: 'DataViewerScene' });
  }

  create(): void {
    this.currentTab = 0;
    this.wavesMode = 'timeline';
    this.selectedStarter = 0;
    this.selectedAtkIdx = 0;
    this.calcKey = null;
    this.itemsSubTab = 0;
    this.scrollOffset = 0;

    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);

    // Visible area
    this.vTop = scaled(50);
    this.vHeight = height - scaled(90);

    this.renderTabBar();
    this.renderFooter();
    this.setupKeyboard();
    this.renderContent();
  }

  // ── Tab Bar ────────────────────────────────────────────────────────
  private renderTabBar(): void {
    const { width } = this.cameras.main;
    const gap = scaled(20);
    const totalW = TABS.length * scaled(80) + (TABS.length - 1) * gap;
    let x = (width - totalW) / 2;

    this.tabTexts = TABS.map((name, i) => {
      const t = this.add.text(x, scaled(20), name, {
        fontSize: fontSize(13), color: i === 0 ? GREEN : DIM,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(10).setInteractive({ useHandCursor: true });

      t.on('pointerdown', () => this.switchTab(i));
      t.on('pointerover', () => { if (i !== this.currentTab) t.setColor(WHITE); });
      t.on('pointerout', () => { if (i !== this.currentTab) t.setColor(DIM); });

      x += scaled(80) + gap;
      return t;
    });

    // Separator line
    this.add.text(0, scaled(38), '─'.repeat(200), {
      fontSize: fontSize(8), color: '#333333', fontFamily: 'monospace',
    }).setDepth(10);
  }

  private renderFooter(): void {
    const { width, height } = this.cameras.main;
    this.add.text(0, height - scaled(38), '─'.repeat(200), {
      fontSize: fontSize(8), color: '#333333', fontFamily: 'monospace',
    }).setDepth(10);

    this.add.text(width / 2, height - scaled(20),
      '[ESC] Voltar    [1-4] Tabs    [◀▶] Navegar    [▲▼] Scroll', {
        fontSize: fontSize(10), color: DIM, fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(10);
  }

  // ── Tab Switching ──────────────────────────────────────────────────
  private switchTab(index: number): void {
    if (index === this.currentTab) return;
    this.tabTexts[this.currentTab].setColor(DIM);
    this.currentTab = index;
    this.tabTexts[this.currentTab].setColor(GREEN);
    this.scrollOffset = 0;
    this.calcKey = null;
    this.selectedAtkIdx = 0;
    this.renderContent();
  }

  // ── Content System ─────────────────────────────────────────────────
  private clearContent(): void {
    if (this.content) { this.content.destroy(true); this.content = null; }
    if (this.maskGfx) { this.maskGfx.destroy(); this.maskGfx = null; }
  }

  private initContent(): Phaser.GameObjects.Container {
    this.clearContent();
    const { width } = this.cameras.main;

    this.content = this.add.container(0, this.vTop);

    // Mask (make = off-display-list, so the white fill is invisible)
    this.maskGfx = this.make.graphics();
    this.maskGfx.fillStyle(0xffffff);
    this.maskGfx.fillRect(0, this.vTop, width, this.vHeight);
    this.content.setMask(this.maskGfx.createGeometryMask());

    return this.content;
  }

  private txt(x: number, y: number, text: string, color: string, size = 11): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, text, {
      fontSize: fontSize(size), color, fontFamily: 'monospace',
    });
    this.content!.add(t);
    return t;
  }

  private finishContent(totalH: number): void {
    this.contentH = totalH;
    this.content!.y = this.vTop - this.scrollOffset;
  }

  private doScroll(delta: number): void {
    const max = Math.max(0, this.contentH - this.vHeight);
    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + delta, 0, max);
    if (this.content) this.content.y = this.vTop - this.scrollOffset;
  }

  // ── Render Dispatcher ──────────────────────────────────────────────
  private renderContent(): void {
    switch (this.currentTab) {
      case 0: this.renderWaves(); break;
      case 1: this.renderAttacks(); break;
      case 2: this.renderItems(); break;
      case 3: this.renderEvents(); break;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TAB 0: WAVES
  // ══════════════════════════════════════════════════════════════════
  private renderWaves(): void {
    this.initContent();
    const P = scaled(20);
    const LH = scaled(16);
    let y = 0;

    // Sub-mode selector
    const modes = ['TIMELINE', 'TABLE'] as const;
    let mx = P;
    for (const mode of modes) {
      const active = (mode === 'TIMELINE' && this.wavesMode === 'timeline') ||
                     (mode === 'TABLE' && this.wavesMode === 'table');
      const label = (active ? '▸ ' : '  ') + mode;
      const t = this.txt(mx, y, label, active ? GREEN : DIM, 12);
      t.setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        this.wavesMode = mode.toLowerCase() as 'timeline' | 'table';
        this.scrollOffset = 0;
        this.renderContent();
      });
      mx += scaled(100);
    }
    this.txt(mx + scaled(20), y, '(T para trocar)', DIM, 9);
    y += LH * 1.8;

    // Header
    this.txt(P, y, `FIRE RED  │  ${WAVES.length} WAVES  │  ${fmtSec(WAVES.length * 30)}  │  ${BOSS_SCHEDULE.length} BOSSES`, YELLOW, 12);
    y += LH * 1.5;

    if (this.wavesMode === 'table') {
      y = this.renderWavesTable(y, P, LH);
    } else {
      y = this.renderWavesTimeline(y, P, LH);
    }
    this.finishContent(y + scaled(20));
  }

  private renderWavesTable(y: number, P: number, LH: number): number {
    // Column header
    this.txt(P, y, 'WAVE  TIME    ENEMIES                                 RATE     MAX', YELLOW, 10);
    y += LH;
    this.txt(P, y, '─'.repeat(70), DIM, 10);
    y += LH;

    // Group bosses by wave index they appear after
    const bossesAfterWave = new Map<number, Array<{ type: string; time: number }>>();
    for (const b of BOSS_SCHEDULE) {
      const waveIdx = Math.min(Math.floor(b.timeSeconds / 30), WAVES.length - 1);
      if (!bossesAfterWave.has(waveIdx)) bossesAfterWave.set(waveIdx, []);
      bossesAfterWave.get(waveIdx)!.push({ type: b.type, time: b.timeSeconds });
    }

    for (let i = 0; i < WAVES.length; i++) {
      // Phase divider every 20 waves
      if (i % 20 === 0) {
        const pNum = Math.floor(i / 20) + 1;
        const pStart = fmtSec(i * 30);
        const pEnd = fmtSec((i + 20) * 30);
        if (i > 0) y += LH * 0.5;
        this.txt(P, y, `══════ PHASE ${pNum} (${pStart} — ${pEnd}) ══════`, YELLOW, 12);
        y += LH * 1.2;
      }

      const w = WAVES[i];
      const timeSec = i * 30;
      const timeStr = fmtSec(timeSec).padEnd(8);
      const idx = i.toString().padStart(2, '0');
      const enemies = w.enemies.map(e => `${e.type}×${e.weight}`).join(' ');
      const rate = (w.spawnRate / 1000).toFixed(1) + 's';
      const line = `${idx}    ${timeStr}${enemies.padEnd(40)}${rate.padEnd(9)}${w.maxEnemies}`;
      this.txt(P, y, line, GREEN, 10);
      y += LH;

      // Bosses that spawn during this wave's 30s window
      const bosses = bossesAfterWave.get(i);
      if (bosses) {
        for (const boss of bosses) {
          y = this.renderBossBox(y, P, LH, boss.type, boss.time);
        }
      }
    }
    return y;
  }

  private renderBossBox(y: number, P: number, LH: number, bossType: string, timeSec: number): number {
    const boss = BOSS_MAP[bossType];
    if (!boss) return y;

    y += LH * 0.5;
    this.txt(P, y, `╔══════ BOSS: ${boss.name.toUpperCase()} @ ${fmtSec(timeSec)} ══════╗`, RED, 11);
    y += LH;
    this.txt(P, y, `║ HP: ${boss.hp}  SPD: ${boss.speed}  DMG: ${boss.damage}  XP: ${boss.xpValue}  RES: ${Math.round(boss.resistance * 100)}%`, ORANGE, 10);
    y += LH;
    if (boss.hpRegenPerSec > 0) {
      this.txt(P, y, `║ Regen: ${boss.hpRegenPerSec} HP/s  │  Archetype: ${boss.archetype}`, ORANGE, 10);
      y += LH;
    }
    for (const atk of boss.bossAttacks) {
      const cd = (atk.cooldownMs / 1000).toFixed(1);
      this.txt(P, y, `║ ${atk.name}: ${atk.pattern}, ${atk.damage} dmg, ${cd}s CD`, ORANGE, 10);
      y += LH;
    }
    this.txt(P, y, '╚' + '═'.repeat(40) + '╝', RED, 11);
    y += LH * 1.5;
    return y;
  }

  private renderWavesTimeline(y: number, P: number, LH: number): number {
    // Build timeline entries
    interface TEntry { timeMs: number; kind: 'wave' | 'boss' | 'event'; render: (yy: number) => number }
    const entries: TEntry[] = [];

    // Waves (with phase dividers)
    for (let i = 0; i < WAVES.length; i++) {
      const w = WAVES[i];
      const tMs = i * 30_000;
      const idx = i;
      entries.push({ timeMs: tMs, kind: 'wave', render: (yy) => {
        // Phase divider at start of each phase
        if (idx % 20 === 0) {
          const pNum = Math.floor(idx / 20) + 1;
          if (idx > 0) yy += LH * 0.5;
          this.txt(P, yy, `══════ PHASE ${pNum} (${fmtTime(idx * 30_000)} — ${fmtTime((idx + 20) * 30_000)}) ══════`, YELLOW, 12);
          yy += LH * 1.2;
        }
        const enemies = w.enemies.map(e => `${e.type}×${e.weight}`).join(' ');
        const pad = idx.toString().padStart(2, '0');
        this.txt(P, yy, `${fmtTime(tMs)} ┬ WAVE ${pad} ─ ${enemies}  [${w.maxEnemies}max, ${(w.spawnRate / 1000).toFixed(1)}s]`, GREEN, 10);
        return yy + LH;
      }});
    }

    // Bosses
    for (const b of BOSS_SCHEDULE) {
      const boss = BOSS_MAP[b.type];
      if (!boss) continue;
      entries.push({ timeMs: b.timeSeconds * 1000, kind: 'boss', render: (yy) => {
        yy += LH * 0.3;
        this.txt(P, yy, `${fmtSec(b.timeSeconds)} ╠══ BOSS: ${boss.name.toUpperCase()} ══`, RED, 11);
        yy += LH;
        this.txt(P + scaled(40), yy, `HP:${boss.hp} SPD:${boss.speed} DMG:${boss.damage} XP:${boss.xpValue}`, ORANGE, 10);
        yy += LH;
        for (const atk of boss.bossAttacks) {
          this.txt(P + scaled(40), yy, `${atk.name} (${atk.pattern}) — ${atk.damage}dmg, ${(atk.cooldownMs / 1000).toFixed(1)}s`, ORANGE, 10);
          yy += LH;
        }
        yy += LH * 0.3;
        return yy;
      }});
    }

    // Timed events
    for (const evt of EVENT_DATA) {
      if (evt.trigger === 'timed' && evt.timeMs !== undefined) {
        entries.push({ timeMs: evt.timeMs, kind: 'event', render: (yy) => {
          this.txt(P, yy, `${fmtTime(evt.timeMs!)} ├─ ${evt.name}: ${evt.description}`, '#aa88ff', 10);
          yy += LH;
          this.txt(P + scaled(40), yy, evt.details, DIM, 9);
          yy += LH;
          return yy;
        }});
        // Repeating events
        if (evt.repeatMs && evt.repeatMs > 0) {
          const maxTime = 3_200_000; // ~53 min (beyond final boss)
          let t = evt.timeMs + evt.repeatMs;
          while (t < maxTime) {
            const tt = t;
            entries.push({ timeMs: tt, kind: 'event', render: (yy) => {
              this.txt(P, yy, `${fmtTime(tt)} ├─ ${evt.name} (repeat)`, '#aa88ff', 10);
              return yy + LH;
            }});
            t += evt.repeatMs;
          }
        }
      }
    }

    // Wave-triggered events (show as notes)
    for (const evt of EVENT_DATA) {
      if (evt.trigger === 'wave' && evt.minTimeMs !== undefined) {
        entries.push({ timeMs: evt.minTimeMs, kind: 'event', render: (yy) => {
          const pct = evt.chance !== undefined ? `${(evt.chance * 100).toFixed(0)}%` : '?%';
          this.txt(P, yy, `${fmtTime(evt.minTimeMs!)} ├─ ~possível: ${evt.name} (${pct}/wave)`, '#886699', 10);
          yy += LH;
          this.txt(P + scaled(40), yy, evt.details, DIM, 9);
          yy += LH;
          return yy;
        }});
      }
    }

    // Sort by time, then boss > event > wave
    const kindOrder = { boss: 0, event: 1, wave: 2 };
    entries.sort((a, b) => a.timeMs - b.timeMs || kindOrder[a.kind] - kindOrder[b.kind]);

    // Render
    for (const entry of entries) {
      y = entry.render(y);
    }

    return y;
  }

  // ══════════════════════════════════════════════════════════════════
  // TAB 1: ATAQUES
  // ══════════════════════════════════════════════════════════════════
  private renderAttacks(): void {
    this.initContent();
    const P = scaled(20);
    const LH = scaled(16);
    let y = 0;

    // Starter selector
    let sx = P;
    for (let i = 0; i < STARTERS.length; i++) {
      const active = i === this.selectedStarter;
      const name = STARTERS[i].name.toUpperCase();
      const label = active ? `▸ ${name}` : `  ${name}`;
      const t = this.txt(sx, y, label, active ? GREEN : DIM, 12);
      t.setInteractive({ useHandCursor: true });
      const idx = i;
      t.on('pointerdown', () => {
        this.selectedStarter = idx;
        this.selectedAtkIdx = 0;
        this.calcKey = null;
        this.scrollOffset = 0;
        this.renderContent();
      });
      sx += scaled(120);
    }
    this.txt(sx + scaled(20), y, '(◀▶ para trocar)', DIM, 9);
    y += LH * 1.8;

    // Column header
    this.txt(P, y, '  ATAQUE            ELE       DMG    CD       FORM', YELLOW, 10);
    y += LH;
    this.txt(P, y, '─'.repeat(65), DIM, 10);
    y += LH;

    // Group attacks by minForm
    const allKeys = STARTER_ATTACK_KEYS[this.selectedStarter];
    const forms = STARTERS[this.selectedStarter].forms ?? [];
    const byForm: Record<string, string[]> = { base: [], stage1: [], stage2: [] };
    for (const key of allKeys) {
      const atk = ATTACKS[key];
      if (atk) {
        const f = atk.minForm as string;
        if (byForm[f]) byForm[f].push(key);
      }
    }

    this.atkKeys = [];
    const formOrder = ['base', 'stage1', 'stage2'] as const;
    const formLabels = ['BASE', 'STAGE 1', 'STAGE 2'] as const;

    for (let fi = 0; fi < formOrder.length; fi++) {
      const fKey = formOrder[fi];
      const keys = byForm[fKey];
      if (keys.length === 0) continue;

      const formName = forms[fi]?.name ?? fKey;
      this.txt(P, y, `─── ${formLabels[fi]} (${formName}) ${'─'.repeat(40)}`, YELLOW, 10);
      y += LH;

      for (const key of keys) {
        const atk = ATTACKS[key];
        if (!atk) continue;
        const flatIdx = this.atkKeys.length;
        this.atkKeys.push(key);

        const selected = flatIdx === this.selectedAtkIdx;
        const cursor = selected ? '>' : ' ';
        const color = selected ? WHITE : GREEN;
        const elColor = ELEMENT_COLORS[atk.element] ?? GRAY;
        const cd = atk.baseCooldown > 0 ? `${(atk.baseCooldown / 1000).toFixed(1)}s` : 'pass';

        this.txt(P, y, `${cursor} ${atk.name.padEnd(18)}`, color, 10);
        this.txt(P + scaled(140), y, atk.element.padEnd(10), elColor, 10);
        this.txt(P + scaled(210), y, `${atk.baseDamage}`.padEnd(7), ORANGE, 10);
        this.txt(P + scaled(255), y, cd.padEnd(9), GRAY, 10);
        this.txt(P + scaled(310), y, atk.minForm, DIM, 10);
        y += LH;
      }
      y += LH * 0.5;
    }

    // Calculator
    if (this.calcKey) {
      y = this.renderCalculator(y, P, LH);
    } else {
      y += LH;
      this.txt(P, y, '[ENTER] para abrir Combo Calculator', DIM, 10);
      y += LH;
    }

    this.finishContent(y + scaled(20));
  }

  private renderCalculator(y: number, P: number, LH: number): number {
    const atk = ATTACKS[this.calcKey!];
    if (!atk) return y;

    // Passive attacks have no cooldown-based DPS
    if (atk.baseCooldown === 0) {
      this.txt(P, y, '◆ COMBO CALCULATOR', YELLOW, 13);
      y += LH * 1.5;
      this.txt(P, y, `${atk.name} — PASSIVA (efeito contínuo, sem cooldown)`, GREEN, 11);
      y += LH * 2;
      return y;
    }

    const maxLv = atk.maxLevel;
    const upgrades = maxLv - 1;
    const dmgPerLv = 5;
    const cdRedPerLv = 100;

    // Calculations
    const baseDmg = atk.baseDamage;
    const upgradeDmg = upgrades * dmgPerLv;
    const totalDmg = baseDmg + upgradeDmg;

    const baseCd = atk.baseCooldown;
    const upgradeCd = upgrades * cdRedPerLv;
    const totalCd = Math.max(500, baseCd - upgradeCd);
    const qpCd = Math.round(totalCd * 0.76);

    const typeItem = TYPE_BOOST[atk.element];
    const typeBonus = typeItem ? 0.5 : 0; // 10% × 5 levels = 50%
    const dmgAfterType = totalDmg * (1 + typeBonus);
    const dmgAfterSpecs = dmgAfterType * 1.40; // Choice Specs ×5 = +40%
    const critAvg = 1 + (0.25 * 0.5); // 25% chance × 50% extra = +12.5%
    const finalDmg = dmgAfterSpecs * critAvg;
    const projectiles = 4; // 1 base + 3 duplicator
    const dps = (finalDmg * projectiles) / (qpCd / 1000);

    // Render
    y += LH * 0.5;
    this.txt(P, y, '─'.repeat(55), DIM, 10);
    y += LH;
    this.txt(P, y, `◆ COMBO CALCULATOR — ${atk.name} (Level ${maxLv})`, YELLOW, 13);
    y += LH * 1.5;

    this.txt(P, y, `Base DMG: ${baseDmg} + upgrades(${upgrades}×${dmgPerLv}) = ${totalDmg}`, WHITE, 11);
    y += LH;
    this.txt(P, y, `Cooldown: ${baseCd}ms - ${upgradeCd}ms = ${totalCd}ms`, WHITE, 11);
    y += LH;
    this.txt(P, y, `+ Quick Powder ×3: ${totalCd} × 0.76 = ${qpCd}ms`, ORANGE, 11);
    y += LH;

    if (typeItem) {
      this.txt(P, y, `+ ${typeItem} ×5: ${totalDmg} × 1.50 = ${dmgAfterType.toFixed(1)}`, ORANGE, 11);
      y += LH;
    }

    this.txt(P, y, `+ Choice Specs ×5: ${dmgAfterType.toFixed(1)} × 1.40 = ${dmgAfterSpecs.toFixed(1)}`, ORANGE, 11);
    y += LH;
    this.txt(P, y, `+ Scope Lens ×5: 25% crit (×1.5) = avg ×${critAvg.toFixed(3)}`, ORANGE, 11);
    y += LH;
    this.txt(P, y, `Projéteis: 1 base + 3 duplicator = ${projectiles}`, WHITE, 11);
    y += LH * 1.5;

    this.txt(P, y, '─'.repeat(55), DIM, 10);
    y += LH;
    this.txt(P, y, `FINAL: ${finalDmg.toFixed(1)} dmg × ${projectiles} proj / ${(qpCd / 1000).toFixed(2)}s = `, WHITE, 12);
    this.txt(P + scaled(320), y, `${dps.toFixed(1)} DPS`, GREEN, 16);
    y += LH * 2;

    this.txt(P, y, '[ENTER] para fechar', DIM, 10);
    y += LH;
    return y;
  }

  // ══════════════════════════════════════════════════════════════════
  // TAB 2: ITENS
  // ══════════════════════════════════════════════════════════════════
  private renderItems(): void {
    this.initContent();
    const P = scaled(20);
    const LH = scaled(16);
    let y = 0;

    // Sub-tab selector
    const subs = ['HELD ITEMS', 'UPGRADES', 'PICKUPS'] as const;
    let sx = P;
    for (let i = 0; i < subs.length; i++) {
      const active = i === this.itemsSubTab;
      const label = (active ? '▸ ' : '  ') + subs[i];
      const t = this.txt(sx, y, label, active ? GREEN : DIM, 12);
      t.setInteractive({ useHandCursor: true });
      const idx = i;
      t.on('pointerdown', () => {
        this.itemsSubTab = idx;
        this.scrollOffset = 0;
        this.renderContent();
      });
      sx += scaled(120);
    }
    this.txt(sx + scaled(20), y, '(◀▶ para trocar)', DIM, 9);
    y += LH * 1.8;

    switch (this.itemsSubTab) {
      case 0: y = this.renderHeldItems(y, P, LH); break;
      case 1: y = this.renderUpgrades(y, P, LH); break;
      case 2: y = this.renderPickups(y, P, LH); break;
    }

    this.finishContent(y + scaled(20));
  }

  private renderHeldItems(y: number, P: number, LH: number): number {
    this.txt(P, y, 'ITEM             EFEITO                      MAX   POR LEVEL', YELLOW, 10);
    y += LH;
    this.txt(P, y, '─'.repeat(65), DIM, 10);
    y += LH;

    for (const key of Object.keys(HELD_ITEMS)) {
      const item = HELD_ITEMS[key];
      const name = item.name.padEnd(17);
      const effect = item.description.padEnd(28);
      const max = `${item.maxLevel}`.padEnd(6);
      const perLv = item.description.replace(/por nível/g, '/lv');
      this.txt(P, y, `${name}${effect}${max}${perLv}`, GREEN, 10);
      y += LH;
    }
    return y;
  }

  private renderUpgrades(y: number, P: number, LH: number): number {
    this.txt(P, y, 'UPGRADES — Stats do level-up', YELLOW, 12);
    y += LH * 1.5;

    const upgrades = [
      { name: 'Leftovers (Max HP Up)', effect: '+10 HP máximo, +0.5 HP/s regen', color: '#ff4444' },
      { name: 'Quick Claw (Speed Up)', effect: '+15% velocidade de movimento', color: '#44aaff' },
      { name: 'Magnet (Magnet Up)', effect: '+5 alcance de coleta de XP (max 90)', color: '#aa44ff' },
    ];

    for (const u of upgrades) {
      this.txt(P, y, u.name, u.color, 11);
      y += LH;
      this.txt(P + scaled(20), y, u.effect, GRAY, 10);
      y += LH * 1.3;
    }

    y += LH;
    this.txt(P, y, 'HELD ITEMS como upgrades (aparecem no level-up):', YELLOW, 11);
    y += LH;

    const itemUpgrades = [
      { name: 'Quick Powder', effect: '-8% cooldown de ataques (max 3 stacks = -24%)', color: '#88ddff' },
      { name: 'Revive', effect: 'Revive ao morrer (50% HP), evolui para Max Revive (100%)', color: '#ffaa00' },
      { name: 'Charcoal', effect: '+10% dano fire/lv (requer ataques fire)', color: '#ff6600' },
      { name: 'Mystic Water', effect: '+10% dano water/lv (requer ataques water)', color: '#3388ff' },
      { name: 'Miracle Seed', effect: '+10% dano grass/lv (requer ataques grass)', color: '#22cc44' },
      { name: 'Dragon Fang', effect: '+10% dano dragon/lv', color: '#7744ff' },
      { name: 'Sharp Beak', effect: '+10% dano flying/lv', color: '#88ccff' },
      { name: 'Choice Specs', effect: '+8% dano geral/lv', color: '#aa44ff' },
      { name: 'Scope Lens', effect: '+5% chance de crítico/lv', color: '#ff44aa' },
      { name: 'Razor Claw', effect: '+15% dano crítico/lv', color: '#cc4444' },
      { name: 'Shell Bell', effect: '+1.5% lifesteal/lv', color: '#ffcc44' },
      { name: 'Focus Band', effect: 'Sobrevive golpe fatal (CD -10s/lv, max 3)', color: '#ff8800' },
      { name: 'Wide Lens', effect: '+10% área de efeito/lv', color: '#44aaff' },
    ];

    for (const u of itemUpgrades) {
      this.txt(P + scaled(10), y, `• ${u.name}`, u.color, 10);
      this.txt(P + scaled(130), y, u.effect, GRAY, 10);
      y += LH;
    }
    return y;
  }

  private renderPickups(y: number, P: number, LH: number): number {
    this.txt(P, y, 'PICKUPS — Drops do chão', YELLOW, 12);
    y += LH * 1.5;

    const pickups = [
      { name: 'Oran Berry', effect: '+25 HP', color: '#4488ff' },
      { name: 'Sitrus Berry', effect: '+50 HP', color: '#ffcc00' },
      { name: 'Liechi Berry', effect: '2× DMG por 30s', color: '#ff4444' },
      { name: 'Salac Berry', effect: '1.5× SPD por 30s', color: '#44ddff' },
      { name: 'Magnet Burst', effect: 'Atrai XP gems + todos pickups', color: '#aa44ff' },
      { name: 'Duplicator', effect: '+1 projétil (max 3 stacks)', color: '#ffaa00' },
      { name: 'XP Share', effect: 'XP ×2 por 30s', color: '#88ff44' },
      { name: 'Friend Ball', effect: 'Captura companion (drop de boss 20%)', color: '#ff66aa' },
      { name: 'Rare Candy', effect: '+1 level instantâneo', color: '#ff44ff' },
      { name: 'Coin Small', effect: '₽5 (Rock Smash 25%)', color: '#ffcc44' },
      { name: 'Coin Medium', effect: '₽25 (Treasure Chest)', color: '#ffcc44' },
      { name: 'Coin Large', effect: '₽100 (Boss kill 3-5x)', color: '#ffaa00' },
    ];

    for (const p of pickups) {
      this.txt(P, y, `• ${p.name.padEnd(16)}`, p.color, 11);
      this.txt(P + scaled(140), y, p.effect, GRAY, 10);
      y += LH;
    }
    return y;
  }

  // ══════════════════════════════════════════════════════════════════
  // TAB 3: EVENTOS
  // ══════════════════════════════════════════════════════════════════
  private renderEvents(): void {
    this.initContent();
    const P = scaled(20);
    const LH = scaled(16);
    let y = 0;

    this.txt(P, y, 'EVENTOS — MAP 1 FIRE RED', YELLOW, 13);
    y += LH * 1.5;

    this.txt(P, y, 'EVENTO           TRIGGER    QUANDO       REPETE?          EFEITO', YELLOW, 10);
    y += LH;
    this.txt(P, y, '─'.repeat(70), DIM, 10);
    y += LH;

    for (const evt of EVENT_DATA) {
      const trigger = evt.trigger === 'timed' ? 'Tempo' : 'Wave';
      const when = evt.trigger === 'timed' && evt.timeMs !== undefined
        ? fmtTime(evt.timeMs)
        : evt.chance !== undefined ? `${(evt.chance * 100).toFixed(0)}%/wave` : '?';
      const repeats = evt.trigger === 'timed'
        ? (evt.repeatMs && evt.repeatMs > 0 ? `a cada ${evt.repeatMs / 60_000}min` : 'One-shot')
        : (evt.cooldownMs !== undefined ? `CD ${evt.cooldownMs / 1000}s` : '—');

      this.txt(P, y,
        evt.name.padEnd(17) + trigger.padEnd(11) + when.padEnd(13) + repeats.padEnd(17) + evt.description,
        GREEN, 10);
      y += LH;

      this.txt(P + scaled(20), y, evt.details, DIM, 10);
      y += LH * 1.5;
    }

    this.finishContent(y + scaled(20));
  }

  // ══════════════════════════════════════════════════════════════════
  // KEYBOARD
  // ══════════════════════════════════════════════════════════════════
  private setupKeyboard(): void {
    const kb = this.input.keyboard;
    if (!kb) return;

    kb.on('keydown-ESC', () => this.scene.start('SelectScene'));

    kb.on('keydown-ONE', () => this.switchTab(0));
    kb.on('keydown-TWO', () => this.switchTab(1));
    kb.on('keydown-THREE', () => this.switchTab(2));
    kb.on('keydown-FOUR', () => this.switchTab(3));

    kb.on('keydown-T', () => {
      if (this.currentTab === 0) {
        this.wavesMode = this.wavesMode === 'timeline' ? 'table' : 'timeline';
        this.scrollOffset = 0;
        this.renderContent();
      }
    });

    kb.on('keydown-ENTER', () => {
      if (this.currentTab === 1 && this.atkKeys.length > 0) {
        const key = this.atkKeys[this.selectedAtkIdx];
        this.calcKey = this.calcKey === key ? null : key;
        this.renderContent();
      }
    });

    kb.on('keydown-UP', () => {
      if (this.currentTab === 1 && this.atkKeys.length > 0) {
        this.selectedAtkIdx = Math.max(0, this.selectedAtkIdx - 1);
        this.calcKey = null;
        this.renderContent();
      } else {
        this.doScroll(-scaled(40));
      }
    });

    kb.on('keydown-DOWN', () => {
      if (this.currentTab === 1 && this.atkKeys.length > 0) {
        this.selectedAtkIdx = Math.min(this.atkKeys.length - 1, this.selectedAtkIdx + 1);
        this.calcKey = null;
        this.renderContent();
      } else {
        this.doScroll(scaled(40));
      }
    });

    kb.on('keydown-LEFT', () => {
      if (this.currentTab === 1) {
        this.selectedStarter = (this.selectedStarter - 1 + STARTERS.length) % STARTERS.length;
        this.selectedAtkIdx = 0;
        this.calcKey = null;
        this.scrollOffset = 0;
        this.renderContent();
      } else if (this.currentTab === 2) {
        this.itemsSubTab = (this.itemsSubTab - 1 + 3) % 3;
        this.scrollOffset = 0;
        this.renderContent();
      }
    });

    kb.on('keydown-RIGHT', () => {
      if (this.currentTab === 1) {
        this.selectedStarter = (this.selectedStarter + 1) % STARTERS.length;
        this.selectedAtkIdx = 0;
        this.calcKey = null;
        this.scrollOffset = 0;
        this.renderContent();
      } else if (this.currentTab === 2) {
        this.itemsSubTab = (this.itemsSubTab + 1) % 3;
        this.scrollOffset = 0;
        this.renderContent();
      }
    });

    // Mouse wheel scroll
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.doScroll(dy * 0.5);
    });
  }
}
