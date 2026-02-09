import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Flora Burst: explosao floral apocaliptica com falloff de distancia.
 * Evolucao de petalDance. Spawna no inimigo mais proximo,
 * sprite grande (scale 2.0) com tint rosa, tick de dano com falloff
 * (100% centro, 50% borda). Particulas de petala rosa.
 */
export class FloraBurst implements Attack {
  readonly type = 'floraBurst' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 100;
  private readonly duration = 2500;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.floraBurst.baseDamage;
    this.cooldown = ATTACKS.floraBurst.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.burst(),
    });
  }

  private burst(): void {
    // Encontrar inimigo mais proximo para posicionar a explosao
    const nearest = getSpatialGrid().queryNearest(this.player.x, this.player.y);
    if (!nearest) return;

    const cx = nearest.x;
    const cy = nearest.y;

    // Sprite grande com tint rosa
    const floraSprite = this.scene.add.sprite(cx, cy, 'atk-seed-flare');
    floraSprite.setScale(2.0).setDepth(9).setAlpha(0.85);
    floraSprite.setTint(0xff66aa);
    floraSprite.play('anim-seed-flare');
    floraSprite.once('animationcomplete', () => {
      // Manter visivel como aura rosada durante a duracao restante
      floraSprite.setAlpha(0.4);
    });

    // Particulas de petala rosa continuamente
    const petalEmitter = this.scene.add.particles(cx, cy, 'fire-particle', {
      speed: { min: 20, max: 70 },
      lifespan: 500,
      quantity: 4,
      frequency: 80,
      scale: { start: 1.8, end: 0 },
      tint: [0xff66aa, 0xff88cc, 0xffaadd],
      angle: { min: 0, max: 360 },
    });

    // Tick de dano com falloff a cada 200ms
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        elapsed += 200;
        if (elapsed >= this.duration) {
          cleanup();
          return;
        }

        const aliveEnemies = getSpatialGrid().queryRadius(cx, cy, this.radius);

        for (const enemy of aliveEnemies) {
          // Falloff: 100% no centro, 50% na borda
          const dist = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
          const falloff = 1 - (dist / this.radius) * 0.5;
          const tickDamage = Math.floor(this.damage * falloff);

          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(tickDamage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }
        }
      },
    });

    const cleanup = (): void => {
      tickEvent.destroy();
      petalEmitter.destroy();
      this.scene.tweens.add({
        targets: floraSprite,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        onComplete: () => floraSprite.destroy(),
      });
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.radius += 12;
    this.cooldown = Math.max(2000, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.burst(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
