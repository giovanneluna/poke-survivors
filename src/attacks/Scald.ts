import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Scald: evolucao do Water Gun.
 * Projeteis de agua que EXPLODEM no impacto, causando dano AoE com vapor (steam).
 * Equivalente ao Inferno do Charmander, mas com tematica aquatica.
 */
export class Scald implements Attack {
  readonly type = 'scald' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 3;
  private readonly explosionRadius = 55;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.scald.baseDamage;
    this.cooldown = ATTACKS.scald.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-water-melee',
      maxSize: 50,
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
        dist: Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y),
      }))
      .sort((a, b) => a.dist - b.dist);

    const count = Math.min(this.projectileCount + this.player.stats.projectileBonus, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = sorted[i].enemy;

      // Dano direto se inimigo esta muito perto
      if (sorted[i].dist < 20) {
        if (typeof target.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = target.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, target.xpValue);
          }
        }
        this.explodeAt(target.x, target.y);
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x, this.player.y, 'atk-water-melee'
      ) as Phaser.Physics.Arcade.Sprite | null;
      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setActive(true).setVisible(true).setScale(0.8).setDepth(8);
      bullet.play('anim-water-melee');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;

      this.scene.physics.moveToObject(bullet, target, 280);

      // Trail de particulas de vapor
      let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
      if (shouldShowVfx()) {
        trail = this.scene.add.particles(0, 0, 'water-particle', {
          follow: bullet,
          speed: { min: 10, max: 30 },
          lifespan: 250,
          scale: { start: 1.5, end: 0 },
          quantity: 2,
          frequency: 40,
          tint: [0x88ccff, 0xaaddff, 0xffffff],
        });
      }

      // Auto-destruir apos 3s
      this.scene.time.delayedCall(3000, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.bullets.killAndHide(bullet);
          body.checkCollision.none = true;
          body.enable = false;
        }
        trail?.destroy();
      });
    }
  }

  explodeAt(x: number, y: number): void {
    // Efeito visual de impacto com sprite de agua
    const explosion = this.scene.add.sprite(x, y, 'atk-water-hit');
    explosion.setScale(2.5).setDepth(10);
    explosion.play('anim-water-hit');
    explosion.once('animationcomplete', () => explosion.destroy());

    // Particulas de vapor (steam — auto-destroy após lifespan)
    const steamParticles = this.scene.add.particles(x, y, 'water-particle', {
      speed: { min: 40, max: 120 },
      lifespan: 350,
      quantity: 12,
      scale: { start: 2, end: 0 },
      tint: [0x88ccff, 0xaaddff, 0xffffff],
      emitting: false,
    });
    steamParticles.explode();
    this.scene.time.delayedCall(450, () => steamParticles.destroy());

    // Dano AoE (60% do dano base)
    const enemies = getSpatialGrid().queryRadius(x, y, this.explosionRadius);
    for (const enemy of enemies) {
      setDamageSource(this.type);
      const killed = enemy.takeDamage(Math.floor(this.damage * 0.6));
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }
    }
  }

  getDamage(): number { return this.damage; }
  getBullets(): ArcadeGroup { return this.bullets; }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    if (this.level % 2 === 0) this.projectileCount++;
    this.cooldown = Math.max(400, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
