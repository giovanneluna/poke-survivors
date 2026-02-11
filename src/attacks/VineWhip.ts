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
 * Vine Whip: chicotada de vinha na direcao do movimento.
 * Padrao cone (Scratch-like) — dano continuo em arco frontal (segue o jogador).
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
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.vineWhip.baseDamage;
    this.cooldown = ATTACKS.vineWhip.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite de vinha na direcao
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

    // Ativar hit detection continua
    this.activeCone = {
      sprite: vine,
      hitEnemies: new Set(),
      dirAngleRad,
    };

    vine.once('animationcomplete', () => {
      this.scene.events.off('update', followVine);
      this.activeCone = null;
      vine.destroy();
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
    this.range += 8;
    this.cooldown = Math.max(600, this.cooldown - 60);
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
