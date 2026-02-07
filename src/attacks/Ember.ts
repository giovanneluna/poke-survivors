import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';

/**
 * Ember: dispara bolas de fogo no inimigo mais próximo.
 * Equivalente ao "Magic Wand" do Vampire Survivors.
 */
export class Ember implements Attack {
  readonly type = 'ember' as const;
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
    this.damage = ATTACKS.ember.baseDamage;
    this.cooldown = ATTACKS.ember.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-ember',
      maxSize: 40,
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

    const count = Math.min(this.projectileCount, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = sorted[i].enemy;

      // Se o inimigo está muito perto, dano direto (evita bug de projétil sem velocidade)
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
        'atk-ember'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setActive(true).setVisible(true).setScale(1.5);
      bullet.setDepth(8);
      bullet.play('anim-ember');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = false;
      body.enable = true;

      this.scene.physics.moveToObject(bullet, target, 300);

      // Partícula trail
      const trail = this.scene.add.particles(0, 0, 'fire-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0xff6600, 0xff4400, 0xffaa00],
      });

      // Auto-destruir após 3s (só se ainda for o mesmo disparo)
      this.scene.time.delayedCall(3000, () => {
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
    // Ember é baseado em timer, não precisa de update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    if (this.level % 2 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(400, this.cooldown - 100);
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
