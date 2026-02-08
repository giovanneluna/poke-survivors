import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Giga Drain: área de drenagem de vida ao redor do jogador.
 * Venusaur tier (minForm: stage2).
 * Danifica inimigos no raio E cura o jogador por cada inimigo atingido.
 * Emite 'player-heal' para integrar com o sistema de HP do GameScene.
 */
export class GigaDrain implements Attack {
  readonly type = 'gigaDrain' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 80;
  private duration = 2000;
  private healAmount = 2;

  /** Sprite ativo do drain atual (null quando em cooldown) */
  private activeSprite: Phaser.GameObjects.Sprite | null = null;
  private tickEvent: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.gigaDrain.baseDamage;
    this.cooldown = ATTACKS.gigaDrain.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.drain(),
    });
  }

  private drain(): void {
    // Sprite visual: leech-life anim no jogador
    const sprite = this.scene.add.sprite(this.player.x, this.player.y, 'atk-leech-life');
    sprite.setScale(1.2).setDepth(9).setAlpha(0.8);
    sprite.play('anim-leech-life');
    this.activeSprite = sprite;

    // Tween de escala suave
    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 0.8, to: 1.5 },
      alpha: { from: 0.9, to: 0.5 },
      duration: this.duration,
      ease: 'Sine.easeInOut',
    });

    // Tick de dano + heal: 300ms
    let elapsed = 0;
    this.tickEvent = this.scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        elapsed += 300;

        const enemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        let hitCount = 0;
        for (const enemySprite of enemies) {
          const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, enemySprite.x, enemySprite.y
          );
          if (dist > this.radius) continue;

          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            hitCount++;
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
            }
          }
        }

        // Cura por cada inimigo atingido
        if (hitCount > 0) {
          for (let h = 0; h < hitCount; h++) {
            this.scene.events.emit('player-heal', this.healAmount);
          }

          // Partículas verdes de cura
          this.scene.add.particles(this.player.x, this.player.y, 'fire-particle', {
            speed: { min: 10, max: 40 },
            lifespan: 400,
            quantity: hitCount * 2,
            scale: { start: 1.5, end: 0 },
            angle: { min: 220, max: 320 },
            tint: [0x44ff44, 0x88ff88, 0x22cc22],
            emitting: false,
          }).explode();
        }

        if (elapsed >= this.duration) {
          cleanup();
        }
      },
    });

    const cleanup = (): void => {
      if (this.tickEvent) {
        this.tickEvent.destroy();
        this.tickEvent = null;
      }
      if (this.activeSprite) {
        this.scene.tweens.add({
          targets: this.activeSprite,
          alpha: 0,
          scale: 0.5,
          duration: 300,
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
    // Sprite segue o jogador
    if (this.activeSprite && this.activeSprite.active) {
      this.activeSprite.setPosition(this.player.x, this.player.y);
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.radius += 10;
    this.healAmount += 1;
    this.cooldown = Math.max(2500, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.drain(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    if (this.tickEvent) this.tickEvent.destroy();
    if (this.activeSprite) this.activeSprite.destroy();
  }
}
