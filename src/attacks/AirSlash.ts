import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

/**
 * Air Slash: lâmina de ar que atravessa inimigos.
 * Projétil piercing na direção do movimento.
 * Charizard tier (minForm: stage2).
 */
export class AirSlash implements Attack {
  readonly type = 'airSlash' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bladeCount = 1;
  private pierceCount = 3;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.airSlash.baseDamage;
    this.cooldown = ATTACKS.airSlash.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.slash(),
    });
  }

  private slash(): void {
    const dir = this.player.getLastDirection();
    const baseAngle = Math.atan2(dir.y, dir.x);

    for (let i = 0; i < this.bladeCount; i++) {
      const spread = this.bladeCount > 1 ? (i - (this.bladeCount - 1) / 2) * 0.25 : 0;
      const angle = baseAngle + spread;

      const blade = this.scene.add.sprite(this.player.x, this.player.y, 'atk-air-slash');
      blade.setScale(1.4).setDepth(10).setAlpha(0.9);
      blade.setRotation(angle);
      blade.play('anim-air-slash');

      const speed = 350;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      let pierced = 0;
      const hitSet = new Set<number>();

      // Trail de vento
      let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
      if (shouldShowVfx()) {
        trail = this.scene.add.particles(0, 0, 'wind-particle', {
          follow: blade, speed: { min: 10, max: 30 }, lifespan: 150,
          scale: { start: 1, end: 0 }, quantity: getVfxQuantity(1), frequency: 40,
          tint: [0x88ccff, 0xaaddff],
        });
      }

      const moveEvent = this.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          if (!blade.active) return;
          blade.x += vx * 0.016;
          blade.y += vy * 0.016;

          // Check hit com inimigos
          const enemies = getSpatialGrid().queryRadius(blade.x, blade.y, 25);
          for (const enemy of enemies) {
            if (hitSet.has(enemy.getData('uid') ?? 0)) continue;

            hitSet.add(enemy.getData('uid') ?? 0);
            if (typeof enemy.takeDamage === 'function') {
              setDamageSource(this.type);
              const killed = enemy.takeDamage(this.damage);
              if (killed) {
                this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
              }
            }
            pierced++;
            if (pierced >= this.pierceCount) {
              cleanup();
              return;
            }
          }
        },
      });

      const cleanup = () => {
        moveEvent.destroy();
        trail?.destroy();
        blade.destroy();
      };

      // Auto-destruir após 2s
      this.scene.time.delayedCall(2000, cleanup);
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.pierceCount++;
    if (this.level % 3 === 0) this.bladeCount++;
    this.cooldown = Math.max(1500, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.slash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
