import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Ice Beam: raio de gelo no inimigo mais proximo.
 * Blastoise tier (minForm: stage2).
 * Projetil com trail de gelo e efeito de freeze visual ao destruir.
 */
export class IceBeam implements Attack {
  readonly type = 'iceBeam' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private fireId = 0;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.iceBeam.baseDamage;
    this.cooldown = ATTACKS.iceBeam.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-frost-breath',
      maxSize: 30,
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

    const sorted = enemies
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

      // Inimigo muito perto: dano direto
      if (sorted[i].dist < 20) {
        const enemy = target as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, enemy.xpValue);
          }
        }
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-frost-breath'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setActive(true).setVisible(true);
      bullet.setTexture('atk-frost-breath');
      bullet.setDepth(8);
      bullet.play('anim-frost-breath');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;

      // Rotacionar sprite na direcao do alvo (beam aponta para o inimigo)
      const angleToTarget = Math.atan2(
        target.y - this.player.y, target.x - this.player.x
      );
      bullet.setRotation(angleToTarget);

      this.scene.physics.moveToObject(bullet, target, 280);

      // Trail de particulas de gelo
      const trail = this.scene.add.particles(0, 0, 'ice-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x88ddff, 0xaaeeff, 0xffffff],
      });

      // Auto-destruir apos 3s com efeito de freeze visual
      this.scene.time.delayedCall(3000, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.createFreezeVisual(bullet.x, bullet.y);
          this.bullets.killAndHide(bullet);
          body.checkCollision.none = true;
          body.enable = false;
        }
        trail.destroy();
      });
    }
  }

  /** Efeito visual de freeze: tint azul breve nos inimigos proximos */
  private createFreezeVisual(x: number, y: number): void {
    const freezeRadius = 40;

    // Flash de gelo no ponto de impacto
    this.scene.add.particles(x, y, 'ice-particle', {
      speed: { min: 30, max: 80 },
      lifespan: 300,
      quantity: 8,
      scale: { start: 1.5, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0x88ddff, 0xaaeeff, 0xffffff],
      emitting: false,
    }).explode();

    // Tint azul temporario nos inimigos proximos (visual only)
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y);
      if (dist > freezeRadius) continue;

      enemySprite.setTint(0x88bbff);
      this.scene.time.delayedCall(500, () => {
        if (enemySprite.active) {
          enemySprite.clearTint();
        }
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
    // Ice Beam e baseado em timer, nao precisa de update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    if (this.level % 3 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(500, this.cooldown - 120);
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
