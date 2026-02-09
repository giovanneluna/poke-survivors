import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Slash: garrada ampla com alta chance de crítico.
 * Arco de dano maior que Scratch, com 20% crit base.
 * Charmeleon tier (minForm: stage1).
 */
export class Slash implements Attack {
  readonly type = 'slash' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 70;
  private critChance = 0.2;
  private critMultiplier = 1.8;
  private readonly arcAngleDeg = 120;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.slash.baseDamage;
    this.cooldown = ATTACKS.slash.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? Math.floor(this.damage * this.critMultiplier) : this.damage;

    // Visual: arco maior, dourado se crit
    const offsetX = Math.cos(dirAngleRad) * 35;
    const offsetY = Math.sin(dirAngleRad) * 35;
    const arc = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-slash'
    );
    const color = isCrit ? 0xffdd44 : 0xffffff;
    arc.setScale(isCrit ? 2 : 1.6).setDepth(10).setAlpha(0.9).setTint(color);
    arc.setRotation(dirAngleRad);
    arc.play('anim-slash');
    const followArc = (): void => {
      if (arc.active) arc.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followArc);
    arc.once('animationcomplete', () => {
      this.scene.events.off('update', followArc);
      arc.destroy();
    });

    // Texto de crit
    if (isCrit) {
      const critText = this.scene.add.text(this.player.x, this.player.y - 25, 'CRIT!', {
        fontSize: '12px', color: '#ffdd44', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: critText, y: critText.y - 20, alpha: 0, duration: 600,
        onComplete: () => critText.destroy(),
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
        const killed = enemy.takeDamage(finalDamage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.range += 5;
    this.critChance = Math.min(0.5, this.critChance + 0.04);
    this.cooldown = Math.max(400, this.cooldown - 50);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
