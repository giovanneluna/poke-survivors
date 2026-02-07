import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Flamethrower: explosão de fogo na direção do movimento.
 * Equivalente ao "Fire Wand" do Vampire Survivors.
 * Causa dano em área (cone) na direção que o jogador se move.
 */
export class Flamethrower implements Attack {
  readonly type = 'flamethrower' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private range = 100;
  private cooldown: number;
  private readonly coneAngleDeg = 50;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemyGroup: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.flamethrower.baseDamage;
    this.cooldown = ATTACKS.flamethrower.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const dirAngleDeg = Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x));

    // Efeito visual: partículas de fogo na direção
    const dirAngleRad = Math.atan2(dir.y, dir.x);
    this.scene.add.particles(this.player.x, this.player.y, 'fire-particle', {
      speed: { min: 150, max: 250 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 350,
      quantity: 20,
      scale: { start: 3, end: 0.5 },
      tint: [0xff2200, 0xff6600, 0xffaa00, 0xffcc00],
      emitting: false,
    }).explode();

    // Dano em cone
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemySprite.x, enemySprite.y
      );

      if (dist > this.range) continue;

      const angleToEnemy = Math.atan2(
        enemySprite.y - this.player.y,
        enemySprite.x - this.player.x
      );

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

  update(_time: number, _delta: number): void {
    // Timer-based, sem update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.range += 20;
    this.cooldown = Math.max(1500, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
