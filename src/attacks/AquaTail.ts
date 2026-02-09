import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

type CardinalDir = 'up' | 'down' | 'left' | 'right';

function angleToCardinal(rad: number): CardinalDir {
  const deg = Phaser.Math.RadToDeg(rad);
  if (deg >= -135 && deg < -45) return 'up';
  if (deg >= -45 && deg < 45) return 'right';
  if (deg >= 45 && deg < 135) return 'down';
  return 'left';
}

/** Offset: cauda emana ATRÁS do jogador (oposto à direção de movimento) */
const DIR_OFFSET: Record<CardinalDir, { x: number; y: number }> = {
  up:    { x: 0, y: 20 },
  down:  { x: 0, y: -20 },
  left:  { x: 20, y: 0 },
  right: { x: -20, y: 0 },
};

/** Origin: ancora o sprite na borda próxima ao jogador, estendendo para trás */
const DIR_ORIGIN: Record<CardinalDir, { x: number; y: number }> = {
  up:    { x: 0.5, y: 0 },
  down:  { x: 0.5, y: 1 },
  left:  { x: 0, y: 0.5 },
  right: { x: 1, y: 0.5 },
};

/** Mapeia direção do player → direção oposta (onde a cauda aparece) */
const OPPOSITE: Record<CardinalDir, CardinalDir> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
};

interface ActiveCone {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly hitEnemies: Set<number>;
  readonly dirAngleRad: number;
  readonly tailAngleRad: number;
  readonly finalDamage: number;
}

/**
 * Aqua Tail: cauda aquática com alta chance de crítico.
 * Arco de dano amplo (120°) e curto alcance, com sprite water-wave direcional.
 * Similar ao Slash mas com tema Water e crit base 15%.
 * Wartortle tier (minForm: stage1).
 * Usa sprites direcionais (up/down/left/right) sem rotação.
 */
export class AquaTail implements Attack {
  readonly type = 'aquaTail' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 60;
  private critChance = 0.15;
  private readonly critMultiplier = 2;
  private readonly arcAngleDeg = 120;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.aquaTail.baseDamage;
    this.cooldown = ATTACKS.aquaTail.baseCooldown;

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

    // Sprite direcional — cauda aparece ATRÁS do jogador
    const tailDir = OPPOSITE[cardinal];
    const textureKey = `atk-aqua-tail-${tailDir}`;
    const animKey = `anim-aqua-tail-${tailDir}`;
    const offset = DIR_OFFSET[cardinal];

    const origin = DIR_ORIGIN[cardinal];
    const tail = this.scene.add.sprite(
      this.player.x + offset.x, this.player.y + offset.y, textureKey,
    );
    tail.setOrigin(origin.x, origin.y);
    if (isCrit) {
      tail.setDepth(10).setAlpha(0.95).setTint(0xffffff);
    } else {
      tail.setDepth(10).setAlpha(0.9);
    }
    tail.play(animKey);
    const followTail = (): void => {
      if (tail.active) tail.setPosition(this.player.x + offset.x, this.player.y + offset.y);
    };
    this.scene.events.on('update', followTail);
    tail.once('animationcomplete', () => {
      this.scene.events.off('update', followTail);
      this.activeCone = null;
      tail.destroy();
    });

    // Texto de crit
    if (isCrit) {
      const critText = this.scene.add.text(this.player.x, this.player.y - 25, 'CRIT!', {
        fontSize: '12px', color: '#66ccff', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: critText, y: critText.y - 20, alpha: 0, duration: 600,
        onComplete: () => critText.destroy(),
      });
    }

    // Dano contínuo via activeCone (update detecta inimigos a cada frame)
    const tailAngleRad = dirAngleRad + Math.PI;
    this.activeCone = {
      sprite: tail,
      hitEnemies: new Set<number>(),
      dirAngleRad,
      tailAngleRad,
      finalDamage,
    };
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, tailAngleRad, finalDamage } = this.activeCone;
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
          Phaser.Math.RadToDeg(tailAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy),
        ),
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      hitEnemies.add(uid);
      setDamageSource(this.type);
      const killed = enemy.takeDamage(finalDamage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.range += 5;
    this.critChance = Math.min(0.5, this.critChance + 0.03);
    this.cooldown = Math.max(400, this.cooldown - 50);
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
