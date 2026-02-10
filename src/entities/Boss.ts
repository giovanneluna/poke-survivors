import Phaser from 'phaser';
import type { BossConfig, BossAttackConfig, BossArchetype, AttackCategory } from '../types';
import { Enemy } from './Enemy';

export class Boss extends Enemy {
  readonly bossAttacks: readonly BossAttackConfig[];
  readonly resistance: number;
  readonly hpRegenPerSec: number;
  readonly archetype: BossArchetype;
  private readonly _categoryResistance?: Partial<Record<AttackCategory, number>>;

  /** Cooldown tracking per attack (index → last fire timestamp) */
  private readonly attackCooldowns: number[];

  constructor(scene: Phaser.Scene, x: number, y: number, config: BossConfig) {
    super(scene, x, y, config);
    this.bossAttacks = config.bossAttacks;
    this.resistance = config.resistance;
    this.hpRegenPerSec = config.hpRegenPerSec;
    this.archetype = config.archetype;
    this._categoryResistance = config.categoryResistance;
    this.name = config.name;
    this.attackCooldowns = new Array(config.bossAttacks.length).fill(0);
  }

  override shouldDespawn(): boolean {
    return false;
  }

  // ── HP Regeneration ──────────────────────────────────────────────
  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.hpRegenPerSec > 0) {
      this.heal(this.hpRegenPerSec * (delta / 1000));
    }
  }

  // ── Resistance applied via Enemy.takeDamage override ────────────
  override getResistance(): number {
    return this.resistance;
  }

  override getCategoryResistance(): Partial<Record<string, number>> | undefined {
    return this._categoryResistance;
  }

  // ── Multi-attack selection ──────────────────────────────────────
  /**
   * Retorna o ataque off-cooldown com maior prioridade (índice mais baixo).
   * Verifica range se aplicável.
   */
  tryBossAttack(playerX: number, playerY: number, time: number): BossAttackConfig | null {
    if (!this.active) return null;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    for (let i = 0; i < this.bossAttacks.length; i++) {
      const atk = this.bossAttacks[i];
      if (time - this.attackCooldowns[i] < atk.cooldownMs) continue;

      // Range checks per pattern
      if (atk.pattern === 'charge' && atk.range && dist > atk.range) continue;
      if ((atk.pattern === 'aoe-tremor' || atk.pattern === 'aoe-land') &&
          atk.aoeRadius && dist > atk.aoeRadius * 2) continue;
      if (atk.pattern === 'beam' && atk.range && dist > atk.range) continue;
      if (atk.pattern === 'zone' && atk.aoeRadius && dist > atk.aoeRadius * 3) continue;

      this.attackCooldowns[i] = time;
      return atk;
    }
    return null;
  }
}
