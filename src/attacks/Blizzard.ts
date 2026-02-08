import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Blizzard: evolucao do Ice Beam.
 * Projeteis homing de gelo que NUNCA erram, perseguindo inimigos.
 * No hit/timeout: burst AoE de freeze (slow 50% por 1.5s em inimigos proximos).
 * Blastoise tier (minForm: stage2).
 */
export class Blizzard implements Attack {
  readonly type = 'blizzard' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 2;
  private speed = 200;
  private fireId = 0;

  private static readonly FREEZE_RADIUS = 50;
  private static readonly FREEZE_SLOW_MULTIPLIER = 0.5;
  private static readonly FREEZE_DURATION_MS = 1500;
  private static readonly LIFETIME_MS = 4000;
  private static readonly HIT_DISTANCE = 20;
  private static readonly ICE_TINTS: readonly number[] = [0x88ddff, 0xaaeeff, 0xffffff] as const;

  /** Rastreamento de projeteis homing ativos (sprite -> dados de tracking) */
  private readonly activeHomingBullets: Map<number, {
    bullet: Phaser.Physics.Arcade.Sprite;
    trail: Phaser.GameObjects.Particles.ParticleEmitter;
    alive: boolean;
    spawnTime: number;
  }> = new Map();

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.blizzard.baseDamage;
    this.cooldown = ATTACKS.blizzard.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-ice-range',
      maxSize: 40,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.launch(),
    });
  }

  private launch(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Seleciona alvos ALEATORIOS (nao mais proximos)
    const shuffled = Phaser.Utils.Array.Shuffle([...enemies]);
    const count = Math.min(this.projectileCount + this.player.stats.projectileBonus, shuffled.length);

    for (let i = 0; i < count; i++) {
      const target = shuffled[i];

      this.scene.time.delayedCall(i * 80, () => {
        if (!this.player.active) return;

        const bullet = this.bullets.get(
          this.player.x,
          this.player.y,
          'atk-ice-range'
        ) as Phaser.Physics.Arcade.Sprite | null;

        if (!bullet) return;

        const currentFireId = ++this.fireId;
        bullet.setData('fireId', currentFireId);
        bullet.setActive(true).setVisible(true).setScale(0.9);
        bullet.setDepth(8);
        bullet.play('anim-ice-range');

        const body = bullet.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(this.player.x, this.player.y);
        body.checkCollision.none = false;

        // Velocidade inicial em direcao ao alvo
        const angleToTarget = Math.atan2(
          target.y - this.player.y, target.x - this.player.x
        );
        body.setVelocity(
          Math.cos(angleToTarget) * this.speed,
          Math.sin(angleToTarget) * this.speed
        );
        bullet.setRotation(angleToTarget);

        // Trail de particulas de gelo
        const trail = this.scene.add.particles(0, 0, 'ice-particle', {
          follow: bullet,
          speed: { min: 5, max: 20 },
          lifespan: 200,
          scale: { start: 1, end: 0 },
          quantity: 1,
          frequency: 40,
          tint: Blizzard.ICE_TINTS as unknown as number[],
        });

        // Registra no tracking de homing
        this.activeHomingBullets.set(currentFireId, {
          bullet,
          trail,
          alive: true,
          spawnTime: this.scene.time.now,
        });

        // Safety timeout
        this.scene.time.delayedCall(Blizzard.LIFETIME_MS, () => {
          const tracking = this.activeHomingBullets.get(currentFireId);
          if (tracking?.alive) {
            // Timeout: freeze burst no ponto atual
            this.freezeBurst(bullet.x, bullet.y);
            this.cleanupBullet(currentFireId);
          }
        });
      });
    }
  }

  /**
   * CRITICO: override de update() para logica de homing em cada frame.
   * Para cada projetil ativo, ajusta velocidade em direcao ao inimigo mais proximo.
   */
  update(_time: number, _delta: number): void {
    for (const [fireId, tracking] of this.activeHomingBullets) {
      if (!tracking.alive || !tracking.bullet.active) {
        this.cleanupBullet(fireId);
        continue;
      }

      const bullet = tracking.bullet;

      // Encontra inimigo mais proximo ao projetil
      const enemies = this.enemyGroup.getChildren().filter(
        (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
      );

      if (enemies.length === 0) continue;

      const nearest = enemies.reduce((best, e) => {
        const dBest = Phaser.Math.Distance.Between(bullet.x, bullet.y, best.x, best.y);
        const dCurr = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
        return dCurr < dBest ? e : best;
      });

      // Ajusta velocidade em direcao ao inimigo
      const angleToTarget = Math.atan2(
        nearest.y - bullet.y, nearest.x - bullet.x
      );

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angleToTarget) * this.speed,
        Math.sin(angleToTarget) * this.speed
      );
      bullet.setRotation(angleToTarget);

      // Check hit
      const dist = Phaser.Math.Distance.Between(
        bullet.x, bullet.y, nearest.x, nearest.y
      );

      if (dist < Blizzard.HIT_DISTANCE) {
        const enemy = nearest as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', nearest.x, nearest.y, enemy.xpValue);
          }
        }

        // Impacto visual
        this.scene.add.particles(bullet.x, bullet.y, 'ice-particle', {
          speed: { min: 30, max: 80 },
          lifespan: 200,
          quantity: 8,
          scale: { start: 1.5, end: 0 },
          tint: Blizzard.ICE_TINTS as unknown as number[],
          emitting: false,
        }).explode();

        // Freeze burst AoE no ponto de impacto
        this.freezeBurst(bullet.x, bullet.y);
        this.cleanupBullet(fireId);
      }
    }
  }

  /**
   * Burst de freeze AoE: flash de circulo azul, slow 50% por 1.5s em inimigos proximos.
   */
  private freezeBurst(x: number, y: number): void {
    // Visual: circulo azul expandindo
    const circle = this.scene.add.circle(x, y, 10, 0x88ddff, 0.6).setDepth(12);
    this.scene.tweens.add({
      targets: circle,
      scaleX: Blizzard.FREEZE_RADIUS / 10,
      scaleY: Blizzard.FREEZE_RADIUS / 10,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy(),
    });

    // Particulas de gelo explosivas
    this.scene.add.particles(x, y, 'ice-particle', {
      speed: { min: 50, max: 120 },
      lifespan: 300,
      quantity: 10,
      scale: { start: 1.5, end: 0 },
      tint: Blizzard.ICE_TINTS as unknown as number[],
      emitting: false,
    }).explode();

    // Slow em inimigos no raio
    const nearbyEnemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of nearbyEnemies) {
      const dist = Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y);
      if (dist > Blizzard.FREEZE_RADIUS) continue;

      // Tint azul de freeze
      enemySprite.setTint(0x88ddff);

      // Reduz velocidade em 50%
      const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.scale(Blizzard.FREEZE_SLOW_MULTIPLIER);
      }

      // Remove tint apos duracao
      this.scene.time.delayedCall(Blizzard.FREEZE_DURATION_MS, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  /**
   * Limpa um projetil homing do tracking e destroi visuais.
   */
  private cleanupBullet(fireId: number): void {
    const tracking = this.activeHomingBullets.get(fireId);
    if (!tracking) return;

    tracking.alive = false;

    if (tracking.bullet.active) {
      this.bullets.killAndHide(tracking.bullet);
      const body = tracking.bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true;
      body.enable = false;
    }

    tracking.trail.destroy();
    this.activeHomingBullets.delete(fireId);
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
      callback: () => this.launch(),
    });
  }

  destroy(): void {
    this.timer.destroy();

    // Limpa todos os projeteis homing ativos
    for (const [fireId] of this.activeHomingBullets) {
      this.cleanupBullet(fireId);
    }

    this.bullets.destroy(true);
  }
}
