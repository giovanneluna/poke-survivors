import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Inferno: evolução do Ember.
 * Bolas de fogo que EXPLODEM no impacto, causando dano AoE.
 */
export class Inferno implements Attack {
  readonly type = 'inferno' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 3;
  private readonly explosionRadius = 60;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.inferno.baseDamage;
    this.cooldown = ATTACKS.inferno.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-ember',
      maxSize: 50,
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

    const sorted = enemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y),
      }))
      .sort((a, b) => a.dist - b.dist);

    const count = Math.min(this.projectileCount, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = sorted[i].enemy;

      // Dano direto se inimigo está muito perto
      if (sorted[i].dist < 20) {
        const enemy = target as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, enemy.xpValue);
          }
        }
        this.explodeAt(target.x, target.y);
        continue;
      }

      const bullet = this.bullets.get(this.player.x, this.player.y, 'atk-ember') as Phaser.Physics.Arcade.Sprite | null;
      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setActive(true).setVisible(true).setScale(2.5).setDepth(8);
      bullet.play('anim-ember');
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = false;
      body.enable = true;

      this.scene.physics.moveToObject(bullet, target, 280);

      const trail = this.scene.add.particles(0, 0, 'fire-particle', {
        follow: bullet,
        speed: { min: 10, max: 30 },
        lifespan: 250,
        scale: { start: 1.5, end: 0 },
        quantity: 2,
        frequency: 40,
        tint: [0xff2200, 0xff6600, 0xffcc00],
      });

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

  explodeAt(x: number, y: number): void {
    // Efeito visual de explosão com sprite real
    const explosion = this.scene.add.sprite(x, y, 'atk-fire-hit');
    explosion.setScale(2.5).setDepth(10);
    explosion.play('anim-fire-hit');
    explosion.once('animationcomplete', () => explosion.destroy());

    // Partículas complementares
    this.scene.add.particles(x, y, 'fire-particle', {
      speed: { min: 40, max: 120 },
      lifespan: 300,
      quantity: 10,
      scale: { start: 2, end: 0 },
      tint: [0xff2200, 0xff6600, 0xffaa00],
      emitting: false,
    }).explode();

    // Dano AoE
    const enemies = this.enemyGroup.getChildren();
    for (const child of enemies) {
      const enemy = child as Enemy;
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= this.explosionRadius) {
        const killed = enemy.takeDamage(Math.floor(this.damage * 0.6));
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  getDamage(): number { return this.damage; }
  getBullets(): ArcadeGroup { return this.bullets; }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    if (this.level % 2 === 0) this.projectileCount++;
    this.cooldown = Math.max(400, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
