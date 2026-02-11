import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Blaze Kick: chute flamejante com AoE de fogo.
 * Evolução de Fire Fang + Charcoal.
 * Atinge inimigo mais próximo + AoE de explosão em volta.
 */
export class BlazeKick implements Attack {
  readonly type = 'blazeKick' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 80;
  private splashRadius = 45;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.blazeKick.baseDamage;
    this.cooldown = ATTACKS.blazeKick.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.kick(),
    });
  }

  private kick(): void {
    const closest = getSpatialGrid().queryNearest(this.player.x, this.player.y, this.range);
    if (!closest) return;

    const tx = closest.x;
    const ty = closest.y;

    // Visual: blaze kick animado
    const kick = this.scene.add.sprite(tx, ty, 'atk-blaze-kick');
    kick.setScale(1.2).setDepth(10).setAlpha(0.9);
    kick.play('anim-blaze-kick');
    kick.once('animationcomplete', () => kick.destroy());

    // Explosão AoE
    safeExplode(this.scene, tx, ty, 'fire-particle', {
      speed: { min: 40, max: 100 }, lifespan: 300, quantity: 12,
      scale: { start: 2, end: 0 }, tint: [0xff4400, 0xff6600, 0xffaa00],
      angle: { min: 0, max: 360 },
    });

    // Anel visual
    if (shouldShowVfx()) {
      const ring = this.scene.add.circle(tx, ty, this.splashRadius, 0xff6600, 0.25);
      ring.setDepth(8);
      this.scene.tweens.add({
        targets: ring, alpha: 0, scale: 1.5, duration: 300,
        onComplete: () => ring.destroy(),
      });
    }

    // Dano: alvo principal + splash
    const splashEnemies = getSpatialGrid().queryRadius(tx, ty, this.splashRadius);
    for (const enemy of splashEnemies) {
      if (typeof enemy.takeDamage === 'function') {
        // Alvo direto recebe dano cheio, splash recebe 60%
        const dmg = enemy === closest ? this.damage : Math.floor(this.damage * 0.6);
        setDamageSource(this.type);
        const killed = enemy.takeDamage(dmg);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.range += 8;
    this.splashRadius += 5;
    this.cooldown = Math.max(900, this.cooldown - 50);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.kick(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
