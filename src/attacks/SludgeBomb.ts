import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';

/**
 * Sludge Bomb: projétil tóxico que explode em AoE ao atingir um inimigo.
 * Ivysaur tier (minForm: stage1).
 * Explosão aplica dano em área com distance falloff (60% do dano base).
 */
export class SludgeBomb implements Attack {
  readonly type = 'sludgeBomb' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private fireId = 0;
  private aoeRadius = 50;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.sludgeBomb.baseDamage;
    this.cooldown = ATTACKS.sludgeBomb.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-poison-range',
      maxSize: 40,
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

      // Inimigo muito perto: dano direto + explosão
      if (sorted[i].dist < 20) {
        if (typeof target.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = target.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, target.xpValue);
          }
        }
        this.explode(target.x, target.y);
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-poison-range'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setData('onHit', (hx: number, hy: number) => this.explode(hx, hy));
      bullet.setActive(true).setVisible(true).setScale(1.5);
      bullet.setDepth(8);

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;
      body.setCircle(6, 2, 2);

      this.scene.physics.moveToObject(bullet, target, 250);

      // Trail de partículas roxas
      const trail = this.scene.add.particles(0, 0, 'fire-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x9944cc, 0xaa55dd],
      });

      // Auto-destruir após lifetime (stale protection via fireId)
      this.scene.time.delayedCall(2000, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.bullets.killAndHide(bullet);
          body.checkCollision.none = true;
          body.enable = false;
        }
        trail.destroy();
      });
    }
  }

  /** Explosão AoE: sprite visual + dano em raio com distance falloff.
   *  Público para ser chamado via AttackFactory.getOnHit (pattern Bubble/Scald). */
  explode(hx: number, hy: number): void {
    // Sprite de explosão
    const explosion = this.scene.add.sprite(hx, hy, 'atk-sludge-wave');
    explosion.setScale(1.5).setDepth(11).setAlpha(0.9);
    explosion.play('anim-sludge-wave');
    explosion.once('animationcomplete', () => explosion.destroy());

    // Partículas roxas de impacto
    safeExplode(this.scene, hx, hy, 'fire-particle', {
      speed: { min: 30, max: 80 },
      lifespan: 300,
      quantity: 10,
      scale: { start: 1.5, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0x9944cc, 0xaa55dd, 0x7733aa],
    });

    // Dano AoE: 60% do dano base com distance falloff
    const enemies = getSpatialGrid().queryRadius(hx, hy, this.aoeRadius);

    for (const enemy of enemies) {
      if (typeof enemy.takeDamage === 'function') {
        const dist = Phaser.Math.Distance.Between(hx, hy, enemy.x, enemy.y);
        const falloff = 1 - (dist / this.aoeRadius) * 0.4;
        setDamageSource(this.type);
        const killed = enemy.takeDamage(Math.floor(this.damage * 0.6 * falloff));
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  update(_time: number, _delta: number): void {
    // Timer-based, sem lógica per-frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.aoeRadius += 5;
    this.cooldown = Math.max(1200, this.cooldown - 100);
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
