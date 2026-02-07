import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

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
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bladeCount = 1;
  private pierceCount = 3;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.airSlash.baseDamage;
    this.cooldown = ATTACKS.airSlash.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slash(),
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
      const trail = this.scene.add.particles(0, 0, 'wind-particle', {
        follow: blade, speed: { min: 10, max: 30 }, lifespan: 150,
        scale: { start: 1, end: 0 }, quantity: 1, frequency: 40,
        tint: [0x88ccff, 0xaaddff],
      });

      const moveEvent = this.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          if (!blade.active) return;
          blade.x += vx * 0.016;
          blade.y += vy * 0.016;

          // Check hit com inimigos
          const enemies = this.enemyGroup.getChildren().filter(
            (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
          );
          for (const enemySprite of enemies) {
            if (hitSet.has(enemySprite.getData('uid') ?? 0)) continue;
            const dist = Phaser.Math.Distance.Between(blade.x, blade.y, enemySprite.x, enemySprite.y);
            if (dist > 25) continue;

            hitSet.add(enemySprite.getData('uid') ?? 0);
            const enemy = enemySprite as unknown as Enemy;
            if (typeof enemy.takeDamage === 'function') {
              const killed = enemy.takeDamage(this.damage);
              if (killed) {
                this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
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
        trail.destroy();
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
    this.cooldown = Math.max(700, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
