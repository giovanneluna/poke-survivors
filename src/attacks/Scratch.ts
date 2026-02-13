import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

interface ActiveCone {
  sprite: Phaser.GameObjects.Sprite;
  hitEnemies: Set<number>;
  dirAngleRad: number;
}

/**
 * Scratch: garrada rapida na direcao do movimento.
 * Equivalente ao "Knife" do Vampire Survivors.
 * Dano continuo em arco na frente do player (segue o jogador).
 */
export class Scratch implements Attack {
  readonly type = 'scratch' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 55;
  private readonly arcAngleDeg = 90;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.scratch.baseDamage;
    this.cooldown = ATTACKS.scratch.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    const dir = this.player.getAttackDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: arco branco na direcao
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const arc = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-scratch'
    );
    arc.setScale(1.3).setDepth(10).setAlpha(0.9);
    arc.setRotation(dirAngleRad);
    arc.play('anim-scratch');
    const followArc = (): void => {
      if (arc.active) arc.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followArc);

    // Ativar hit detection continua
    this.activeCone = {
      sprite: arc,
      hitEnemies: new Set(),
      dirAngleRad,
    };

    arc.once('animationcomplete', () => {
      this.scene.events.off('update', followArc);
      this.activeCone = null;
      arc.destroy();
    });
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
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      hitEnemies.add(uid);
      setDamageSource(this.type);
      const killed = enemy.takeDamage(this.damage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.range += 5;
    this.cooldown = Math.max(600, this.cooldown - 40);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.swipe(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeCone = null;
  }
}
