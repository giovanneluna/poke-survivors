// ── Save System — localStorage persistence for meta-progression ─────────
// Module singleton pattern: module-level state + exported functions.

const STORAGE_KEY = 'poke-survivors-save';
const CURRENT_VERSION = 2;
const POKEDEX_TOTAL = 47;

// ── Types ────────────────────────────────────────────────────────────────

export interface PokedexEntry {
  readonly name: string;
  readonly type: string;
  timesDefeated: number;
  readonly firstSeen: number; // timestamp
}

export interface LifetimeStats {
  totalRuns: number;
  totalDeaths: number;
  totalKills: number;
  bossesKilled: number;
  totalDamageDealt: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalTimePlayed: number;       // seconds
  distanceTraveled: number;      // pixels
  berriesCollected: number;
  xpCollected: number;
  bestCombo: number;
  starterRuns: Record<string, number>;
  favoriteAttack: { name: string; damage: number };
  highestEvolution: string;
}

export interface LastRunData {
  readonly starterKey: string;
  readonly formName: string;
  readonly level: number;
  readonly kills: number;
  readonly time: number; // seconds
  readonly coinsEarned: number;
  readonly difficulty: string;
  readonly date: number; // timestamp
}

export interface SaveData {
  version: number;
  coins: number;
  powerUps: Record<string, number>;
  pokedex: Record<string, PokedexEntry>;
  records: {
    bestTime: number;
    bestKills: number;
    bestLevel: number;
  };
  lastRun?: LastRunData;
  stats: LifetimeStats;
  settings: {
    muted: boolean;
    quality: 'normal' | 'low';
    vfxIntensity: number; // 0–100
  };
  unlockedStarters: Record<string, boolean>;
}

// ── Module state ─────────────────────────────────────────────────────────

let data: SaveData | null = null;

// ── Internal helpers ─────────────────────────────────────────────────────

function createFreshStats(): LifetimeStats {
  return {
    totalRuns: 0,
    totalDeaths: 0,
    totalKills: 0,
    bossesKilled: 0,
    totalDamageDealt: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    totalTimePlayed: 0,
    distanceTraveled: 0,
    berriesCollected: 0,
    xpCollected: 0,
    bestCombo: 0,
    starterRuns: {},
    favoriteAttack: { name: '', damage: 0 },
    highestEvolution: '',
  };
}

/** Default unlocked starters for NEW saves — only Charmander. */
const DEFAULT_UNLOCKED_STARTERS: Record<string, boolean> = { charmander: true };

/** Legacy unlocked starters for v1 saves — preserve existing access. */
const LEGACY_UNLOCKED_STARTERS: Record<string, boolean> = {
  charmander: true,
  squirtle: true,
  bulbasaur: true,
};

function createFreshSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    coins: 0,
    powerUps: {},
    pokedex: {},
    records: {
      bestTime: 0,
      bestKills: 0,
      bestLevel: 0,
    },
    stats: createFreshStats(),
    settings: {
      muted: false,
      quality: 'normal',
      vfxIntensity: 100,
    },
    unlockedStarters: { ...DEFAULT_UNLOCKED_STARTERS },
  };
}

function persist(): void {
  if (!data) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

function ensureLoaded(): SaveData {
  if (!data) {
    initSaveSystem();
  }
  return data!;
}

// ── Public API ───────────────────────────────────────────────────────────

/** Load save from localStorage or create fresh. Safe to call multiple times. */
export function initSaveSystem(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'version' in parsed &&
        typeof (parsed as Record<string, unknown>).version === 'number'
      ) {
        // Valid shape — use it (future: migrate if version < CURRENT_VERSION)
        data = parsed as SaveData;
        // Patch missing fields for forward-compat
        data.coins ??= 0;
        data.powerUps ??= {};
        data.pokedex ??= {};
        data.records ??= { bestTime: 0, bestKills: 0, bestLevel: 0 };
        data.stats ??= createFreshStats();
        data.settings ??= { muted: false, quality: 'normal', vfxIntensity: 100 };
        data.settings.quality ??= 'normal';
        data.settings.vfxIntensity ??= 100;

        // v1 → v2 migration: add unlockedStarters (preserve existing access)
        if (!data.unlockedStarters) {
          data.unlockedStarters = data.version < 2
            ? { ...LEGACY_UNLOCKED_STARTERS }
            : { ...DEFAULT_UNLOCKED_STARTERS };
        }
        data.version = CURRENT_VERSION;
        return;
      }
    }
  } catch {
    // Corrupted JSON — fall through to fresh save
  }
  data = createFreshSave();
  persist();
}

/** Return a readonly deep copy of current save data. */
export function getSaveData(): Readonly<SaveData> {
  const d = ensureLoaded();
  return JSON.parse(JSON.stringify(d)) as SaveData;
}

// ── Starter Unlocks ──────────────────────────────────────────────────────

/** Check if a starter is unlocked in the save data. */
export function isStarterUnlocked(key: string): boolean {
  return ensureLoaded().unlockedStarters[key] === true;
}

/** Unlock a starter permanently. Returns true if it was newly unlocked. */
export function unlockStarter(key: string): boolean {
  const d = ensureLoaded();
  if (d.unlockedStarters[key]) return false;
  d.unlockedStarters[key] = true;
  persist();
  return true;
}

/** Check if Phase 2 is unlocked (= Squirtle is unlocked = Phase 1 completed). */
export function isPhase2Unlocked(): boolean {
  return isStarterUnlocked('squirtle');
}

// ── Coins ────────────────────────────────────────────────────────────────

export function addCoins(amount: number): void {
  const d = ensureLoaded();
  d.coins = Math.max(0, d.coins + amount);
  persist();
}

export function getCoins(): number {
  return ensureLoaded().coins;
}

// ── Pokedex ──────────────────────────────────────────────────────────────

export function unlockPokedexEntry(key: string, name: string, type: string): void {
  const d = ensureLoaded();
  const existing = d.pokedex[key];
  if (existing) {
    existing.timesDefeated++;
  } else {
    d.pokedex[key] = {
      name,
      type,
      timesDefeated: 1,
      firstSeen: Date.now(),
    };
  }
  persist();
}

export function isPokedexUnlocked(key: string): boolean {
  return key in ensureLoaded().pokedex;
}

export function getPokedexCount(): number {
  return Object.keys(ensureLoaded().pokedex).length;
}

export function getPokedexTotal(): number {
  return POKEDEX_TOTAL;
}

// ── Records ──────────────────────────────────────────────────────────────

/** Update a record field if the new value beats the old. Returns true if new record. */
export function updateRecord(
  field: 'bestTime' | 'bestKills' | 'bestLevel',
  value: number,
): boolean {
  const d = ensureLoaded();
  if (value > d.records[field]) {
    d.records[field] = value;
    persist();
    return true;
  }
  return false;
}

// ── Last Run ────────────────────────────────────────────────────────

export function saveLastRun(run: LastRunData): void {
  const d = ensureLoaded();
  d.lastRun = run;
  persist();
}

export function getLastRun(): LastRunData | undefined {
  return ensureLoaded().lastRun;
}

// ── Power-ups ────────────────────────────────────────────────────────────

export function getPowerUpLevel(id: string): number {
  return ensureLoaded().powerUps[id] ?? 0;
}

/** Attempt to buy a power-up. Deducts coins and increments level. Returns true on success. */
export function buyPowerUp(id: string, cost: number): boolean {
  const d = ensureLoaded();
  if (d.coins < cost) return false;
  d.coins -= cost;
  d.powerUps[id] = (d.powerUps[id] ?? 0) + 1;
  d.stats.totalCoinsSpent += cost;
  persist();
  return true;
}

// ── Settings ─────────────────────────────────────────────────────────────

export function getMuted(): boolean {
  return ensureLoaded().settings.muted;
}

export function setMuted(muted: boolean): void {
  const d = ensureLoaded();
  d.settings.muted = muted;
  persist();
}

export function getQuality(): 'normal' | 'low' {
  return ensureLoaded().settings.quality;
}

export function setQuality(quality: 'normal' | 'low'): void {
  const d = ensureLoaded();
  d.settings.quality = quality;
  persist();
}

export function getVfxIntensity(): number {
  return ensureLoaded().settings.vfxIntensity;
}

export function setVfxIntensity(value: number): void {
  const d = ensureLoaded();
  d.settings.vfxIntensity = Math.max(0, Math.min(100, Math.round(value)));
  persist();
}

// ── Lifetime Stats ──────────────────────────────────────────────────────

export interface RunEndData {
  readonly kills: number;
  readonly bossesDefeated: number;
  readonly damageDealt: number;
  readonly coinsEarned: number;
  readonly timePlayed: number;
  readonly distance: number;
  readonly berries: number;
  readonly xp: number;
  readonly combo: number;
  readonly starterKey: string;
  readonly formName: string;
  readonly damageByAttack: Readonly<Record<string, number>>;
}

/** Accumulate a finished run's stats into lifetime counters. Call once at game over. */
export function accumulateRunStats(run: RunEndData): void {
  const d = ensureLoaded();
  const s = d.stats;

  s.totalRuns++;
  s.totalDeaths++;
  s.totalKills += run.kills;
  s.bossesKilled += run.bossesDefeated;
  s.totalDamageDealt += run.damageDealt;
  s.totalCoinsEarned += run.coinsEarned;
  s.totalTimePlayed += run.timePlayed;
  s.distanceTraveled += run.distance;
  s.berriesCollected += run.berries;
  s.xpCollected += run.xp;

  if (run.combo > s.bestCombo) s.bestCombo = run.combo;

  // Starter usage
  s.starterRuns[run.starterKey] = (s.starterRuns[run.starterKey] ?? 0) + 1;

  // Highest evolution
  const FORM_RANK: Record<string, number> = { base: 0, stage1: 1, stage2: 2 };
  const currentRank = FORM_RANK[s.highestEvolution] ?? -1;
  const runFormKey = run.formName; // "Charizard", "Blastoise", etc
  // Use formName if it's a higher-tier form
  if (run.formName && run.formName !== s.highestEvolution) {
    // Simple heuristic: stage2 names are always longer forms
    if (currentRank < 2) s.highestEvolution = runFormKey;
  }

  // Favorite attack (most total damage across all runs)
  for (const [atkName, dmg] of Object.entries(run.damageByAttack)) {
    // We track the single best attack by accumulated damage
    // For simplicity, just check this run's top attacker vs stored
    if (dmg > s.favoriteAttack.damage) {
      s.favoriteAttack = { name: atkName, damage: Math.round(dmg) };
    }
  }

  persist();
}

export function getLifetimeStats(): Readonly<LifetimeStats> {
  return { ...ensureLoaded().stats };
}

// ── Export / Import ──────────────────────────────────────────────────────

/** Export save data as a base64-encoded string. */
export function exportSaveCode(): string {
  const d = ensureLoaded();
  const json = JSON.stringify(d);
  return btoa(unescape(encodeURIComponent(json)));
}

/** Download save data as a .txt file. */
export function downloadSaveFile(): void {
  const code = exportSaveCode();
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poke-survivors-save-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import save data from a base64-encoded string. Returns true on success. */
export function importSaveCode(code: string): boolean {
  try {
    const trimmed = code.trim();
    const json = decodeURIComponent(escape(atob(trimmed)));
    const parsed: unknown = JSON.parse(json);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('version' in parsed) ||
      typeof (parsed as Record<string, unknown>).version !== 'number'
    ) {
      return false;
    }
    data = parsed as SaveData;
    // Patch missing fields
    data.coins ??= 0;
    data.powerUps ??= {};
    data.pokedex ??= {};
    data.records ??= { bestTime: 0, bestKills: 0, bestLevel: 0 };
    data.stats ??= createFreshStats();
    data.settings ??= { muted: false, quality: 'normal', vfxIntensity: 100 };
    data.settings.quality ??= 'normal';
    data.settings.vfxIntensity ??= 100;
    if (!data.unlockedStarters) {
      data.unlockedStarters = data.version < 2
        ? { ...LEGACY_UNLOCKED_STARTERS }
        : { ...DEFAULT_UNLOCKED_STARTERS };
    }
    data.version = CURRENT_VERSION;
    persist();
    return true;
  } catch {
    return false;
  }
}

/** Trigger a file picker and import the selected .txt file. Returns a Promise<boolean>. */
export function importSaveFile(): Promise<boolean> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) { resolve(false); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        resolve(importSaveCode(content));
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
      document.body.removeChild(input);
    });
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(false);
    });
    document.body.appendChild(input);
    input.click();
  });
}

// ── Reset ────────────────────────────────────────────────────────────────

export function resetSave(): void {
  data = createFreshSave();
  persist();
}
