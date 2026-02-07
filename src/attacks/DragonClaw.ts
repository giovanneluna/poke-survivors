import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Dragon Claw: garras dracônicas com multi-hit.
 * 3 golpes rápidos em sequência na frente do player.
 * Charmeleon tier (minForm: stage1).
 */
export class DragonClaw implements Attack {
  readonly type = 'dragonClaw' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 65;
  private hitCount = 3;
  private readonly arcAngleDeg = 100;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.dragonClaw.baseDamage;
    this.cooldown = ATTACKS.dragonClaw.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.strike(),
    });
  }

  private strike(): void {
    const dir = this.player.getLastDirection();
    const baseAngleRad = Math.atan2(dir.y, dir.x);

    for (let hit = 0; hit < this.hitCount; hit++) {
      this.scene.time.delayedCall(hit * 80, () => {
        if (!this.player.active) return;

        // Cada hit com ângulo ligeiramente diferente
        const angleOffset = (hit - 1) * 0.3;
        const angleRad = baseAngleRad + angleOffset;

        // Visual: garra dracônica animada
        const offsetX = Math.cos(angleRad) * 30;
        const offsetY = Math.sin(angleRad) * 30;
        const claw = this.scene.add.sprite(
          this.player.x + offsetX, this.player.y + offsetY, 'atk-dragon-claw'
        );
        claw.setScale(1).setDepth(10).setAlpha(0.9);
        claw.setRotation(angleRad);
        claw.play('anim-dragon-claw');
        claw.once('animationcomplete', () => claw.destroy());

        // Dano em arco
        const enemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        for (const enemySprite of enemies) {
          const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, enemySprite.x, enemySprite.y
          );
          if (dist > this.range) continue;

          const angleToEnemy = Math.atan2(
            enemySprite.y - this.player.y, enemySprite.x - this.player.x
          );
          const angleDiff = Math.abs(
            Phaser.Math.Angle.ShortestBetween(
              Phaser.Math.RadToDeg(baseAngleRad),
              Phaser.Math.RadToDeg(angleToEnemy)
            )
          );
          if (angleDiff > this.arcAngleDeg / 2) continue;

          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
            }
          }
        }
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.range += 5;
    if (this.level % 3 === 0) this.hitCount++;
    this.cooldown = Math.max(600, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.strike(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
