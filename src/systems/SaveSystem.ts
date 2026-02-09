// ── Save System — localStorage persistence for meta-progression ─────────
// Module singleton pattern: module-level state + exported functions.

const STORAGE_KEY = 'poke-survivors-save';
const CURRENT_VERSION = 1;
const POKEDEX_TOTAL = 47;

// ── Types ────────────────────────────────────────────────────────────────

export interface PokedexEntry {
  readonly name: string;
  readonly type: string;
  timesDefeated: number;
  readonly firstSeen: number; // timestamp
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
  settings: {
    muted: boolean;
  };
}

// ── Module state ─────────────────────────────────────────────────────────

let data: SaveData | null = null;

// ── Internal helpers ─────────────────────────────────────────────────────

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
    settings: {
      muted: false,
    },
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
        data.settings ??= { muted: false };
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

// ── Reset ────────────────────────────────────────────────────────────────

export function resetSave(): void {
  data = createFreshSave();
  persist();
}
