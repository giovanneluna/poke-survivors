import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Razor Leaf: folhas cortantes disparadas no inimigo mais próximo.
 * Padrão projétil (WaterGun-like) com trail verde.
 * Bulbasaur base.
 */
export class RazorLeaf implements Attack {
  readonly type = 'razorLeaf' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.razorLeaf.baseDamage;
    this.cooldown = ATTACKS.razorLeaf.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-razor-leaf',
      maxSize: 60,
    });

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const aimTarget = this.player.getAimTarget();

    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (!aimTarget && activeEnemies.length === 0) return;

    // Ordena por distância ao player (usado apenas no auto-aim)
    const sorted = aimTarget ? [] : activeEnemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    const totalCount = this.projectileCount + this.player.stats.projectileBonus;
    const count = aimTarget ? totalCount : Math.min(totalCount, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = aimTarget ? null : sorted[i].enemy;

      // Inimigo muito perto: dano direto (auto-aim only)
      if (!aimTarget && sorted[i].dist < 20) {
        if (typeof target!.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = target!.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target!.x, target!.y, target!.xpValue);
          }
        }
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-razor-leaf'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setActive(true).setVisible(true).setScale(1.2);
      bullet.setDepth(8);
      bullet.play('anim-razor-leaf');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;
      body.setCircle(10, 6, 6);

      if (aimTarget) {
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
        const aimAngle = Math.atan2(aimTarget.y - this.player.y, aimTarget.x - this.player.x);
        body.setVelocity(
          Math.cos(aimAngle + spread) * 280,
          Math.sin(aimAngle + spread) * 280
        );
      } else {
        this.scene.physics.moveToObject(bullet, target!, 280);
      }

      // Trail de partículas verdes
      const trail = this.scene.add.particles(0, 0, 'fire-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x22cc44, 0x44dd66, 0x88aa44],
      });

      // Auto-destruir após 1800ms (stale protection via fireId)
      this.scene.time.delayedCall(1800, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.bullets.killAndHide(bullet);
          body.checkCollision.none = true;
          body.enable = false;
        }
        trail.destroy();
      });
    }
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  update(_time: number, _delta: number): void {
    // Razor Leaf é baseado em timer, não precisa de update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 3;
    if (this.level % 2 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(600, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
