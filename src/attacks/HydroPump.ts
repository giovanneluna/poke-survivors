import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

interface ActiveCone {
  sprite: Phaser.GameObjects.Sprite;
  hitEnemies: Set<number>;
  dirAngleRad: number;
  followFn: () => void;
}

/**
 * Hydro Pump: jato direcional devastador.
 * Cone de dano focado (arco estreito, alcance longo) na direcao do movimento.
 * Dano aplicado continuamente durante a animacao (segue o jogador).
 * Wartortle tier (minForm: stage1).
 */
export class HydroPump implements Attack {
  readonly type = 'hydroPump' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 80;
  private coneAngleDeg = 60;
  private activeCone: ActiveCone | null = null;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    _enemyGroup: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.hydroPump.baseDamage;
    this.cooldown = ATTACKS.hydroPump.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);
    const dirAngleDeg = Phaser.Math.RadToDeg(dirAngleRad);

    // Sprite animado de Hydro Pump na direcao do ataque
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

    // Ativar hit detection continua
    this.activeCone = {
      sprite: beam,
      hitEnemies: new Set(),
      dirAngleRad,
      followFn: followBeam,
    };

    beam.once('animationcomplete', () => {
      this.scene.events.off('update', followBeam);
      this.activeCone = null;
      beam.destroy();
    });

    // Particulas ao longo do jato
    const particles = this.scene.add.particles(this.player.x, this.player.y, 'water-particle', {
      speed: { min: 150, max: 250 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 300,
      quantity: 12,
      scale: { start: 2, end: 0.3 },
      tint: [0x3388ff, 0x44aaff, 0x66ccff],
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(400, () => particles.destroy());
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleRad } = this.activeCone;
    if (!sprite.active) { this.activeCone = null; return; }

    const px = this.player.x;
    const py = this.player.y;
    const enemies = getSpatialGrid().queryRadius(px, py, this.range);
    const halfCone = this.coneAngleDeg / 2;

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);

      // Inimigos muito perto sempre sao atingidos (evita bug de angulo a dist ~0)
      let inCone = dist < 25;
      if (!inCone) {
        const angleToEnemy = Math.atan2(enemy.y - py, enemy.x - px);
        const angleDiff = Math.abs(
          Phaser.Math.Angle.ShortestBetween(
            Phaser.Math.RadToDeg(dirAngleRad),
            Phaser.Math.RadToDeg(angleToEnemy)
          )
        );
        inCone = angleDiff <= halfCone;
      }
      if (!inCone) continue;

      hitEnemies.add(uid);
      setDamageSource(this.type);
      const killed = enemy.takeDamage(this.damage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.range += 8;
    this.coneAngleDeg += 5;
    this.cooldown = Math.max(1600, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    if (this.activeCone) {
      this.scene.events.off('update', this.activeCone.followFn);
      if (this.activeCone.sprite.active) this.activeCone.sprite.destroy();
      this.activeCone = null;
    }
  }
}
