import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

interface ActiveCone {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly hitEnemies: Set<number>;
  readonly dirAngleRad: number;
  readonly dirAngleDeg: number;
}

/**
 * Dragon Breath: sopro draconico frontal com chance de stun.
 * Cone de dano na direcao do movimento, similar ao Flamethrower mas menor e com stun.
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
  private activeCone: ActiveCone | null = null;

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

    // Visual: sopro draconico segue o jogador
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
      this.activeCone = null;
      breath.destroy();
    });

    // Particulas draconicas
    if (shouldShowVfx()) {
      const emitter = this.scene.add.particles(
        this.player.x + offsetX, this.player.y + offsetY, 'dragon-particle', {
          speed: { min: 120, max: 220 },
          angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
          lifespan: 300, quantity: getVfxQuantity(10),
          scale: { start: 1.5, end: 0 },
          tint: [0x7744ff, 0x9966ff, 0xcc88ff],
          emitting: false,
        },
      );
      emitter.explode();
      this.scene.time.delayedCall(400, () => emitter.destroy());
    }

    // Dano contínuo via activeCone (update detecta inimigos a cada frame)
    this.activeCone = {
      sprite: breath,
      hitEnemies: new Set<number>(),
      dirAngleRad,
      dirAngleDeg,
    };
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleDeg } = this.activeCone;
    if (!sprite.active) { this.activeCone = null; return; }

    const px = this.player.x;
    const py = this.player.y;
    const enemies = getSpatialGrid().queryRadius(px, py, this.range);

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);

      let inCone = dist < 25;
      if (!inCone) {
        const angleToEnemy = Math.atan2(enemy.y - py, enemy.x - px);
        const angleDiff = Math.abs(
          Phaser.Math.Angle.ShortestBetween(dirAngleDeg, Phaser.Math.RadToDeg(angleToEnemy)),
        );
        inCone = angleDiff <= this.coneAngleDeg / 2;
      }

      if (!inCone) continue;

      hitEnemies.add(uid);
      setDamageSource(this.type);
      const killed = enemy.takeDamage(this.damage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        continue;
      }

      // Stun: paralisa o inimigo brevemente
      if (Math.random() < this.stunChance) {
        const body = enemy.body as Phaser.Physics.Arcade.Body | null;
        if (body) {
          enemy.setTint(0x7744ff);
          body.setVelocity(0, 0);
          this.scene.time.delayedCall(800, () => {
            if (enemy.active) enemy.clearTint();
          });
        }
      }
    }
  }

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

  destroy(): void {
    this.activeCone = null;
    this.timer.destroy();
  }
}
