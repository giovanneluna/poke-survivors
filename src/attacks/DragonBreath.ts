import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Dragon Breath: sopro dracônico frontal com chance de stun.
 * Cone de dano na direção do movimento, similar ao Flamethrower mas menor e com stun.
 */
export class DragonBreath implements Attack {
  readonly type = 'dragonBreath' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 90;
  private stunChance = 0.15;
  private readonly coneAngleDeg = 45;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.dragonBreath.baseDamage;
    this.cooldown = ATTACKS.dragonBreath.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.breathe(),
    });
  }

  private breathe(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);
    const dirAngleDeg = Phaser.Math.RadToDeg(dirAngleRad);

    // Visual: sopro dracônico segue o jogador
    const offsetX = Math.cos(dirAngleRad) * 55;
    const offsetY = Math.sin(dirAngleRad) * 55;
    const breath = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-dragon-breath'
    );
    breath.setScale(1.2).setDepth(10).setAlpha(0.9);
    breath.setRotation(dirAngleRad + Math.PI / 2);
    breath.play('anim-dragon-breath');
    const followBreath = (): void => {
      if (breath.active) breath.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followBreath);
    breath.once('animationcomplete', () => {
      this.scene.events.off('update', followBreath);
      breath.destroy();
    });

    // Partículas dracônicas
    this.scene.add.particles(this.player.x + offsetX, this.player.y + offsetY, 'dragon-particle', {
      speed: { min: 120, max: 220 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 300, quantity: 10,
      scale: { start: 1.5, end: 0 },
      tint: [0x7744ff, 0x9966ff, 0xcc88ff],
      emitting: false,
    }).explode();

    // Dano em cone
    const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.range);

    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );

      let inCone = dist < 25;
      if (!inCone) {
        const angleToEnemy = Math.atan2(
          enemy.y - this.player.y, enemy.x - this.player.x
        );
        const angleDiff = Math.abs(
          Phaser.Math.Angle.ShortestBetween(dirAngleDeg, Phaser.Math.RadToDeg(angleToEnemy))
        );
        inCone = angleDiff <= this.coneAngleDeg / 2;
      }

      if (inCone) {
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
          // Stun: paralisa o inimigo brevemente
          if (!killed && Math.random() < this.stunChance) {
            enemy.setTint(0x7744ff);
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0, 0);
            this.scene.time.delayedCall(800, () => {
              if (enemy.active) {
                enemy.clearTint();
                // Velocidade será restaurada no próximo moveToward()
              }
            });
          }
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.range += 10;
    this.stunChance = Math.min(0.4, this.stunChance + 0.03);
    this.cooldown = Math.max(1000, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.breathe(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
