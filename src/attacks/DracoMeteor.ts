import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Draco Meteor: chuva de meteoros apocalíptica.
 * PRIME attack - Charizard exclusivo.
 * Meteoros caem do céu em posições aleatórias ao redor do player,
 * cada um com explosão AoE devastadora.
 */
export class DracoMeteor implements Attack {
  readonly type = 'dracoMeteor' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private meteorCount = 5;
  private impactRadius = 50;
  private spreadRange = 200;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.dracoMeteor.baseDamage;
    this.cooldown = ATTACKS.dracoMeteor.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.rain(),
    });
  }

  private rain(): void {
    // Texto épico
    const txt = this.scene.add.text(this.player.x, this.player.y - 40, 'DRACO METEOR!', {
      fontSize: '16px', color: '#cc88ff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 30, alpha: 0, duration: 1000,
      onComplete: () => txt.destroy(),
    });

    for (let i = 0; i < this.meteorCount; i++) {
      // Posição de impacto aleatória ao redor do player
      const targetX = this.player.x + Phaser.Math.Between(-this.spreadRange, this.spreadRange);
      const targetY = this.player.y + Phaser.Math.Between(-this.spreadRange, this.spreadRange);

      this.scene.time.delayedCall(i * 200, () => {
        // Shadow/alvo no chão
        const shadow = this.scene.add.circle(targetX, targetY, this.impactRadius * 0.5, 0x7744ff, 0.2);
        shadow.setDepth(5);
        this.scene.tweens.add({
          targets: shadow, alpha: 0.5, duration: 400,
        });

        // Meteoro caindo (sprite animado vindo de cima)
        const meteor = this.scene.add.sprite(targetX - 60, targetY - 120, 'atk-draco-meteor');
        meteor.setScale(1.5).setDepth(11).setAlpha(0.9);
        meteor.play('anim-draco-meteor');
        this.scene.tweens.add({
          targets: meteor,
          x: targetX, y: targetY,
          scale: 1.2, alpha: 1,
          duration: 400,
          ease: 'Quad.easeIn',
          onComplete: () => {
            meteor.destroy();
            shadow.destroy();

            // Explosão de impacto
            this.scene.add.particles(targetX, targetY, 'dragon-particle', {
              speed: { min: 80, max: 200 }, lifespan: 500, quantity: 20,
              scale: { start: 3, end: 0 }, angle: { min: 0, max: 360 },
              tint: [0x7744ff, 0x9966ff, 0xcc88ff, 0xff4400],
              emitting: false,
            }).explode();

            this.scene.add.particles(targetX, targetY, 'fire-particle', {
              speed: { min: 40, max: 120 }, lifespan: 350, quantity: 10,
              scale: { start: 2, end: 0 },
              tint: [0xff4400, 0xff6600],
              emitting: false,
            }).explode();

            // Crater visual
            const crater = this.scene.add.circle(targetX, targetY, this.impactRadius, 0x332244, 0.3);
            crater.setDepth(4);
            this.scene.tweens.add({
              targets: crater, alpha: 0, duration: 1500,
              onComplete: () => crater.destroy(),
            });

            // Camera shake mini
            this.scene.cameras.main.shake(100, 0.005);

            // Dano AoE
            const enemies = this.enemyGroup.getChildren().filter(
              (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
            );

            for (const enemySprite of enemies) {
              const dist = Phaser.Math.Distance.Between(targetX, targetY, enemySprite.x, enemySprite.y);
              if (dist > this.impactRadius) continue;

              const enemy = enemySprite as unknown as Enemy;
              if (typeof enemy.takeDamage === 'function') {
                // Dano máximo no centro, diminui com distância
                const falloff = 1 - (dist / this.impactRadius) * 0.5;
                setDamageSource(this.type);
                const killed = enemy.takeDamage(Math.floor(this.damage * falloff));
                if (killed) {
                  this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
                }
              }
            }
          },
        });
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 10;
    this.meteorCount += 1;
    this.impactRadius += 5;
    this.cooldown = Math.max(6000, this.cooldown - 500);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.rain(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
