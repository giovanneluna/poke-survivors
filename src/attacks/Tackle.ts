import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Tackle: investida rapida na direcao do movimento.
 * Equivalente ao Scratch para a linha do Squirtle.
 * Dano instantaneo em arco com knockback.
 */
export class Tackle implements Attack {
  readonly type = 'tackle' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 50;
  private readonly arcAngleDeg = 100;
  private knockback = 30;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.tackle.baseDamage;
    this.cooldown = ATTACKS.tackle.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.strike(),
    });
  }

  private strike(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: flash branco circular no ponto de impacto
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const px = this.player.x + offsetX;
    const py = this.player.y + offsetY;

    if (shouldShowVfx()) {
      const flash = this.scene.add.circle(px, py, 20, 0xffffff, 0.7);
      flash.setDepth(10);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 200,
        ease: 'Sine.Out',
        onComplete: () => flash.destroy(),
      });
    }

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

      // Knockback: empurra inimigo para longe do player
      const kb = this.knockback;
      const pushAngle = Math.atan2(
        enemy.y - this.player.y,
        enemy.x - this.player.x
      );
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.x += Math.cos(pushAngle) * kb * 10;
        enemyBody.velocity.y += Math.sin(pushAngle) * kb * 10;
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.range += 5;
    this.knockback += 5;
    this.cooldown = Math.max(600, this.cooldown - 40);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.strike(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
