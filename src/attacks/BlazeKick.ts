import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

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
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 80;
  private splashRadius = 45;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.blazeKick.baseDamage;
    this.cooldown = ATTACKS.blazeKick.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.kick(),
    });
  }

  private kick(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Encontra mais próximo
    let closest: Phaser.Physics.Arcade.Sprite | null = null;
    let closestDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < closestDist && dist <= this.range) {
        closest = enemy;
        closestDist = dist;
      }
    }
    if (!closest) return;

    const tx = closest.x;
    const ty = closest.y;

    // Visual: blaze kick animado
    const kick = this.scene.add.sprite(tx, ty, 'atk-blaze-kick');
    kick.setScale(1.2).setDepth(10).setAlpha(0.9);
    kick.play('anim-blaze-kick');
    kick.once('animationcomplete', () => kick.destroy());

    // Explosão AoE
    this.scene.add.particles(tx, ty, 'fire-particle', {
      speed: { min: 40, max: 100 }, lifespan: 300, quantity: 12,
      scale: { start: 2, end: 0 }, tint: [0xff4400, 0xff6600, 0xffaa00],
      angle: { min: 0, max: 360 },
      emitting: false,
    }).explode();

    // Anel visual
    const ring = this.scene.add.circle(tx, ty, this.splashRadius, 0xff6600, 0.25);
    ring.setDepth(8);
    this.scene.tweens.add({
      targets: ring, alpha: 0, scale: 1.5, duration: 300,
      onComplete: () => ring.destroy(),
    });

    // Dano: alvo principal + splash
    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(tx, ty, enemySprite.x, enemySprite.y);
      if (dist > this.splashRadius) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        // Alvo direto recebe dano cheio, splash recebe 60%
        const dmg = enemySprite === closest ? this.damage : Math.floor(this.damage * 0.6);
        setDamageSource(this.type);
        const killed = enemy.takeDamage(dmg);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
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
    this.cooldown = Math.max(400, this.cooldown - 50);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.kick(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
