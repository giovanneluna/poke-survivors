import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Water Pulse: projétil homing que explode no contato com dano em área.
 * Colisão manual por distância centro-a-centro (sem physics overlap).
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
  private aoeRadius = 60;

  /** Distância centro-a-centro para considerar colisão (visual match) */
  private static readonly HIT_RADIUS = 18;

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

      if (sorted[i].dist < 20) {
        const enemy = target as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, enemy.xpValue);
          }
        }
        this.spawnImpact(target.x, target.y);
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
      bullet.setActive(true).setVisible(true).setScale(0.4);
      bullet.setDepth(8);
      bullet.play('anim-water-pulse');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);

      this.scene.physics.moveToObject(bullet, target, 250);

      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x3388ff, 0x66ccff],
      });

      this.scene.time.delayedCall(3500, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.killBullet(bullet);
        }
        trail.destroy();
      });
    }
  }

  /** Colisão manual: checa distância centro-a-centro a cada frame */
  update(_time: number, _delta: number): void {
    const activeBullets = this.bullets.getChildren().filter(
      (b): b is Phaser.Physics.Arcade.Sprite => (b as Phaser.Physics.Arcade.Sprite).active
    );

    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const bullet of activeBullets) {
      for (const enemySprite of enemies) {
        const dist = Phaser.Math.Distance.Between(
          bullet.x, bullet.y, enemySprite.x, enemySprite.y
        );
        if (dist > WaterPulse.HIT_RADIUS) continue;

        // Hit direto no inimigo que tocou
        const enemy = enemySprite as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          }
        }

        // Explosão + AoE no ponto de impacto
        this.spawnImpact(bullet.x, bullet.y);
        this.killBullet(bullet);
        break;
      }
    }
  }

  private spawnImpact(x: number, y: number): void {
    const impact = this.scene.add.sprite(x, y, 'atk-water-pulse');
    impact.setScale(0.6).setDepth(11).setAlpha(0.9);
    impact.play('anim-water-pulse-hit');
    impact.once('animationcomplete', () => impact.destroy());

    // AoE: dano em todos inimigos no raio da explosão
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y);
      if (dist > this.aoeRadius) continue;
      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        const falloff = 1 - (dist / this.aoeRadius) * 0.4;
        setDamageSource(this.type);
        const killed = enemy.takeDamage(Math.floor(this.damage * 0.6 * falloff));
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
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
    this.aoeRadius += 5;
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
