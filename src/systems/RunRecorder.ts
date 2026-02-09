/**
 * RunRecorder — rastreia todas as estatísticas de uma run.
 * Module singleton (mesmo padrão do SpatialHashGrid).
 *
 * Integração (feita pelo integrador):
 *  - GameScene.update: addTime(delta), recordDistance(dx, dy)
 *  - SpawnSystem (enemy death): recordKill(enemyKey, xpValue)
 *  - CollisionSystem / ataques: recordDamage(attackKey, amount)
 *  - PickupSystem (berry): recordBerry()
 *  - GameScene.gameOver: getRunStats() → passa pro death screen
 */

export interface RunStats {
  readonly timeAlive: number;
  readonly totalKills: number;
  readonly killsByType: Readonly<Record<string, number>>;
  readonly totalDamageDealt: number;
  readonly damageByAttack: Readonly<Record<string, number>>;
  readonly bossesDefeated: readonly string[];
  readonly berriesCollected: number;
  readonly levelReached: number;
  readonly finalForm: string;
  readonly attacksUsed: ReadonlyArray<{ readonly type: string; readonly level: number }>;
  readonly itemsCollected: readonly string[];
  readonly xpCollected: number;
  readonly distanceTraveled: number;
}

export class RunRecorder {
  private timeAliveMs = 0;
  private totalKills = 0;
  private readonly killsByType: Map<string, number> = new Map();
  private totalDamageDealt = 0;
  private readonly damageByAttack: Map<string, number> = new Map();
  private readonly bossesDefeated: string[] = [];
  private berriesCollected = 0;
  private levelReached = 1;
  private finalForm = 'base';
  private attacksUsed: Array<{ type: string; level: number }> = [];
  private itemsCollected: string[] = [];
  private xpCollected = 0;
  private distanceTraveled = 0;

  recordKill(enemyKey: string, xpValue: number): void {
    this.totalKills++;
    this.killsByType.set(enemyKey, (this.killsByType.get(enemyKey) ?? 0) + 1);
    this.xpCollected += xpValue;
  }

  recordDamage(attackKey: string, amount: number): void {
    this.totalDamageDealt += amount;
    this.damageByAttack.set(attackKey, (this.damageByAttack.get(attackKey) ?? 0) + amount);
  }

  recordBossKill(bossName: string): void {
    this.bossesDefeated.push(bossName);
  }

  recordBerry(): void {
    this.berriesCollected++;
  }

  recordDistance(dx: number, dy: number): void {
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
  }

  setLevel(level: number): void {
    this.levelReached = level;
  }

  setForm(form: string): void {
    this.finalForm = form;
  }

  setAttacks(attacks: ReadonlyArray<{ type: string; level: number }>): void {
    this.attacksUsed = attacks.map(a => ({ type: a.type, level: a.level }));
  }

  setItems(items: readonly string[]): void {
    this.itemsCollected = [...items];
  }

  addTime(deltaMs: number): void {
    this.timeAliveMs += deltaMs;
  }

  getRunStats(): RunStats {
    return {
      timeAlive: this.timeAliveMs / 1000,
      totalKills: this.totalKills,
      killsByType: Object.fromEntries(this.killsByType),
      totalDamageDealt: Math.round(this.totalDamageDealt),
      damageByAttack: Object.fromEntries(this.damageByAttack),
      bossesDefeated: [...this.bossesDefeated],
      berriesCollected: this.berriesCollected,
      levelReached: this.levelReached,
      finalForm: this.finalForm,
      attacksUsed: this.attacksUsed.map(a => ({ ...a })),
      itemsCollected: [...this.itemsCollected],
      xpCollected: this.xpCollected,
      distanceTraveled: Math.round(this.distanceTraveled),
    };
  }

  reset(): void {
    this.timeAliveMs = 0;
    this.totalKills = 0;
    this.killsByType.clear();
    this.totalDamageDealt = 0;
    this.damageByAttack.clear();
    this.bossesDefeated.length = 0;
    this.berriesCollected = 0;
    this.levelReached = 1;
    this.finalForm = 'base';
    this.attacksUsed = [];
    this.itemsCollected = [];
    this.xpCollected = 0;
    this.distanceTraveled = 0;
  }
}

// ── Singleton ──────────────────────────────────────────────────────────
let instance: RunRecorder | null = null;

export function initStatsTracker(): RunRecorder {
  instance = new RunRecorder();
  return instance;
}

export function getStatsTracker(): RunRecorder {
  return instance!;
}
