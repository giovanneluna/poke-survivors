import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Leaf Blade: lâmina vegetal direcional com alta chance de crítico.
 * Padrão cone (Scratch-like) — arco estreito, dano alto, 30% crit.
 * Crit aplica 1.5x dano + flash amarelo visual.
 * Ivysaur (stage1).
 */
export class LeafBlade implements Attack {
  readonly type = 'leafBlade' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 60;
  private readonly arcAngleDeg = 70;
  private critChance = 0.3;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.leafBlade.baseDamage;
    this.cooldown = ATTACKS.leafBlade.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slash(),
    });
  }

  private slash(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite de lâmina na direção
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const blade = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-leaf-blade'
    );
    blade.setScale(1.2).setDepth(10).setAlpha(0.9);
    blade.setRotation(dirAngleRad);
    blade.play('anim-leaf-blade');

    const followBlade = (): void => {
      if (blade.active) blade.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followBlade);
    blade.once('animationcomplete', () => {
      this.scene.events.off('update', followBlade);
      blade.destroy();
    });

    // Dano em arco estreito
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

      // Crit check
      const isCrit = Math.random() < this.critChance;
      const finalDmg = isCrit ? Math.floor(this.damage * 1.5) : this.damage;

      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(finalDmg);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }

      // Visual flash on crit
      if (isCrit && enemy.active) {
        enemy.setTint(0xffff00);
        this.scene.time.delayedCall(100, () => {
          if (enemy.active) enemy.clearTint();
        });
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.range += 5;
    this.critChance = Math.min(0.6, this.critChance + 0.03);
    this.cooldown = Math.max(800, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
