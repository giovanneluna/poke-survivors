import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';

/**
 * Liquidation: golpe aquatico 360° no cluster de inimigos mais denso.
 * Blastoise tier (minForm: stage2).
 * Dano massivo instantaneo + slow (reduz speed 30% por 2s).
 */
export class Liquidation implements Attack {
  readonly type = 'liquidation' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 90;
  private slowPercent = 30;
  private readonly slowDuration = 2000;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.liquidation.baseDamage;
    this.cooldown = ATTACKS.liquidation.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.strike(),
    });
  }

  /** Encontra o cluster de inimigos mais denso (media ponderada por proximidade) */
  private findDensestCluster(): { x: number; y: number } | null {
    const enemies = getSpatialGrid().getActiveEnemies();
    if (enemies.length === 0) return null;

    let bestScore = -1;
    let bestX = this.player.x;
    let bestY = this.player.y;

    // Avaliar cada inimigo como centro potencial do cluster
    for (const candidate of enemies) {
      let score = 0;
      for (const other of enemies) {
        const dist = Phaser.Math.Distance.Between(candidate.x, candidate.y, other.x, other.y);
        if (dist < this.radius) {
          score += 1 - (dist / this.radius);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestX = candidate.x;
        bestY = candidate.y;
      }
    }

    return { x: bestX, y: bestY };
  }

  private strike(): void {
    const target = this.findDensestCluster();
    if (!target) return;

    const { x: tx, y: ty } = target;

    // Visual: sprite de liquidation animado
    const liquidSprite = this.scene.add.sprite(tx, ty, 'atk-liquidation');
    liquidSprite.setScale(1).setDepth(11).setAlpha(0.9);
    liquidSprite.play('anim-liquidation');
    liquidSprite.once('animationcomplete', () => liquidSprite.destroy());

    // Shockwave ring expandindo
    const ring = this.scene.add.graphics();
    ring.setDepth(10);
    let ringRadius = 10;
    const ringTween = this.scene.tweens.addCounter({
      from: 10,
      to: this.radius * 1.3,
      duration: 500,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        ringRadius = tween.getValue() ?? 10;
        ring.clear();
        ring.lineStyle(3, 0x3388ff, Math.max(0, 1 - ringRadius / (this.radius * 1.3)));
        ring.strokeCircle(tx, ty, ringRadius);
      },
      onComplete: () => {
        ring.destroy();
        ringTween.destroy();
      },
    });

    // Particulas de impacto aquatico
    safeExplode(this.scene, tx, ty, 'water-particle', {
      speed: { min: 80, max: 200 },
      lifespan: 500,
      quantity: 20,
      scale: { start: 2.5, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0x3388ff, 0x44aaff, 0x2266dd],
    });

    // Dano instantaneo + slow em todos os inimigos no raio
    const enemies = getSpatialGrid().queryRadius(tx, ty, this.radius);

    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(tx, ty, enemy.x, enemy.y);

      if (typeof enemy.takeDamage === 'function') {
        // Dano com falloff suave pelo centro
        const falloff = 1 - (dist / this.radius) * 0.3;
        setDamageSource(this.type);
        const killed = enemy.takeDamage(Math.floor(this.damage * falloff));
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          continue;
        }
      }

      // Slow: reduz velocidade do body + tint azul
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const slowMultiplier = 1 - this.slowPercent / 100;
      body.velocity.x *= slowMultiplier;
      body.velocity.y *= slowMultiplier;
      enemy.setTint(0x3388ff);

      this.scene.time.delayedCall(this.slowDuration, () => {
        if (enemy.active) {
          enemy.clearTint();
          // Restaurar velocidade normal (o Enemy.update recalcula, entao apenas limpar o tint)
        }
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.radius += 10;
    this.slowPercent = Math.min(60, this.slowPercent + 5);
    this.cooldown = Math.max(5000, this.cooldown - 500);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.strike(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
