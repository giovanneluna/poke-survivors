import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';

/**
 * Leech Seed: dispara sementes que grudam no inimigo e drenam vida.
 * Projétil auto-target → ao colidir, aplica DoT + cura o jogador a cada tick.
 * Cada inimigo só pode ter 1 seed ativa por vez (uid tracking).
 * fireId protege contra stale delayedCall em bullets recicladas.
 * Bulbasaur base.
 */
export class LeechSeed implements Attack {
  readonly type = 'leechSeed' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private fireId = 0;

  private drainDps = 3;
  private healPerTick = 1;
  private drainDuration = 4000;
  private readonly tickInterval = 500;
  private readonly seededEnemies = new Map<number, Phaser.Time.TimerEvent>();

  private static readonly HIT_RADIUS = 18;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.leechSeed.baseDamage;
    this.cooldown = ATTACKS.leechSeed.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-leech-seed',
      maxSize: 12,
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

    const target = sorted[0].enemy;

    const bullet = this.bullets.get(
      this.player.x,
      this.player.y,
      'atk-leech-seed'
    ) as Phaser.Physics.Arcade.Sprite | null;

    if (!bullet) return;

    const currentFireId = ++this.fireId;
    bullet.setData('fireId', currentFireId);
    bullet.setActive(true).setVisible(true).setScale(2);
    bullet.setTexture('atk-leech-seed');
    bullet.setDepth(8);
    bullet.play('anim-leech-seed');

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(this.player.x, this.player.y);
    body.checkCollision.none = false;
    body.setCircle(10);

    this.scene.physics.moveToObject(bullet, target, 220);

    // Trail verde
    const trail = this.scene.add.particles(0, 0, 'poison-particle', {
      follow: bullet,
      speed: { min: 3, max: 12 },
      lifespan: 180,
      scale: { start: 0.8, end: 0 },
      quantity: 1,
      frequency: 60,
      tint: [0x22cc44, 0x88dd44],
    });

    // Auto-destruir após 4s (proteção stale timer)
    this.scene.time.delayedCall(4000, () => {
      if (bullet.active && bullet.getData('fireId') === currentFireId) {
        this.killBullet(bullet);
      }
      trail.destroy();
    });
  }

  private killBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
    this.bullets.killAndHide(bullet);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.enable = false;
  }

  private applySeed(enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const enemy = enemySprite as unknown as Enemy;
    const uid = (enemySprite.getData('uid') as number) ?? 0;
    if (this.seededEnemies.has(uid)) return;

    // Dano inicial de impacto
    setDamageSource(this.type);
    const killed = enemy.takeDamage(this.damage);
    if (killed) {
      this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
      return;
    }

    // Partículas visuais de "seed grudou"
    safeExplode(this.scene, enemySprite.x, enemySprite.y, 'poison-particle', {
      speed: { min: 15, max: 40 },
      lifespan: 300,
      quantity: 6,
      scale: { start: 1, end: 0 },
      tint: [0x22cc44, 0x66dd22],
    });

    let ticksRemaining = Math.floor(this.drainDuration / this.tickInterval);
    const drainTimer = this.scene.time.addEvent({
      delay: this.tickInterval,
      loop: true,
      callback: () => {
        ticksRemaining--;

        if (!enemySprite.active || ticksRemaining <= 0) {
          drainTimer.destroy();
          this.seededEnemies.delete(uid);
          return;
        }

        // Drain: dano no inimigo + heal no jogador
        setDamageSource(this.type);
        const drainKilled = enemy.takeDamage(this.drainDps);
        if (drainKilled) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          drainTimer.destroy();
          this.seededEnemies.delete(uid);
          return;
        }

        this.scene.events.emit('leech-seed-heal', this.healPerTick);

        // Partícula de drain (verde subindo do inimigo)
        safeExplode(this.scene, enemySprite.x, enemySprite.y - 10, 'poison-particle', {
          speed: { min: 10, max: 25 },
          angle: { min: 250, max: 290 },
          lifespan: 400,
          quantity: 2,
          scale: { start: 0.7, end: 0 },
          tint: [0x44ff44],
        });
      },
    });

    this.seededEnemies.set(uid, drainTimer);
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  /** Colisão manual: seed bate no inimigo → gruda e drena. */
  update(_time: number, _delta: number): void {
    const activeBullets = this.bullets.getChildren().filter(
      (b): b is Phaser.Physics.Arcade.Sprite => (b as Phaser.Physics.Arcade.Sprite).active
    );
    if (activeBullets.length === 0) return;

    const enemies = getSpatialGrid().getActiveEnemies();

    for (const bullet of activeBullets) {
      for (const enemy of enemies) {
        const dist = Phaser.Math.Distance.Between(
          bullet.x, bullet.y, enemy.x, enemy.y
        );
        if (dist > LeechSeed.HIT_RADIUS) continue;

        // Semente grudou: matar bullet e aplicar drain
        this.killBullet(bullet);
        this.applySeed(enemy);
        break;
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 2;
    this.drainDps += 1;
    this.healPerTick = Math.min(3, this.healPerTick + 0.5);
    this.drainDuration += 500;
    this.cooldown = Math.max(800, this.cooldown - 100);
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
    for (const timer of this.seededEnemies.values()) {
      timer.destroy();
    }
    this.seededEnemies.clear();
  }
}
