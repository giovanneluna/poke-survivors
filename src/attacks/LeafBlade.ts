import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

interface ActiveCone {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly hitEnemies: Set<number>;
  readonly dirAngleRad: number;
}

/**
 * Leaf Blade: lamina vegetal direcional com alta chance de critico.
 * Padrao cone (Scratch-like) — arco estreito, dano alto, 30% crit.
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
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.leafBlade.baseDamage;
    this.cooldown = ATTACKS.leafBlade.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.slash(),
    });
  }

  private slash(): void {
    const dir = this.player.getAttackDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite de lamina na direcao
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
      this.activeCone = null;
      blade.destroy();
    });

    // Dano contínuo via activeCone (update detecta inimigos a cada frame)
    this.activeCone = {
      sprite: blade,
      hitEnemies: new Set<number>(),
      dirAngleRad,
    };
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleRad } = this.activeCone;
    if (!sprite.active) { this.activeCone = null; return; }

    const px = this.player.x;
    const py = this.player.y;
    const enemies = getSpatialGrid().queryRadius(px, py, this.range);

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const angleToEnemy = Math.atan2(enemy.y - py, enemy.x - px);
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy),
        ),
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      hitEnemies.add(uid);

      // Crit check per-enemy
      const isCrit = Math.random() < this.critChance;
      const finalDmg = isCrit ? Math.floor(this.damage * 1.5) : this.damage;

      setDamageSource(this.type);
      const killed = enemy.takeDamage(finalDmg);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
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

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.range += 5;
    this.critChance = Math.min(0.6, this.critChance + 0.03);
    this.cooldown = Math.max(900, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.slash(),
    });
  }

  destroy(): void {
    this.activeCone = null;
    this.timer.destroy();
  }
}
