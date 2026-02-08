import Phaser from 'phaser';
import type { BossConfig, BossAttackConfig } from '../types';
import { Enemy } from './Enemy';

export class Boss extends Enemy {
  readonly bossAttack: BossAttackConfig;
  private lastBossAttackTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: BossConfig) {
    super(scene, x, y, config);
    this.bossAttack = config.bossAttack;
    this.name = config.name;
  }

  override shouldDespawn(): boolean {
    return false;
  }

  tryBossAttack(playerX: number, playerY: number, time: number): BossAttackConfig | null {
    if (!this.active) return null;
    if (time - this.lastBossAttackTime < this.bossAttack.cooldownMs) return null;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    // Ataques com range requerem distância mínima
    if (this.bossAttack.pattern === 'charge' && this.bossAttack.range && dist > this.bossAttack.range) {
      return null;
    }

    // AoE ataques: verificar se o player está perto o suficiente
    if ((this.bossAttack.pattern === 'aoe-tremor' || this.bossAttack.pattern === 'aoe-land') &&
        this.bossAttack.aoeRadius && dist > this.bossAttack.aoeRadius * 2) {
      return null;
    }

    this.lastBossAttackTime = time;
    return this.bossAttack;
  }
}
