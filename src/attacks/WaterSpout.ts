import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Water Spout: evolucao do Whirlpool (area -> projetil).
 * Blastoise dispara 2 cannon blasts simultaneos na direcao do movimento.
 * No impacto: cria mini whirlpool remnant (raio 40, 1s, tick 8 dmg).
 * Blastoise tier (minForm: stage2).
 */
export class WaterSpout implements Attack {
  readonly type = 'waterSpout' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 2;
  private fireId = 0;

  private static readonly SPEED = 250;
  private static readonly WHIRLPOOL_RADIUS = 40;
  private static readonly WHIRLPOOL_DURATION_MS = 1000;
  private static readonly WHIRLPOOL_TICK_MS = 250;
  private static readonly WHIRLPOOL_TICK_DMG = 8;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.waterSpout.baseDamage;
    this.cooldown = ATTACKS.waterSpout.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-origin-pulse',
      maxSize: 40,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const baseAngle = Math.atan2(dir.y, dir.x);

    // Dispara N cannon blasts com leve spread entre eles
    const totalProjectiles = this.projectileCount + this.player.stats.projectileBonus;
    for (let i = 0; i < totalProjectiles; i++) {
      // Spread angular: distribute simetricamente em torno do angulo base
      const spreadStep = 0.15; // ~8.6 graus entre cada
      const offset = (i - (totalProjectiles - 1) / 2) * spreadStep;
      const angle = baseAngle + offset;

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-origin-pulse'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setData('hasHit', false);
      bullet.setActive(true).setVisible(true).setScale(1);
      bullet.setDepth(8);
      bullet.play('anim-origin-pulse');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;
      body.setVelocity(
        Math.cos(angle) * WaterSpout.SPEED,
        Math.sin(angle) * WaterSpout.SPEED
      );

      // Rotacionar sprite na direcao do tiro
      bullet.setRotation(angle);

      // Trail de particulas pesadas
      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bullet,
        speed: { min: 10, max: 40 },
        lifespan: 250,
        scale: { start: 2, end: 0 },
        quantity: 2,
        frequency: 40,
        tint: [0x0044ff, 0x3388ff],
      });

      // Auto-destruir apos 3s
      this.scene.time.delayedCall(3000, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          // Spawn whirlpool remnant no ponto de timeout tambem
          if (!bullet.getData('hasHit')) {
            this.spawnWhirlpoolRemnant(bullet.x, bullet.y);
          }
          this.killBullet(bullet);
        }
        trail.destroy();
      });
    }
  }

  /**
   * Check de colisao manual para spawnar whirlpool ao impactar.
   * O projetil e destruido no primeiro hit (nao piercing).
   */
  update(_time: number, _delta: number): void {
    const activeBullets = this.bullets.getChildren().filter(
      (b): b is Phaser.Physics.Arcade.Sprite => (b as Phaser.Physics.Arcade.Sprite).active
    );

    for (const bullet of activeBullets) {
      if (bullet.getData('hasHit')) continue;

      const enemies = getSpatialGrid().queryRadius(bullet.x, bullet.y, 24);

      for (const enemy of enemies) {
        // Hit direto
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
        }

        // Impacto visual (auto-destroy)
        const impactPart = this.scene.add.particles(bullet.x, bullet.y, 'water-particle', {
          speed: { min: 40, max: 100 },
          lifespan: 250,
          quantity: 8,
          scale: { start: 2, end: 0 },
          tint: [0x0044ff, 0x3388ff, 0x66ccff],
          emitting: false,
        });
        impactPart.explode();
        this.scene.time.delayedCall(350, () => impactPart.destroy());

        // Marca como atingido e spawna whirlpool
        bullet.setData('hasHit', true);
        this.spawnWhirlpoolRemnant(bullet.x, bullet.y);
        this.killBullet(bullet);
        break;
      }
    }
  }

  /**
   * Cria mini whirlpool residual: raio 40, 1s de duracao, tick 8 dmg.
   * Efeito visual de circulo azul pulsante que encolhe.
   */
  private spawnWhirlpoolRemnant(x: number, y: number): void {
    const radius = WaterSpout.WHIRLPOOL_RADIUS;
    const duration = WaterSpout.WHIRLPOOL_DURATION_MS;
    const tickMs = WaterSpout.WHIRLPOOL_TICK_MS;
    const tickDmg = WaterSpout.WHIRLPOOL_TICK_DMG;
    const totalTicks = Math.floor(duration / tickMs);

    // Visual: circulo pulsante
    const vortex = this.scene.add.circle(x, y, radius, 0x3388ff, 0.3).setDepth(3);

    // Particulas rotativas
    const vortexParticles = this.scene.add.particles(x, y, 'water-particle', {
      speed: { min: 20, max: 50 },
      lifespan: 300,
      scale: { start: 1.5, end: 0 },
      quantity: 1,
      frequency: 100,
      tint: [0x0044ff, 0x3388ff, 0x44aaff],
      angle: { min: 0, max: 360 },
    });

    let tickCount = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: tickMs,
      repeat: totalTicks - 1,
      callback: () => {
        tickCount++;

        // Dano AoE
        const nearbyEnemies = getSpatialGrid().queryRadius(x, y, radius);

        for (const enemy of nearbyEnemies) {
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(tickDmg);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }
        }

        if (tickCount >= totalTicks) {
          tickEvent.destroy();
        }
      },
    });

    // Fade out visual
    this.scene.tweens.add({
      targets: vortex,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration,
      onComplete: () => {
        vortex.destroy();
        vortexParticles.destroy();
      },
    });
  }

  private killBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
    this.bullets.killAndHide(bullet);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
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
    this.damage += 6;
    if (this.level % 2 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(500, this.cooldown - 100);
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
