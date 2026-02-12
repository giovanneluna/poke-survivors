import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

/**
 * Flash Cannon: tiro piercing dos canhoes do Blastoise.
 * Blastoise tier (minForm: stage2).
 * Projetil procedural (circulo branco/prata) que atravessa multiplos inimigos.
 * Track pierceCount via bullet.data — CollisionSystem respeita este valor.
 */
export class FlashCannon implements Attack {
  readonly type = 'flashCannon' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private maxPierce = 3;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.flashCannon.baseDamage;
    this.cooldown = ATTACKS.flashCannon.baseCooldown;

    // Gerar textura procedural do cannon blast (circulo branco/prata)
    this.generateTexture();

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-flash-cannon',
      maxSize: 20,
    });

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  private generateTexture(): void {
    if (this.scene.textures.exists('atk-flash-cannon')) return;

    const gfx = this.scene.add.graphics();
    // Brilho externo
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillCircle(12, 12, 12);
    // Nucleo prata
    gfx.fillStyle(0xdddddd, 0.9);
    gfx.fillCircle(12, 12, 8);
    // Centro branco brilhante
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(12, 12, 4);
    gfx.generateTexture('atk-flash-cannon', 24, 24);
    gfx.destroy();
  }

  private fire(): void {
    const aimTarget = this.player.getAimTarget();

    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (!aimTarget && activeEnemies.length === 0) return;

    const sorted = aimTarget ? [] : activeEnemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    const totalCount = this.projectileCount + this.player.stats.projectileBonus;
    const count = aimTarget ? totalCount : Math.min(totalCount, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = aimTarget ? null : sorted[i].enemy;

      // Inimigo muito perto: dano direto (auto-aim only)
      if (!aimTarget && sorted[i].dist < 20) {
        if (typeof target!.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = target!.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target!.x, target!.y, target!.xpValue);
          }
        }
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-flash-cannon'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setData('pierceCount', 0);
      bullet.setData('maxPierce', this.maxPierce);
      bullet.setData('piercing', true);
      bullet.setActive(true).setVisible(true).setScale(1.2);
      bullet.setDepth(8);

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;

      if (aimTarget) {
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
        const aimAngle = Math.atan2(aimTarget.y - this.player.y, aimTarget.x - this.player.x);
        body.setVelocity(
          Math.cos(aimAngle + spread) * 350,
          Math.sin(aimAngle + spread) * 350
        );
      } else {
        this.scene.physics.moveToObject(bullet, target!, 350);
      }

      // Trail de particulas brancas
      let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
      if (shouldShowVfx()) {
        trail = this.scene.add.particles(0, 0, 'water-particle', {
          follow: bullet,
          speed: { min: 5, max: 20 },
          lifespan: 150,
          scale: { start: 0.8, end: 0 },
          quantity: getVfxQuantity(1),
          frequency: 40,
          tint: [0xdddddd, 0xffffff, 0xcccccc],
        });
      }

      // Auto-destruir apos 2.5s
      this.scene.time.delayedCall(2500, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          // Flash de impacto ao expirar
          safeExplode(this.scene, bullet.x, bullet.y, 'water-particle', {
            speed: { min: 30, max: 60 },
            lifespan: 200,
            quantity: 5,
            scale: { start: 1, end: 0 },
            tint: [0xffffff, 0xdddddd],
          });

          this.bullets.killAndHide(bullet);
          body.checkCollision.none = true;
          body.enable = false;
        }
        trail?.destroy();
      });
    }
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  update(_time: number, _delta: number): void {
    // Flash Cannon e baseado em timer
  }

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.maxPierce++;
    if (this.level % 3 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(1500, this.cooldown - 130);
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
