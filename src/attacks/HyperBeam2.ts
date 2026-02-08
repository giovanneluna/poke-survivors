import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Hyper Beam 2: raio devastador que PERFURA inimigos (nao morre na colisao).
 * Evolucao de solarBeam. Reutiliza sprite solar-beam em escala 2x.
 * Pool com fireId para protecao contra stale timers.
 * Trail dourado com fire-particle.
 */
export class HyperBeam2 implements Attack {
  readonly type = 'hyperBeam2' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.hyperBeam2.baseDamage;
    this.cooldown = ATTACKS.hyperBeam2.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-solar-beam',
      maxSize: 8,
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

    // Encontrar inimigo mais proximo
    const sorted = enemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    const target = sorted[0].enemy;

    const bullet = this.bullets.get(
      this.player.x,
      this.player.y,
      'atk-solar-beam'
    ) as Phaser.Physics.Arcade.Sprite | null;

    if (!bullet) return;

    const currentFireId = ++this.fireId;
    bullet.setData('fireId', currentFireId);
    bullet.setData('hitSet', new Set<number>());
    bullet.setActive(true).setVisible(true).setScale(2.0);
    bullet.setTexture('atk-solar-beam');
    bullet.setDepth(8);
    bullet.play('anim-solar-beam');

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(this.player.x, this.player.y);
    body.checkCollision.none = false;
    body.setSize(24, 120);

    // Rotacionar na direcao do alvo
    const angleToTarget = Math.atan2(
      target.y - this.player.y, target.x - this.player.x
    );
    bullet.setRotation(angleToTarget);

    this.scene.physics.moveToObject(bullet, target, 400);

    // Trail dourado
    const trail = this.scene.add.particles(0, 0, 'fire-particle', {
      follow: bullet,
      speed: { min: 5, max: 25 },
      lifespan: 250,
      scale: { start: 1.5, end: 0 },
      quantity: 2,
      frequency: 40,
      tint: [0xffdd44, 0xffaa22],
    });

    // Auto-destruir apos 3s (protecao contra stale timer)
    this.scene.time.delayedCall(3000, () => {
      if (bullet.active && bullet.getData('fireId') === currentFireId) {
        this.bullets.killAndHide(bullet);
        body.checkCollision.none = true;
        body.enable = false;
      }
      trail.destroy();
    });
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  private static readonly HIT_RADIUS = 28;

  /** Colisão manual pierce: cada inimigo só é atingido UMA VEZ por disparo. */
  update(_time: number, _delta: number): void {
    const activeBullets = this.bullets.getChildren().filter(
      (b): b is Phaser.Physics.Arcade.Sprite => (b as Phaser.Physics.Arcade.Sprite).active
    );
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const bullet of activeBullets) {
      const hitSet = bullet.getData('hitSet') as Set<number>;

      for (const enemySprite of enemies) {
        const uid = (enemySprite.getData('uid') as number) ?? 0;
        if (hitSet.has(uid)) continue;

        const dist = Phaser.Math.Distance.Between(
          bullet.x, bullet.y, enemySprite.x, enemySprite.y
        );
        if (dist > HyperBeam2.HIT_RADIUS) continue;

        hitSet.add(uid);
        const enemy = enemySprite as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          }
        }

        this.scene.add.particles(enemySprite.x, enemySprite.y, 'fire-particle', {
          speed: { min: 20, max: 50 },
          lifespan: 200,
          quantity: 4,
          scale: { start: 1.2, end: 0 },
          tint: [0xffdd44, 0xffaa22],
          emitting: false,
        }).explode();
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 15;
    this.cooldown = Math.max(3500, this.cooldown - 200);
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
