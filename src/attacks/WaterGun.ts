import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Water Gun: jatos de água com ricochete entre inimigos.
 * Projétil atinge o alvo e bounça para o próximo mais perto (chain).
 * Usa colisão manual no update() (padrão EnergyBall).
 * collision: 'none' no AttackFactory.
 */
export class WaterGun implements Attack {
  readonly type = 'waterGun' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private fireId = 0;
  private maxChains = 2;
  private readonly speed = 300;

  private static readonly HIT_RADIUS = 20;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.waterGun.baseDamage;
    this.cooldown = ATTACKS.waterGun.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-wave-splash',
      maxSize: 80,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (activeEnemies.length === 0) return;

    const sorted = activeEnemies
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

      if (sorted[i].dist < 20) {
        if (typeof target.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = target.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, target.xpValue);
          }
        }
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-wave-splash'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setData('chainsLeft', this.maxChains);
      bullet.setData('lastHitUid', -1);
      bullet.setActive(true).setVisible(true).setScale(0.8);
      bullet.setDepth(8);
      bullet.play('anim-wave-splash');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;
      body.setCircle(12, 4, 4);

      this.scene.physics.moveToObject(bullet, target, this.speed);

      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x3388ff, 0x44aaff, 0x66ccff],
      });

      this.scene.time.delayedCall(2500, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.killBullet(bullet);
        }
        trail.destroy();
      });
    }
  }

  /** Colisão manual com chain ricochet */
  update(_time: number, _delta: number): void {
    const activeBullets = this.bullets.getChildren().filter(
      (b): b is Phaser.Physics.Arcade.Sprite => (b as Phaser.Physics.Arcade.Sprite).active
    );

    const enemies = getSpatialGrid().getActiveEnemies();

    for (const bullet of activeBullets) {
      const lastHitUid = bullet.getData('lastHitUid') as number;

      for (const enemy of enemies) {
        const uid = (enemy.getData('uid') as number) ?? 0;
        if (uid === lastHitUid) continue;

        const dist = Phaser.Math.Distance.Between(
          bullet.x, bullet.y, enemy.x, enemy.y
        );
        if (dist > WaterGun.HIT_RADIUS) continue;

        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
        }

        const chainsLeft = ((bullet.getData('chainsLeft') as number) ?? 0) - 1;
        bullet.setData('chainsLeft', chainsLeft);
        bullet.setData('lastHitUid', uid);

        if (chainsLeft <= 0) {
          this.killBullet(bullet);
          break;
        }

        // Encontrar próximo alvo
        const nextTargets = enemies.filter(e => {
          const eUid = (e.getData('uid') as number) ?? 0;
          return e.active && eUid !== uid;
        });

        if (nextTargets.length === 0) {
          this.killBullet(bullet);
          break;
        }

        const nextTarget = nextTargets.reduce((best, e) => {
          const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
          const bd = Phaser.Math.Distance.Between(bullet.x, bullet.y, best.x, best.y);
          return d < bd ? e : best;
        });

        this.scene.physics.moveToObject(bullet, nextTarget, this.speed);

        // Flash visual de ricochete
        const p = this.scene.add.particles(bullet.x, bullet.y, 'water-particle', {
          speed: { min: 20, max: 50 },
          lifespan: 200,
          quantity: 4,
          scale: { start: 1, end: 0 },
          tint: [0x3388ff, 0x44aaff],
          emitting: false,
        });
        p.explode();
        this.scene.time.delayedCall(300, () => p.destroy());

        break;
      }
    }
  }

  private killBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
    this.bullets.killAndHide(bullet);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    if (this.level % 2 === 0) {
      this.projectileCount++;
    }
    if (this.level % 3 === 0) {
      this.maxChains++;
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
