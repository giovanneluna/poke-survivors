import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

type CardinalDir = 'up' | 'down' | 'left' | 'right';

function angleToCardinal(rad: number): CardinalDir {
  const deg = Phaser.Math.RadToDeg(rad);
  if (deg >= -135 && deg < -45) return 'up';
  if (deg >= -45 && deg < 45) return 'right';
  if (deg >= 45 && deg < 135) return 'down';
  return 'left';
}

/** Offset: jato emana do jogador */
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

/**
 * Aqua Jet: dash aquático na direção do movimento.
 * Usa sprites direcionais (up/down/left/right) sem rotação.
 */
export class AquaJet implements Attack {
  readonly type = 'aquaJet' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 80;
  private speedBoost = 0.15;
  private speedBoostDuration = 2000;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.aquaJet.baseDamage;
    this.cooldown = ATTACKS.aquaJet.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  private dash(): void {
    const dir = this.player.getLastDirection();
    const angle = Math.atan2(dir.y, dir.x);
    const cardinal = angleToCardinal(angle);

    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * this.dashDistance;
    const endY = startY + Math.sin(angle) * this.dashDistance;

    // Sprite direcional — sem rotação
    const textureKey = `atk-aqua-jet-${cardinal}`;
    const animKey = `anim-aqua-jet-${cardinal}`;
    const offset = DIR_OFFSET[cardinal];

    const origin = DIR_ORIGIN[cardinal];
    const chargeSprite = this.scene.add.sprite(
      this.player.x + offset.x,
      this.player.y + offset.y,
      textureKey,
    );
    chargeSprite.setOrigin(origin.x, origin.y);
    chargeSprite.setDepth(10).setAlpha(0.9);
    chargeSprite.play(animKey);

    const followCharge = (): void => {
      if (chargeSprite.active) {
        chargeSprite.setPosition(this.player.x + offset.x, this.player.y + offset.y);
      }
    };
    this.scene.events.on('update', followCharge);
    chargeSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followCharge);
      chargeSprite.destroy();
    });

    // Trail de água ao longo do caminho
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;

      this.scene.time.delayedCall(i * 30, () => {
        this.scene.add.particles(px, py, 'water-particle', {
          speed: { min: 20, max: 60 }, lifespan: 300, quantity: 4,
          scale: { start: 1.5, end: 0 }, tint: [0x3388ff, 0x44aaff, 0x66ccff],
          emitting: false,
        }).explode();
      });
    }

    // Dano a inimigos no caminho
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const distToLine = Phaser.Math.Distance.Between(
        enemySprite.x, enemySprite.y,
        (startX + endX) / 2, (startY + endY) / 2
      );
      if (distToLine > this.dashDistance * 0.7) continue;

      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const perpDist = Math.abs(
        (dy * (enemySprite.x - startX) - dx * (enemySprite.y - startY)) / len
      );
      if (perpDist > 25) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }
    }

    // Speed boost temporário
    this.player.stats.speed = Math.floor(this.player.stats.baseSpeed * (1 + this.speedBoost));
    this.scene.time.delayedCall(this.speedBoostDuration, () => {
      this.player.stats.speed = this.player.stats.baseSpeed;
    });
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.dashDistance += 10;
    this.speedBoost += 0.03;
    this.cooldown = Math.max(1800, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
