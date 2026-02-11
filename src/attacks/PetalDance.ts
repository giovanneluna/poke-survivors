import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Petal Dance: dança de pétalas 360° que expande em espiral ao redor do jogador.
 * Venusaur tier (minForm: stage2).
 * Raio cresce de 30 a maxRadius ao longo da duração, danificando todos dentro do raio.
 */
export class PetalDance implements Attack {
  readonly type = 'petalDance' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private maxRadius = 120;
  private duration = 4000;

  /** Sprite ativo da dança atual (null quando em cooldown) */
  private activeSprite: Phaser.GameObjects.Sprite | null = null;
  private tickEvent: Phaser.Time.TimerEvent | null = null;
  private currentRadius = 30;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.petalDance.baseDamage;
    this.cooldown = ATTACKS.petalDance.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.dance(),
    });
  }

  private dance(): void {
    const startRadius = 30;
    this.currentRadius = startRadius;

    // Sprite visual da dança
    const sprite = this.scene.add.sprite(this.player.x, this.player.y, 'atk-petal-dance');
    sprite.setScale(0.5).setDepth(9).setAlpha(0.8);
    sprite.play('anim-petal-dance');
    this.activeSprite = sprite;

    // Tween: escala cresce de 0.5 a 2.5 (radius visual match)
    this.scene.tweens.add({
      targets: sprite,
      scale: 2.5,
      alpha: { from: 0.8, to: 0.5 },
      duration: this.duration,
      ease: 'Sine.easeOut',
    });

    // Partículas de pétalas
    let petalEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    if (shouldShowVfx()) {
      petalEmitter = this.scene.add.particles(this.player.x, this.player.y, 'fire-particle', {
        speed: { min: 20, max: 80 },
        lifespan: 600,
        quantity: 2,
        frequency: 100,
        scale: { start: 1.5, end: 0 },
        angle: { min: 0, max: 360 },
        tint: [0xff88aa, 0xff66cc, 0xffaadd],
      });
    }

    // Tick de dano: 200ms, danifica todos no raio atual
    let elapsed = 0;
    const radiusGrowthRate = (this.maxRadius - startRadius) / this.duration;

    this.tickEvent = this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        elapsed += 200;
        this.currentRadius = startRadius + radiusGrowthRate * elapsed;

        const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.currentRadius);

        for (const enemy of enemies) {
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }
        }

        if (elapsed >= this.duration) {
          cleanup();
        }
      },
    });

    let cleaned = false;
    const cleanup = (): void => {
      if (cleaned) return;
      cleaned = true;
      if (this.tickEvent) {
        this.tickEvent.destroy();
        this.tickEvent = null;
      }
      petalEmitter?.destroy();
      if (this.activeSprite && this.activeSprite.active) {
        this.scene.tweens.add({
          targets: this.activeSprite, alpha: 0, duration: 300,
          onComplete: () => {
            this.activeSprite?.destroy();
            this.activeSprite = null;
          },
        });
      }
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {
    // Sprite da dança segue o jogador
    if (this.activeSprite && this.activeSprite.active) {
      this.activeSprite.setPosition(this.player.x, this.player.y);
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.maxRadius += 15;
    this.duration += 300;
    this.cooldown = Math.max(2000, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.dance(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    if (this.tickEvent) this.tickEvent.destroy();
    if (this.activeSprite) this.activeSprite.destroy();
  }
}
