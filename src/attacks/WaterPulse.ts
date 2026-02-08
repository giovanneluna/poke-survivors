import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';

/**
 * Water Pulse: pulso de agua no inimigo mais proximo.
 * Projétil homing com trail de partículas azuis e ring effect no impacto.
 * Wartortle tier (minForm: stage1).
 */
export class WaterPulse implements Attack {
  readonly type = 'waterPulse' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.waterPulse.baseDamage;
    this.cooldown = ATTACKS.waterPulse.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-water-pulse',
      maxSize: 30,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Ordena por distância ao player
    const sorted = enemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    const count = Math.min(this.projectileCount + this.player.stats.projectileBonus, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = sorted[i].enemy;

      // Inimigo muito perto: dano direto (evita bug de projétil sem velocidade)
      if (sorted[i].dist < 20) {
        const enemy = target as unknown as import('../entities/Enemy').Enemy;
        if (typeof enemy.takeDamage === 'function') {
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, enemy.xpValue);
          }
        }
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-water-pulse'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setActive(true).setVisible(true).setScale(0.8);
      bullet.setDepth(8);
      bullet.play('anim-water-pulse');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;

      this.scene.physics.moveToObject(bullet, target, 250);

      // Trail de partículas de água
      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x3388ff, 0x66ccff],
      });

      // Auto-destruir após 3.5s (só se ainda for o mesmo disparo)
      this.scene.time.delayedCall(3500, () => {
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
    // Timer-based, sem update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    if (this.level % 3 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(600, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
