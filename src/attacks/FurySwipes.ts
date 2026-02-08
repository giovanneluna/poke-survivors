import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Fury Swipes: multi-slash 360° ultra rápido.
 * Evolução de Scratch + Razor Claw.
 * Múltiplos golpes em volta do player a cada ativação.
 */
export class FurySwipes implements Attack {
  readonly type = 'furySwipes' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 65;
  private swipeCount = 5;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.furySwipes.baseDamage;
    this.cooldown = ATTACKS.furySwipes.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    for (let i = 0; i < this.swipeCount; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        if (!this.player.active) return;

        const angle = (i / this.swipeCount) * Math.PI * 2 + Math.random() * 0.5;

        // Visual: arcos de garrada em várias direções
        const offsetX = Math.cos(angle) * 30;
        const offsetY = Math.sin(angle) * 30;
        const arc = this.scene.add.sprite(
          this.player.x + offsetX, this.player.y + offsetY, 'atk-fury-swipes'
        );
        arc.setScale(1.4).setDepth(10).setAlpha(0.9);
        arc.setRotation(angle);
        arc.play('anim-fury-swipes');
        arc.once('animationcomplete', () => arc.destroy());

        // Dano 360° (cada swipe cobre um setor)
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
              Phaser.Math.RadToDeg(angle),
              Phaser.Math.RadToDeg(angleToEnemy)
            )
          );
          if (angleDiff > 45) continue;

          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
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
    this.damage += 3;
    this.range += 4;
    if (this.level % 2 === 0) this.swipeCount++;
    this.cooldown = Math.max(250, this.cooldown - 30);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
