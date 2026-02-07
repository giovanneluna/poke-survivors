import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Blast Burn: evolução do Flamethrower.
 * Explosão nuclear massiva na direção do movimento.
 * Raio enorme, dano devastador, visual espetacular.
 */
export class BlastBurn implements Attack {
  readonly type = 'blastBurn' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private range = 180;
  private cooldown: number;
  private readonly coneAngleDeg = 70;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.blastBurn.baseDamage;
    this.cooldown = ATTACKS.blastBurn.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const dirAngleDeg = Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x));
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Efeito visual: explosão nuclear massiva
    this.scene.add.particles(this.player.x, this.player.y, 'fire-particle', {
      speed: { min: 200, max: 400 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 500,
      quantity: 40,
      scale: { start: 4, end: 0.5 },
      tint: [0xff0000, 0xff2200, 0xff6600, 0xffaa00, 0xffff00],
      emitting: false,
    }).explode();

    // Onda de choque visual
    const shockwave = this.scene.add.circle(
      this.player.x + Math.cos(dirAngleRad) * 50,
      this.player.y + Math.sin(dirAngleRad) * 50,
      10, 0xff4400, 0.5
    ).setDepth(7);

    this.scene.tweens.add({
      targets: shockwave,
      radius: this.range,
      alpha: 0,
      duration: 400,
      onUpdate: () => shockwave.setRadius(shockwave.radius),
      onComplete: () => shockwave.destroy(),
    });

    // Shake da câmera
    this.scene.cameras.main.shake(200, 0.005);

    // Dano em cone expandido
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemySprite.x, enemySprite.y);
      if (dist > this.range) continue;

      const angleToEnemy = Math.atan2(enemySprite.y - this.player.y, enemySprite.x - this.player.x);
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );

      if (angleDiff <= this.coneAngleDeg / 2) {
        const enemy = enemySprite as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          enemy.takeDamage(this.damage);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 15;
    this.range += 25;
    this.cooldown = Math.max(2000, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
