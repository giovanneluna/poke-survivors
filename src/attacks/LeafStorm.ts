import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Leaf Storm: tempestade de folhas em area devastadora.
 * Evolucao de razorLeaf. Spawna na posicao do inimigo mais proximo,
 * sprite cresce de 0.5 a 2.0, causa dano por tick em raio.
 * Tint verde sobre anim de petal blizzard.
 */
export class LeafStorm implements Attack {
  readonly type = 'leafStorm' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 90;
  private readonly duration = 2000;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.leafStorm.baseDamage;
    this.cooldown = ATTACKS.leafStorm.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.storm(),
    });
  }

  private storm(): void {
    // Encontrar inimigo mais proximo para posicionar a tempestade
    const enemies = getSpatialGrid().getActiveEnemies();
    if (enemies.length === 0) return;

    const nearest = enemies.reduce((best, e) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      const bd = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
      return d < bd ? e : best;
    });

    const cx = nearest.x;
    const cy = nearest.y;

    // Sprite animado com tint verde
    const stormSprite = this.scene.add.sprite(cx, cy, 'atk-petal-blizzard');
    stormSprite.setScale(0.5).setDepth(9).setAlpha(0.85);
    stormSprite.setTint(0x44dd66);
    stormSprite.play({ key: 'anim-petal-blizzard', repeat: -1 });

    // Tween de crescimento
    this.scene.tweens.add({
      targets: stormSprite,
      scale: 2.0,
      alpha: 0.6,
      duration: this.duration,
      ease: 'Sine.easeOut',
    });

    // Particulas verdes
    const leafEmitter = this.scene.add.particles(cx, cy, 'fire-particle', {
      speed: { min: 30, max: 80 },
      lifespan: 400,
      quantity: 3,
      frequency: 100,
      scale: { start: 1.5, end: 0 },
      tint: [0x44dd66, 0x22bb44, 0x66ff88],
      angle: { min: 0, max: 360 },
    });

    // Tick de dano a cada 250ms
    const hitSet = new Set<number>();
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: 250, loop: true,
      callback: () => {
        elapsed += 250;
        if (elapsed >= this.duration) {
          cleanup();
          return;
        }

        // Reset hit set cada tick para permitir multi-hit
        hitSet.clear();

        const aliveEnemies = getSpatialGrid().queryRadius(cx, cy, this.radius);

        for (const enemy of aliveEnemies) {
          const uid = enemy.getData('uid') as number | undefined ?? 0;
          if (hitSet.has(uid)) continue;
          hitSet.add(uid);

          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }
        }
      },
    });

    const cleanup = (): void => {
      tickEvent.destroy();
      leafEmitter.destroy();
      this.scene.tweens.add({
        targets: stormSprite,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        onComplete: () => stormSprite.destroy(),
      });
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.radius += 10;
    this.cooldown = Math.max(1200, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.storm(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
