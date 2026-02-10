import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Body Slam: evolucao do Tackle.
 * Multi-slam 360 graus com efeito de stun (paralisia).
 * Equivalente ao Fury Swipes do Charmander, tematica de peso/impacto.
 * 5 slams staggered por 60ms, cada um cobrindo um setor de 80 graus.
 */
export class BodySlam implements Attack {
  readonly type = 'bodySlam' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 65;
  private slamCount = 5;

  /** Arco de cada slam em graus */
  private readonly arcAngleDeg = 80;

  /** Duracao do stun em ms */
  private readonly stunDurationMs = 300;

  /** Batch tint cleanup — evita criar delayedCall por inimigo */
  private readonly tintedEnemies = new Set<Phaser.Physics.Arcade.Sprite>();
  private tintClearTime = 0;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.bodySlam.baseDamage;
    this.cooldown = ATTACKS.bodySlam.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slam(),
    });
  }

  private slam(): void {
    for (let i = 0; i < this.slamCount; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        if (!this.player.active) return;

        // Angulo do setor: distribui 360 graus uniformemente entre os slams
        const sectorAngle = (i / this.slamCount) * Math.PI * 2 + Math.random() * 0.3;

        // Visual: flash branco/azul circular no ponto de slam
        const offsetX = Math.cos(sectorAngle) * 30;
        const offsetY = Math.sin(sectorAngle) * 30;
        const slamX = this.player.x + offsetX;
        const slamY = this.player.y + offsetY;

        // Circulo branco/azul de impacto
        if (shouldShowVfx()) {
          const flash = this.scene.add.circle(slamX, slamY, 22, 0xccddff, 0.7);
          flash.setDepth(10);
          this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2.0,
            scaleY: 2.0,
            duration: 200,
            ease: 'Sine.Out',
            onComplete: () => flash.destroy(),
          });

          // Anel de impacto azulado
          const ring = this.scene.add.circle(slamX, slamY, 8, 0x6699cc, 0.5);
          ring.setDepth(10);
          ring.setStrokeStyle(2, 0x88bbff, 0.6);
          this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            scaleX: 2.5,
            scaleY: 2.5,
            duration: 250,
            ease: 'Sine.Out',
            onComplete: () => ring.destroy(),
          });
        }

        // Particulas de impacto
        safeExplode(this.scene, slamX, slamY, 'water-particle', {
          speed: { min: 15, max: 40 },
          lifespan: 200,
          quantity: 3,
          scale: { start: 1, end: 0 },
          tint: [0xccddff, 0xffffff, 0x88bbff],
        });

        // Dano em arco (80 graus por slam)
        const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.range);

        for (const enemy of enemies) {
          const angleToEnemy = Math.atan2(
            enemy.y - this.player.y, enemy.x - this.player.x
          );
          const angleDiff = Math.abs(
            Phaser.Math.Angle.ShortestBetween(
              Phaser.Math.RadToDeg(sectorAngle),
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

          // Stun: zera velocidade do inimigo por stunDurationMs
          const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
          if (enemyBody) {
            enemyBody.velocity.set(0, 0);
            enemy.setTint(0xffffaa);
            this.tintedEnemies.add(enemy);
            this.tintClearTime = this.scene.time.now + this.slamCount * 60 + this.stunDurationMs;
          }
        }
      });
    }
  }

  update(time: number, _delta: number): void {
    if (this.tintedEnemies.size > 0 && time > this.tintClearTime) {
      for (const e of this.tintedEnemies) {
        if (e.active) e.clearTint();
      }
      this.tintedEnemies.clear();
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.range += 4;
    if (this.level % 2 === 0) this.slamCount++;
    this.cooldown = Math.max(250, this.cooldown - 30);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slam(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.tintedEnemies.clear();
  }
}
