import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

type CardinalDir = 'up' | 'down' | 'left' | 'right';

function angleToCardinal(rad: number): CardinalDir {
  const deg = Phaser.Math.RadToDeg(rad);
  if (deg >= -135 && deg < -45) return 'up';
  if (deg >= -45 && deg < 45) return 'right';
  if (deg >= 45 && deg < 135) return 'down';
  return 'left';
}

/** Offset: onda emana do jogador */
const DIR_OFFSET: Record<CardinalDir, { x: number; y: number }> = {
  up:    { x: 0, y: -20 },
  down:  { x: 0, y: 20 },
  left:  { x: -20, y: 0 },
  right: { x: 20, y: 0 },
};

/** Origin: ancora o sprite na borda proxima ao jogador, estendendo para fora */
const DIR_ORIGIN: Record<CardinalDir, { x: number; y: number }> = {
  up:    { x: 0.5, y: 1 },
  down:  { x: 0.5, y: 0 },
  left:  { x: 1, y: 0.5 },
  right: { x: 0, y: 0.5 },
};

interface ActiveCone {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly hitEnemies: Set<number>;
  readonly dirAngleRad: number;
  readonly finalDamage: number;
  readonly isCrit: boolean;
}

/**
 * Crabhammer: evolucao do Aqua Tail.
 * Cone melee com 50% de chance de critico (2.5x dano).
 * No crit: splash de particulas de agua + mini screen shake.
 * Blastoise tier (minForm: stage2).
 * Usa sprites direcionais (up/down/left/right) sem rotação.
 */
export class Crabhammer implements Attack {
  readonly type = 'crabhammer' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 70;
  private critChance = 0.5;
  private readonly critMultiplier = 2.5;
  private readonly arcAngleDeg = 100;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.crabhammer.baseDamage;
    this.cooldown = ATTACKS.crabhammer.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);
    const cardinal = angleToCardinal(dirAngleRad);

    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? Math.floor(this.damage * this.critMultiplier) : this.damage;

    // Sprite direcional — sem rotação
    const textureKey = `atk-aqua-tail-${cardinal}`;
    const animKey = `anim-aqua-tail-${cardinal}`;
    const offset = DIR_OFFSET[cardinal];

    const origin = DIR_ORIGIN[cardinal];
    const claw = this.scene.add.sprite(
      this.player.x + offset.x, this.player.y + offset.y, textureKey,
    );
    claw.setOrigin(origin.x, origin.y);

    if (isCrit) {
      claw.setScale(2).setDepth(10).setAlpha(0.95).setTint(0xffffff);
    } else {
      claw.setScale(1.5).setDepth(10).setAlpha(0.9);
    }
    claw.play(animKey);
    const followClaw = (): void => {
      if (claw.active) claw.setPosition(this.player.x + offset.x, this.player.y + offset.y);
    };
    this.scene.events.on('update', followClaw);
    claw.once('animationcomplete', () => {
      this.scene.events.off('update', followClaw);
      this.activeCone = null;
      claw.destroy();
    });

    // Particulas de agua
    const particleTints = isCrit
      ? [0xffffff, 0x88ddff, 0x44aaff, 0x66ccff]
      : [0x3388ff, 0x44aaff, 0x66ccff];

    if (shouldShowVfx()) {
      const emitter = this.scene.add.particles(
        this.player.x + offset.x, this.player.y + offset.y, 'water-particle', {
          speed: { min: 30, max: 80 },
          lifespan: 200,
          quantity: getVfxQuantity(isCrit ? 12 : 6),
          scale: { start: isCrit ? 2 : 1.2, end: 0 },
          tint: particleTints,
          emitting: false,
        },
      );
      emitter.explode();
      this.scene.time.delayedCall(300, () => emitter.destroy());
    }

    // Efeitos de crit: texto + screen shake
    if (isCrit) {
      const critText = this.scene.add.text(this.player.x, this.player.y - 25, 'CRITICAL!', {
        fontSize: '14px', color: '#44aaff', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: critText, y: critText.y - 25, alpha: 0, duration: 700,
        onComplete: () => critText.destroy(),
      });

      this.scene.cameras.main.shake(50, 0.002);
    }

    // Dano contínuo via activeCone (update detecta inimigos a cada frame)
    this.activeCone = {
      sprite: claw,
      hitEnemies: new Set<number>(),
      dirAngleRad,
      finalDamage,
      isCrit,
    };
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleRad, finalDamage, isCrit } = this.activeCone;
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

      // Flash branco no crit
      if (isCrit) {
        enemy.setTint(0xffffff);
        this.scene.time.delayedCall(120, () => {
          if (enemy.active) enemy.clearTint();
        });
      }

      setDamageSource(this.type);
      const killed = enemy.takeDamage(finalDamage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.range += 5;
    this.critChance = Math.min(0.70, this.critChance + 0.03);
    this.cooldown = Math.max(350, this.cooldown - 40);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  destroy(): void {
    this.activeCone = null;
    this.timer.destroy();
  }
}
