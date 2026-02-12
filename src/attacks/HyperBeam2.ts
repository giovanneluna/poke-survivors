import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

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
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.hyperBeam2.baseDamage;
    this.cooldown = ATTACKS.hyperBeam2.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-solar-beam',
      maxSize: 8,
    });

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const aimTarget = this.player.getAimTarget();

    if (aimTarget) {
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

      const angle = Math.atan2(aimTarget.y - this.player.y, aimTarget.x - this.player.x);
      bullet.setRotation(angle);
      body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

      // Trail dourado
      let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
      if (shouldShowVfx()) {
        trail = this.scene.add.particles(0, 0, 'fire-particle', {
          follow: bullet,
          speed: { min: 5, max: 25 },
          lifespan: 250,
          scale: { start: 1.5, end: 0 },
          quantity: getVfxQuantity(2),
          frequency: 40,
          tint: [0xffdd44, 0xffaa22],
        });
      }

      // Auto-destruir apos 3s (protecao contra stale timer)
      this.scene.time.delayedCall(3000, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.bullets.killAndHide(bullet);
          body.checkCollision.none = true;
          body.enable = false;
        }
        trail?.destroy();
      });
      return;
    }

    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (activeEnemies.length === 0) return;

    // Encontrar inimigo mais proximo
    const sorted = activeEnemies
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
    let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    if (shouldShowVfx()) {
      trail = this.scene.add.particles(0, 0, 'fire-particle', {
        follow: bullet,
        speed: { min: 5, max: 25 },
        lifespan: 250,
        scale: { start: 1.5, end: 0 },
        quantity: getVfxQuantity(2),
        frequency: 40,
        tint: [0xffdd44, 0xffaa22],
      });
    }

    // Auto-destruir apos 3s (protecao contra stale timer)
    this.scene.time.delayedCall(3000, () => {
      if (bullet.active && bullet.getData('fireId') === currentFireId) {
        this.bullets.killAndHide(bullet);
        body.checkCollision.none = true;
        body.enable = false;
      }
      trail?.destroy();
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
    const enemies = getSpatialGrid().getActiveEnemies();

    for (const bullet of activeBullets) {
      const hitSet = bullet.getData('hitSet') as Set<number>;

      for (const enemy of enemies) {
        const uid = (enemy.getData('uid') as number) ?? 0;
        if (hitSet.has(uid)) continue;

        const dist = Phaser.Math.Distance.Between(
          bullet.x, bullet.y, enemy.x, enemy.y
        );
        if (dist > HyperBeam2.HIT_RADIUS) continue;

        hitSet.add(uid);
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
        }

        safeExplode(this.scene, enemy.x, enemy.y, 'fire-particle', {
          speed: { min: 20, max: 50 },
          lifespan: 200,
          quantity: 4,
          scale: { start: 1.2, end: 0 },
          tint: [0xffdd44, 0xffaa22],
        });
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 15;
    this.cooldown = Math.max(3500, this.cooldown - 200);
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
