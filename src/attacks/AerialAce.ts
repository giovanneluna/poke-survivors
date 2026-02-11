import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

/**
 * Aerial Ace: lâminas homing que nunca erram.
 * Evolução de Air Slash + Sharp Beak.
 * Projéteis que perseguem inimigos automaticamente.
 */
export class AerialAce implements Attack {
  readonly type = 'aerialAce' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bladeCount = 2;
  private speed = 280;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.aerialAce.baseDamage;
    this.cooldown = ATTACKS.aerialAce.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.launch(),
    });
  }

  private launch(): void {
    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (activeEnemies.length === 0) return;

    // Ordena por distância
    const sorted = activeEnemies
      .map(e => ({ enemy: e, dist: Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) }))
      .sort((a, b) => a.dist - b.dist);

    const count = Math.min(this.bladeCount, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = sorted[i].enemy;

      this.scene.time.delayedCall(i * 100, () => {
        if (!this.player.active) return;

        const blade = this.scene.add.sprite(this.player.x, this.player.y, 'atk-aerial-ace');
        blade.setScale(1.5).setDepth(10).setAlpha(0.9);
        blade.play('anim-aerial-ace');

        let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
        if (shouldShowVfx()) {
          trail = this.scene.add.particles(0, 0, 'wind-particle', {
            follow: blade, speed: { min: 10, max: 30 }, lifespan: 150,
            scale: { start: 1, end: 0 }, quantity: getVfxQuantity(1), frequency: 30,
            tint: [0x88ccff, 0xffffff],
          });
        }

        // Homing: persegue o target
        let alive = true;
        const moveEvent = this.scene.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            if (!alive || !blade.active) return;

            // Encontra target vivo (se morreu, busca próximo)
            let currentTarget: Phaser.Physics.Arcade.Sprite = target;
            if (!currentTarget.active) {
              const nearest = getSpatialGrid().queryNearest(blade.x, blade.y);
              if (!nearest) { cleanup(); return; }
              currentTarget = nearest;
            }

            // Mover em direção ao target
            const angleToTarget = Math.atan2(
              currentTarget.y - blade.y, currentTarget.x - blade.x
            );
            blade.x += Math.cos(angleToTarget) * this.speed * 0.016;
            blade.y += Math.sin(angleToTarget) * this.speed * 0.016;
            blade.setRotation(angleToTarget);

            // Check hit
            const dist = Phaser.Math.Distance.Between(blade.x, blade.y, currentTarget.x, currentTarget.y);
            if (dist < 20) {
              if (typeof (currentTarget as Enemy).takeDamage === 'function') {
                setDamageSource(this.type);
                const killed = (currentTarget as Enemy).takeDamage(this.damage);
                if (killed) {
                  this.scene.events.emit('cone-attack-kill', currentTarget.x, currentTarget.y, (currentTarget as Enemy).xpValue);
                }
              }
              // Impacto visual
              safeExplode(this.scene, blade.x, blade.y, 'wind-particle', {
                speed: { min: 30, max: 80 }, lifespan: 150, quantity: 6,
                scale: { start: 1.5, end: 0 }, tint: [0x88ccff, 0xffffff],
              });
              cleanup();
            }
          },
        });

        const cleanup = () => {
          if (!alive) return;
          alive = false;
          moveEvent.destroy();
          trail?.destroy();
          blade.destroy();
        };

        // Safety timeout
        this.scene.time.delayedCall(3000, cleanup);
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.speed += 20;
    if (this.level % 2 === 0) this.bladeCount++;
    this.cooldown = Math.max(1500, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.launch(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
