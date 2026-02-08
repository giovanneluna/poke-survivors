import type { BlazeConfig, TorrentConfig } from '../types';
import { BLAZE_TIERS, TORRENT_TIERS } from '../config';

export type PassiveType = 'blaze' | 'torrent' | 'none';

// ── Module singleton ──────────────────────────────────────────────
let instance: PassiveSystem | null = null;

/** Retrieve the active PassiveSystem (or null if not yet created). */
export function getPassive(): PassiveSystem | null {
  return instance;
}

/**
 * PassiveSystem — innate starter ability (Blaze / Torrent / Overgrow).
 *
 * Each starter has a unique passive that scales with evolution tier:
 * - **Blaze** (Charmander): chance to burn on hit, bonus dmg on burned, fire explosion on kill
 * - **Torrent** (Squirtle): chance to wet on hit, bonus dmg on wet, water splash on kill
 *
 * The system uses a module-level singleton so that Enemy.takeDamage() can
 * access passive config without circular imports or coupling to GameScene.
 */
export class PassiveSystem {
  readonly type: PassiveType;
  private tier: 1 | 2 | 3 = 1;

  constructor(starterKey: string) {
    this.type =
      starterKey === 'charmander' ? 'blaze'
      : starterKey === 'squirtle' ? 'torrent'
      : 'none';
    instance = this;
  }

  // ── Tier management ─────────────────────────────────────────────
  setTier(tier: 1 | 2 | 3): void { this.tier = tier; }
  getTier(): 1 | 2 | 3 { return this.tier; }

  // ── Config accessors ────────────────────────────────────────────
  getBlazeConfig(): BlazeConfig | null {
    return this.type === 'blaze' ? BLAZE_TIERS[this.tier] : null;
  }

  getTorrentConfig(): TorrentConfig | null {
    return this.type === 'torrent' ? TORRENT_TIERS[this.tier] : null;
  }

  /** Chance to apply status on each hit (burn or wet). */
  getStatusChance(): number {
    if (this.type === 'blaze') return BLAZE_TIERS[this.tier].burnChance;
    if (this.type === 'torrent') return TORRENT_TIERS[this.tier].wetChance;
    return 0;
  }

  /** Duration of the applied status in ms. */
  getStatusDuration(): number {
    if (this.type === 'blaze') return BLAZE_TIERS[this.tier].burnDuration;
    if (this.type === 'torrent') return TORRENT_TIERS[this.tier].wetDuration;
    return 0;
  }

  /** Burn damage per second (Blaze only). */
  getBurnDps(): number {
    return this.type === 'blaze' ? BLAZE_TIERS[this.tier].burnDps : 0;
  }

  /** Speed multiplier for wet enemies (e.g. 0.80 = 20% slower). Torrent only. */
  getWetSpeedMultiplier(): number {
    return this.type === 'torrent'
      ? 1 - TORRENT_TIERS[this.tier].slowMultiplier
      : 1;
  }

  /** Bonus damage multiplier against status-affected enemies (e.g. 0.25 = +25%). */
  getBonusDamage(): number {
    if (this.type === 'blaze') return BLAZE_TIERS[this.tier].bonusDmgOnBurned;
    if (this.type === 'torrent') return TORRENT_TIERS[this.tier].bonusDmgOnWet;
    return 0;
  }

  /** Torrent aura radius for projectile destruction (0 if not torrent). */
  getAuraRadius(): number {
    return this.type === 'torrent' ? TORRENT_TIERS[this.tier].auraRadius : 0;
  }

  /** Whether the tier 3 on-kill effect is active. */
  hasOnKillEffect(): boolean {
    if (this.type === 'blaze') return BLAZE_TIERS[this.tier].explodeOnKill;
    if (this.type === 'torrent') return TORRENT_TIERS[this.tier].splashOnKill;
    return false;
  }

  destroy(): void {
    if (instance === this) instance = null;
  }
}
