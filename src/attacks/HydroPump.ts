import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Hydro Pump: jato direcional devastador.
 * Cone de dano focado (arco estreito, alcance longo) na direção do movimento.
 * Equivalente ao Flamethrower para a linha Water.
 * Wartortle tier (minForm: stage1).
 */
export class HydroPump implements Attack {
  readonly type = 'hydroPump' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 80;
  private coneAngleDeg = 60;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemyGroup: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.hydroPump.baseDamage;
    this.cooldown = ATTACKS.hydroPump.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);
    const dirAngleDeg = Phaser.Math.RadToDeg(dirAngleRad);

    // Sprite animado de Hydro Pump na direção do ataque
    const offsetX = Math.cos(dirAngleRad) * 40;
    const offsetY = Math.sin(dirAngleRad) * 40;
    const beam = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-hydro-pump'
    );
    beam.setScale(0.6).setDepth(10).setAlpha(0.9);
    beam.setRotation(dirAngleRad - Math.PI / 2);
    beam.play('anim-hydro-pump');
    const followBeam = (): void => {
      if (beam.active) beam.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followBeam);
    beam.once('animationcomplete', () => {
      this.scene.events.off('update', followBeam);
      beam.destroy();
    });

    // Partículas ao longo do jato
    this.scene.add.particles(this.player.x, this.player.y, 'water-particle', {
      speed: { min: 150, max: 250 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 300,
      quantity: 12,
      scale: { start: 2, end: 0.3 },
      tint: [0x3388ff, 0x44aaff, 0x66ccff],
      emitting: false,
    }).explode();

    // Dano em cone: atinge TODOS os inimigos na area
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemySprite.x, enemySprite.y
      );

      if (dist > this.range) continue;

      // Inimigos muito perto sempre são atingidos (evita bug de ângulo a dist ~0)
      let inCone = dist < 25;
      if (!inCone) {
        const angleToEnemy = Math.atan2(
          enemySprite.y - this.player.y,
          enemySprite.x - this.player.x
        );
        const angleDiff = Math.abs(
          Phaser.Math.Angle.ShortestBetween(
            dirAngleDeg,
            Phaser.Math.RadToDeg(angleToEnemy)
          )
        );
        inCone = angleDiff <= this.coneAngleDeg / 2;
      }

      if (inCone) {
        const enemy = enemySprite as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          }
        }
      }
    }
  }

  update(_time: number, _delta: number): void {
    // Timer-based, sem update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.range += 8;
    this.coneAngleDeg += 5;
    this.cooldown = Math.max(1600, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
