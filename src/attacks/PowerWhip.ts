import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Power Whip: chicotada poderosa com knockback.
 * Evolução de Vine Whip — Ivysaur tier (minForm: stage1).
 * Cone attack na direção do movimento com knockback que empurra inimigos para longe.
 * Arco de 100 graus, range 75px.
 */
export class PowerWhip implements Attack {
  readonly type = 'powerWhip' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 75;
  private readonly arcAngleDeg = 100;
  private knockbackForce = 200;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.powerWhip.baseDamage;
    this.cooldown = ATTACKS.powerWhip.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.whip(),
    });
  }

  private whip(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite do power whip na direção
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const whipSprite = this.scene.add.sprite(
      this.player.x + offsetX,
      this.player.y + offsetY,
      'atk-power-whip'
    );
    whipSprite.setScale(1.6).setDepth(10).setAlpha(0.9);
    whipSprite.setRotation(dirAngleRad);
    whipSprite.play('anim-power-whip');

    // Sprite segue o jogador durante a animação
    const followWhip = (): void => {
      if (whipSprite.active) {
        whipSprite.setPosition(this.player.x + offsetX, this.player.y + offsetY);
      }
    };
    this.scene.events.on('update', followWhip);
    whipSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followWhip);
      whipSprite.destroy();
    });

    // Partículas verdes de chicotada
    this.scene.add.particles(this.player.x + offsetX, this.player.y + offsetY, 'fire-particle', {
      speed: { min: 40, max: 100 },
      lifespan: 250,
      quantity: 6,
      scale: { start: 1.5, end: 0 },
      angle: {
        min: Phaser.Math.RadToDeg(dirAngleRad) - this.arcAngleDeg / 2,
        max: Phaser.Math.RadToDeg(dirAngleRad) + this.arcAngleDeg / 2,
      },
      tint: [0x228822, 0x44cc44, 0x66ff66],
      emitting: false,
    }).explode();

    // Dano em arco + knockback
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemySprite.x, enemySprite.y
      );
      if (dist > this.range) continue;

      const angleToEnemy = Math.atan2(
        enemySprite.y - this.player.y, enemySprite.x - this.player.x
      );
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      // Dano
      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          continue; // Morto, sem knockback
        }
      }

      // Knockback: empurra na direção oposta ao jogador
      const angleFromPlayer = Math.atan2(
        enemySprite.y - this.player.y, enemySprite.x - this.player.x
      );
      const body = enemySprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.x += Math.cos(angleFromPlayer) * this.knockbackForce;
      body.velocity.y += Math.sin(angleFromPlayer) * this.knockbackForce;
    }
  }

  update(_time: number, _delta: number): void {
    // Timer-based, sem lógica per-frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.range += 8;
    this.knockbackForce += 30;
    this.cooldown = Math.max(350, this.cooldown - 40);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.whip(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
