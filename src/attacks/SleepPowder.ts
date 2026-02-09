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
 * Sleep Powder: cone de esporos soporíferos que aplica slow pesado.
 * Padrão cone (Scratch-like) mas sem dano significativo — foco em
 * crowd control com 80% slow por 2s.
 * Ivysaur (stage1).
 */
export class SleepPowder implements Attack {
  readonly type = 'sleepPowder' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private cooldown: number;
  private range = 80;
  private readonly arcAngleDeg = 120;
  private slowDuration = 2000;
  private readonly slowScale = 0.2; // 80% slow (velocity * 0.2)
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.cooldown = ATTACKS.sleepPowder.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.spore(),
    });
  }

  private spore(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite de esporo na direção
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const spore = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-cotton-spore'
    );
    spore.setScale(1.5).setDepth(10).setAlpha(0.8);
    spore.setRotation(dirAngleRad);
    spore.play('anim-cotton-spore');

    const followSpore = (): void => {
      if (spore.active) spore.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followSpore);
    spore.once('animationcomplete', () => {
      this.scene.events.off('update', followSpore);
      this.activeCone = null;
      spore.destroy();
    });

    // Registra cone ativo para update() aplicar slow continuamente
    this.activeCone = {
      sprite: spore,
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
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      hitEnemies.add(uid);

      // Aplica slow visual + mecânico
      enemy.setTint(0x66cc44);
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.velocity.scale(this.slowScale);

      setDamageSource(this.type);
      enemy.takeDamage(0);

      // Remove tint após duração
      this.scene.time.delayedCall(this.slowDuration, () => {
        if (enemy.active) enemy.clearTint();
      });
    }
  }

  upgrade(): void {
    this.level++;
    this.range += 10;
    this.slowDuration += 200;
    this.cooldown = Math.max(3000, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.spore(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeCone = null;
  }
}
