import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx } from '../systems/GraphicsSettings';

interface ActiveCone {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly hitEnemies: Set<number>;
  readonly dirAngleRad: number;
}

/**
 * Power Whip: chicotada poderosa com knockback.
 * Evolucao de Vine Whip — Ivysaur tier (minForm: stage1).
 * Cone attack na direcao do movimento com knockback que empurra inimigos para longe.
 * Arco de 100 graus, range 75px.
 */
export class PowerWhip implements Attack {
  readonly type = 'powerWhip' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 75;
  private readonly arcAngleDeg = 100;
  private knockbackForce = 200;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
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

    // Visual: sprite do power whip na direcao
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

    // Sprite segue o jogador durante a animacao
    const followWhip = (): void => {
      if (whipSprite.active) {
        whipSprite.setPosition(this.player.x + offsetX, this.player.y + offsetY);
      }
    };
    this.scene.events.on('update', followWhip);
    whipSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followWhip);
      this.activeCone = null;
      whipSprite.destroy();
    });

    // Particulas verdes de chicotada
    if (shouldShowVfx()) {
      const emitter = this.scene.add.particles(
        this.player.x + offsetX, this.player.y + offsetY, 'fire-particle', {
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
        },
      );
      emitter.explode();
      this.scene.time.delayedCall(350, () => emitter.destroy());
    }

    // Dano contínuo via activeCone (update detecta inimigos a cada frame)
    this.activeCone = {
      sprite: whipSprite,
      hitEnemies: new Set<number>(),
      dirAngleRad,
    };
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleRad } = this.activeCone;
    if (!sprite.active) { this.activeCone = null; return; }

    const px = this.player.x;
    const py = this.player.y;
    const enemies = getSpatialGrid().queryRadius(px, py, this.range);

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const angleToEnemy = Math.atan2(enemy.y - py, enemy.x - px);
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy),
        ),
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      hitEnemies.add(uid);

      // Dano
      setDamageSource(this.type);
      const killed = enemy.takeDamage(this.damage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        continue; // Morto, sem knockback
      }

      // Knockback: empurra na direcao oposta ao jogador
      const angleFromPlayer = Math.atan2(enemy.y - py, enemy.x - px);
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.velocity.x += Math.cos(angleFromPlayer) * this.knockbackForce;
      body.velocity.y += Math.sin(angleFromPlayer) * this.knockbackForce;
    }
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
    this.activeCone = null;
    this.timer.destroy();
  }
}
