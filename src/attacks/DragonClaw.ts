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
 * Dragon Claw: garras dracônicas com multi-hit.
 * 3 golpes rápidos em sequência na frente do player.
 * Charmeleon tier (minForm: stage1).
 */
export class DragonClaw implements Attack {
  readonly type = 'dragonClaw' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 65;
  private hitCount = 3;
  private readonly arcAngleDeg = 100;
  private activeHits: ActiveCone[] = [];

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.dragonClaw.baseDamage;
    this.cooldown = ATTACKS.dragonClaw.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.strike(),
    });
  }

  private strike(): void {
    const dir = this.player.getAimDirection();
    const baseAngleRad = Math.atan2(dir.y, dir.x);

    for (let hit = 0; hit < this.hitCount; hit++) {
      this.scene.time.delayedCall(hit * 80, () => {
        if (!this.player.active) return;

        // Cada hit com ângulo ligeiramente diferente
        const angleOffset = (hit - 1) * 0.3;
        const angleRad = baseAngleRad + angleOffset;

        // Visual: garra dracônica segue o jogador
        const offsetX = Math.cos(angleRad) * 30;
        const offsetY = Math.sin(angleRad) * 30;
        const claw = this.scene.add.sprite(
          this.player.x + offsetX, this.player.y + offsetY, 'atk-dragon-claw'
        );
        claw.setScale(1).setDepth(10).setAlpha(0.9);
        claw.setRotation(angleRad);
        claw.play('anim-dragon-claw');
        const followClaw = (): void => {
          if (claw.active) claw.setPosition(this.player.x + offsetX, this.player.y + offsetY);
        };
        this.scene.events.on('update', followClaw);

        // Registra hit ativo — usa baseAngleRad para check de arco
        const activeCone: ActiveCone = {
          sprite: claw,
          hitEnemies: new Set<number>(),
          dirAngleRad: baseAngleRad,
        };
        this.activeHits.push(activeCone);

        claw.once('animationcomplete', () => {
          this.scene.events.off('update', followClaw);
          const idx = this.activeHits.indexOf(activeCone);
          if (idx !== -1) this.activeHits.splice(idx, 1);
          claw.destroy();
        });
      });
    }
  }

  update(_time: number, _delta: number): void {
    for (let i = this.activeHits.length - 1; i >= 0; i--) {
      const { sprite, hitEnemies, dirAngleRad } = this.activeHits[i];
      if (!sprite.active) { this.activeHits.splice(i, 1); continue; }

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
  }

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.range += 5;
    if (this.level % 3 === 0) this.hitCount++;
    this.cooldown = Math.max(900, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.strike(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeHits.length = 0;
  }
}
