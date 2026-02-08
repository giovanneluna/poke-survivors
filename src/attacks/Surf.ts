import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Surf: onda 360° que empurra inimigos para fora.
 * Blastoise tier (minForm: stage2).
 * Onda expansiva centrada no player com push outward.
 */
export class Surf implements Attack {
  readonly type = 'surf' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private maxRadius = 150;
  private pushForce = 200;
  private readonly waveDuration = 1500;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.surf.baseDamage;
    this.cooldown = ATTACKS.surf.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.wave(),
    });
  }

  private wave(): void {
    const cx = this.player.x;
    const cy = this.player.y;

    // Visual: sprite de surf animado no centro
    const surfSprite = this.scene.add.sprite(cx, cy, 'atk-surf');
    surfSprite.setScale(1.5).setDepth(9).setAlpha(0.8);
    surfSprite.play('anim-surf');

    // Anel visual expansivo (circle outline)
    const ring = this.scene.add.graphics();
    ring.setDepth(8);

    // Tween do anel e sprite
    let currentRadius = 30;
    this.scene.tweens.add({
      targets: surfSprite,
      scale: { from: 1.5, to: this.maxRadius / 40 },
      alpha: { from: 0.8, to: 0.2 },
      duration: this.waveDuration,
      ease: 'Sine.easeOut',
      onComplete: () => surfSprite.destroy(),
    });

    // Particulas de agua em 8 direcoes expandindo
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const angleDeg = Phaser.Math.RadToDeg(angle);
      this.scene.add.particles(cx, cy, 'water-particle', {
        speed: { min: 100, max: 250 },
        angle: { min: angleDeg - 15, max: angleDeg + 15 },
        lifespan: this.waveDuration * 0.7,
        quantity: 3,
        scale: { start: 2, end: 0 },
        tint: [0x3388ff, 0x44aaff, 0x66ccff],
        emitting: false,
      }).explode();
    }

    // Tick de dano + push a cada 200ms
    const hitSet = new Set<number>();
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        elapsed += 200;
        const progress = Math.min(elapsed / this.waveDuration, 1);
        currentRadius = 30 + (this.maxRadius - 30) * progress;

        // Atualizar anel visual
        ring.clear();
        ring.lineStyle(3, 0x3388ff, 0.5 * (1 - progress));
        ring.strokeCircle(cx, cy, currentRadius);

        if (elapsed >= this.waveDuration) {
          cleanup();
          return;
        }

        // Inner edge do anel (nao acertar no centro depois que a onda passou)
        const innerRadius = Math.max(0, currentRadius - 40);

        const enemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        for (const enemySprite of enemies) {
          const dist = Phaser.Math.Distance.Between(cx, cy, enemySprite.x, enemySprite.y);
          if (dist > currentRadius || dist < innerRadius) continue;

          const uid = enemySprite.getData('uid') ?? 0;

          // Push outward (sempre aplica)
          const angleToEnemy = Math.atan2(enemySprite.y - cy, enemySprite.x - cx);
          const body = enemySprite.body as Phaser.Physics.Arcade.Body;
          body.velocity.x += Math.cos(angleToEnemy) * this.pushForce;
          body.velocity.y += Math.sin(angleToEnemy) * this.pushForce;

          // Dano (apenas uma vez por inimigo)
          if (hitSet.has(uid)) continue;
          hitSet.add(uid);

          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
            }
          }
        }
      },
    });

    const cleanup = () => {
      tickEvent.destroy();
      ring.destroy();
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.waveDuration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.maxRadius += 15;
    this.pushForce += 30;
    this.cooldown = Math.max(3500, this.cooldown - 400);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.wave(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
