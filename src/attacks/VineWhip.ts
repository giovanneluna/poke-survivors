import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Vine Whip: chicotada de vinha na direção do movimento.
 * Padrão cone (Scratch-like) — dano instantâneo em arco frontal.
 * Bulbasaur base.
 */
export class VineWhip implements Attack {
  readonly type = 'vineWhip' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 65;
  private readonly arcAngleDeg = 90;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.vineWhip.baseDamage;
    this.cooldown = ATTACKS.vineWhip.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite de vinha na direção
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const vine = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-vine-whip'
    );
    vine.setScale(1.5).setDepth(10).setAlpha(0.9);
    vine.setRotation(dirAngleRad);
    vine.play('anim-vine-whip');

    const followVine = (): void => {
      if (vine.active) vine.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followVine);
    vine.once('animationcomplete', () => {
      this.scene.events.off('update', followVine);
      vine.destroy();
    });

    // Dano em arco
    const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.range);

    for (const enemy of enemies) {
      const angleToEnemy = Math.atan2(
        enemy.y - this.player.y, enemy.x - this.player.x
      );
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.range += 8;
    this.cooldown = Math.max(400, this.cooldown - 60);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
