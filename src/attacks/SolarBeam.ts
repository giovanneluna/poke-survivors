import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Solar Beam: raio solar devastador que perfura TODOS os inimigos na linha.
 * Venusaur tier (minForm: stage2).
 * O projétil NÃO morre ao colidir — atravessa tudo (pierce infinito).
 * Usa colisão manual por distância no update() (padrão WaterPulse),
 * pois setupProjectileCollisions mata o bullet no hit.
 * collision: 'none' no AttackFactory.
 */
export class SolarBeam implements Attack {
  readonly type = 'solarBeam' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private fireId = 0;

  /** Raio de colisão centro-a-centro para considerar hit */
  private static readonly HIT_RADIUS = 24;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.solarBeam.baseDamage;
    this.cooldown = ATTACKS.solarBeam.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-solar-beam',
      maxSize: 10,
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

    // Mira no inimigo mais próximo
    const nearest = activeEnemies.reduce((best, e) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      const bd = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
      return d < bd ? e : best;
    });

    const angle = Math.atan2(
      nearest.y - this.player.y,
      nearest.x - this.player.x
    );

    const bullet = this.bullets.get(
      this.player.x,
      this.player.y,
      'atk-solar-beam'
    ) as Phaser.Physics.Arcade.Sprite | null;

    if (!bullet) return;

    const currentFireId = ++this.fireId;
    bullet.setData('fireId', currentFireId);
    // Set para rastrear UIDs de inimigos já atingidos por este disparo (cooldown per-enemy)
    bullet.setData('hitSet', new Set<number>());
    bullet.setActive(true).setVisible(true).setScale(1.5);
    bullet.setDepth(8);
    bullet.setRotation(angle);
    bullet.play('anim-solar-beam');

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(this.player.x, this.player.y);
    body.setSize(20, 100);

    // Mover na direção calculada
    const speed = 350;
    body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Trail de partículas verdes brilhantes
    const trail = this.scene.add.particles(0, 0, 'fire-particle', {
      follow: bullet,
      speed: { min: 5, max: 20 },
      lifespan: 200,
      scale: { start: 1, end: 0 },
      quantity: 1,
      frequency: 50,
      tint: [0x66dd44, 0xaaff66],
    });

    // Auto-destruir após lifetime (stale protection via fireId)
    this.scene.time.delayedCall(2500, () => {
      if (bullet.active && bullet.getData('fireId') === currentFireId) {
        this.killBullet(bullet);
      }
      trail.destroy();
    });
  }

  /** Colisão manual pierce: checa distância centro-a-centro a cada frame.
   *  Cada inimigo só pode ser atingido UMA VEZ por disparo (hitSet). */
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
        if (dist > SolarBeam.HIT_RADIUS) continue;

        // Hit! Marcar como atingido, aplicar dano, NÃO matar o bullet
        hitSet.add(uid);

        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
        }

        // Flash verde de hit
        this.scene.add.particles(enemy.x, enemy.y, 'fire-particle', {
          speed: { min: 20, max: 50 },
          lifespan: 200,
          quantity: 4,
          scale: { start: 1, end: 0 },
          tint: [0x66dd44, 0xaaff66],
          emitting: false,
        }).explode();
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
    this.damage += 10;
    this.cooldown = Math.max(2500, this.cooldown - 200);
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
