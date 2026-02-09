/**
 * Sistema de combo de kills com tiers visuais.
 * Module singleton — UIScene lê estado via getComboSystem().
 */

export interface ComboTier {
  readonly threshold: number;
  readonly color: number;
  readonly fontSize: number;
  readonly shake: boolean;
  readonly label?: string;
}

const COMBO_TIERS: readonly ComboTier[] = [
  { threshold: 10, color: 0xffffff, fontSize: 16, shake: false },
  { threshold: 25, color: 0xffcc00, fontSize: 20, shake: true },
  { threshold: 50, color: 0xffd700, fontSize: 24, shake: true },
  { threshold: 100, color: 0xff4444, fontSize: 28, shake: true, label: 'POKÉMASTER!' },
] as const;

const COMBO_TIMEOUT_MS = 2000;

export class ComboSystem {
  private currentCombo = 0;
  private bestCombo = 0;
  private timeSinceLastKill = 0;
  private active = false;

  recordKill(): void {
    this.currentCombo++;
    this.timeSinceLastKill = 0;
    this.active = true;

    if (this.currentCombo > this.bestCombo) {
      this.bestCombo = this.currentCombo;
    }
  }

  update(deltaMs: number): void {
    if (!this.active) return;

    this.timeSinceLastKill += deltaMs;
    if (this.timeSinceLastKill >= COMBO_TIMEOUT_MS) {
      this.currentCombo = 0;
      this.active = false;
    }
  }

  getCurrentCombo(): number {
    return this.currentCombo;
  }

  getBestCombo(): number {
    return this.bestCombo;
  }

  isActive(): boolean {
    return this.active;
  }

  getCurrentTier(): ComboTier | null {
    if (this.currentCombo < COMBO_TIERS[0].threshold) return null;

    let matched: ComboTier | null = null;
    for (const tier of COMBO_TIERS) {
      if (this.currentCombo >= tier.threshold) {
        matched = tier;
      } else {
        break;
      }
    }
    return matched;
  }

  reset(): void {
    this.currentCombo = 0;
    this.bestCombo = 0;
    this.timeSinceLastKill = 0;
    this.active = false;
  }
}

// ── Singleton ──────────────────────────────────────────────────────────
let instance: ComboSystem | null = null;

export function initComboSystem(): ComboSystem {
  instance = new ComboSystem();
  return instance;
}

export function getComboSystem(): ComboSystem {
  return instance!;
}
