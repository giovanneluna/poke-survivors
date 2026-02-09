import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Heat Wave: onda de calor 360° devastadora.
 * PRIME attack - Charizard exclusivo.
 * Onda expansiva de fogo que atinge TODOS os inimigos em raio crescente.
 */
export class HeatWave implements Attack {
  readonly type = 'heatWave' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private maxRadius = 180;
  private waveDuration = 600;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.heatWave.baseDamage;
    this.cooldown = ATTACKS.heatWave.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.wave(),
    });
  }

  private wave(): void {
    const cx = this.player.x;
    const cy = this.player.y;

    // Visual: sprite de heat wave animado + anel expansivo
    const heatSprite = this.scene.add.sprite(cx, cy, 'atk-heat-wave');
    heatSprite.setScale(0.5).setDepth(9).setAlpha(0.9);
    heatSprite.play('anim-heat-wave');
    this.scene.tweens.add({
      targets: heatSprite,
      scale: this.maxRadius / 48,
      alpha: 0,
      duration: this.waveDuration,
      ease: 'Sine.easeOut',
      onComplete: () => heatSprite.destroy(),
    });

    // Partículas em 8 direções
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const angleDeg = Phaser.Math.RadToDeg(angle);
      this.scene.add.particles(cx, cy, 'fire-particle', {
        speed: { min: 150, max: 300 },
        angle: { min: angleDeg - 10, max: angleDeg + 10 },
        lifespan: 400, quantity: 4,
        scale: { start: 2.5, end: 0 },
        tint: [0xff2200, 0xff6600, 0xffaa00],
        emitting: false,
      }).explode();
    }

    // Dano em ondas (inner → outer)
    const hitSet = new Set<number>();
    const waves = 3;
    for (let w = 0; w < waves; w++) {
      this.scene.time.delayedCall(w * (this.waveDuration / waves), () => {
        const currentRadius = (this.maxRadius / waves) * (w + 1);

        const enemies = getSpatialGrid().queryRadius(cx, cy, currentRadius);

        for (const enemy of enemies) {
          const uid = enemy.getData('uid') ?? 0;
          if (hitSet.has(uid)) continue;

          const dist = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);

          hitSet.add(uid);
          if (typeof enemy.takeDamage === 'function') {
            // Dano diminui com distância
            const falloff = 1 - (dist / this.maxRadius) * 0.4;
            setDamageSource(this.type);
            const killed = enemy.takeDamage(Math.floor(this.damage * falloff));
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }
        }
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.maxRadius += 15;
    this.cooldown = Math.max(3000, this.cooldown - 250);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.wave(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
