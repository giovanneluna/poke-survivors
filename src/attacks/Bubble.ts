import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

/**
 * Bubble: bolhas lentas com ricochete + slow AoE no pop final.
 * Usa colisão manual no update() (padrão EnergyBall/WaterGun).
 * collision: 'none' no AttackFactory.
 */
export class Bubble implements Attack {
  readonly type = 'bubble' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bubblesPerBurst = 1;
  private fireId = 0;
  private maxChains = 2;

  private readonly slowRadius = 60;
  private readonly slowVelocityScale = 0.6;
  private readonly slowDurationMs = 1500;
  private readonly speed = 100;

  private static readonly HIT_RADIUS = 22;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.bubble.baseDamage;
    this.cooldown = ATTACKS.bubble.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-bubble-shot',
      maxSize: 120,
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
      const baseAngle = Math.atan2(
        aimTarget.y - this.player.y,
        aimTarget.x - this.player.x,
      );

      for (let i = 0; i < this.bubblesPerBurst; i++) {
        const bubble = this.bullets.get(
          this.player.x,
          this.player.y,
          'atk-bubble-shot',
        ) as Phaser.Physics.Arcade.Sprite | null;

        if (!bubble) continue;

        const currentFireId = ++this.fireId;
        bubble.setData('fireId', currentFireId);
        bubble.setData('chainsLeft', this.maxChains);
        bubble.setData('lastHitUid', -1);
        bubble.setActive(true).setVisible(true).setScale(1.0).setAlpha(0.85);
        bubble.setDepth(8);
        bubble.play('anim-bubble-shot');

        const body = bubble.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(this.player.x, this.player.y);
        body.checkCollision.none = false;
        body.setCircle(12, -8, -8);

        const spread = this.bubblesPerBurst > 1
          ? (i - (this.bubblesPerBurst - 1) / 2) * 0.15
          : 0;

        body.setVelocity(
          Math.cos(baseAngle + spread) * this.speed,
          Math.sin(baseAngle + spread) * this.speed,
        );

        let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
        if (shouldShowVfx()) {
          trail = this.scene.add.particles(0, 0, 'water-particle', {
            follow: bubble,
            speed: { min: 3, max: 12 },
            lifespan: 250,
            scale: { start: 0.8, end: 0 },
            quantity: getVfxQuantity(1),
            frequency: 60,
            tint: [0x44aaff, 0x88ccff, 0xaaddff],
          });
        }

        this.scene.time.delayedCall(2500, () => {
          if (bubble.active && bubble.getData('fireId') === currentFireId) {
            this.popBubble(bubble);
          }
          trail?.destroy();
        });
      }
      return;
    }

    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (activeEnemies.length === 0) return;

    const closest = activeEnemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y,
        ),
      }))
      .sort((a, b) => a.dist - b.dist)[0];

    const target = closest.enemy;
    const baseAngle = Math.atan2(
      target.y - this.player.y,
      target.x - this.player.x,
    );

    for (let i = 0; i < this.bubblesPerBurst; i++) {
      const bubble = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-bubble-shot',
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bubble) continue;

      const currentFireId = ++this.fireId;
      bubble.setData('fireId', currentFireId);
      bubble.setData('chainsLeft', this.maxChains);
      bubble.setData('lastHitUid', -1);
      bubble.setActive(true).setVisible(true).setScale(1.0).setAlpha(0.85);
      bubble.setDepth(8);
      bubble.play('anim-bubble-shot');

      const body = bubble.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;
      body.setCircle(12, -8, -8);

      const spreadDeg = Phaser.Math.FloatBetween(-15, 15);
      const finalAngle = baseAngle + Phaser.Math.DegToRad(spreadDeg);

      body.setVelocity(
        Math.cos(finalAngle) * this.speed,
        Math.sin(finalAngle) * this.speed,
      );

      let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
      if (shouldShowVfx()) {
        trail = this.scene.add.particles(0, 0, 'water-particle', {
          follow: bubble,
          speed: { min: 3, max: 12 },
          lifespan: 250,
          scale: { start: 0.8, end: 0 },
          quantity: getVfxQuantity(1),
          frequency: 60,
          tint: [0x44aaff, 0x88ccff, 0xaaddff],
        });
      }

      this.scene.time.delayedCall(2500, () => {
        if (bubble.active && bubble.getData('fireId') === currentFireId) {
          this.popBubble(bubble);
        }
        trail?.destroy();
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
        if (dist > Bubble.HIT_RADIUS) continue;

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
          this.popBubble(bullet);
          break;
        }

        // Encontrar próximo alvo
        const nextTargets = enemies.filter(e => {
          const eUid = (e.getData('uid') as number) ?? 0;
          return e.active && eUid !== uid;
        });

        if (nextTargets.length === 0) {
          this.popBubble(bullet);
          break;
        }

        const nextTarget = nextTargets.reduce((best, e) => {
          const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
          const bd = Phaser.Math.Distance.Between(bullet.x, bullet.y, best.x, best.y);
          return d < bd ? e : best;
        });

        this.scene.physics.moveToObject(bullet, nextTarget, this.speed);

        // Flash visual de bounce
        const p = this.scene.add.particles(bullet.x, bullet.y, 'water-particle', {
          speed: { min: 15, max: 40 },
          lifespan: 200,
          quantity: 3,
          scale: { start: 0.8, end: 0 },
          tint: [0x44aaff, 0x88ccff],
          emitting: false,
        });
        p.explode();
        this.scene.time.delayedCall(300, () => p.destroy());

        break;
      }
    }
  }

  /** Estoura a bolha: desativa + slow AoE (só no pop final) */
  private popBubble(bubble: Phaser.Physics.Arcade.Sprite): void {
    const px = bubble.x;
    const py = bubble.y;

    this.bullets.killAndHide(bubble);
    const body = bubble.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.enable = false;

    this.spawnPopEffect(px, py);
  }

  /** Efeito visual de estouro + slow AoE no ponto de impacto */
  spawnPopEffect(x: number, y: number): void {
    const impact = this.scene.add.sprite(x, y, 'atk-bubble-shot');
    impact.setScale(1.2).setDepth(11).setAlpha(0.9);
    impact.play('anim-bubble-shot-hit');
    impact.once('animationcomplete', () => impact.destroy());

    const nearby = getSpatialGrid().queryRadius(x, y, this.slowRadius);
    for (const enemy of nearby) {
      (enemy as Phaser.Physics.Arcade.Sprite).setTint(0x3388ff);
      this.scene.time.delayedCall(this.slowDurationMs, () => {
        if (enemy.active) (enemy as Phaser.Physics.Arcade.Sprite).clearTint();
      });

      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.scale(this.slowVelocityScale);
      }
    }
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  upgrade(): void {
    this.level++;
    this.damage += 4;
    if (this.level % 3 === 0) {
      this.bubblesPerBurst++;
    }
    if (this.level % 4 === 0) {
      this.maxChains++;
    }
    this.cooldown = Math.max(600, this.cooldown - 60);
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
