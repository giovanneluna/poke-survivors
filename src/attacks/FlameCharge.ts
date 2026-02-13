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

/** Offset: chama emana do jogador (pequeno offset para não cobrir o corpo) */
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

const HITBOX_HALF_W = 25;
const HITBOX_REACH = 140;

interface ActiveDash {
  sprite: Phaser.GameObjects.Sprite;
  hitEnemies: Set<number>;
  cardinal: CardinalDir;
  offset: { x: number; y: number };
}

/**
 * Flame Charge: dash em chamas na direção do movimento.
 * Usa sprites direcionais (up/down/left/right) sem rotação.
 * Dano aplicado continuamente durante a animação (segue o jogador).
 */
export class FlameCharge implements Attack {
  readonly type = 'flameCharge' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 80;
  private speedBoost = 0.15;
  private speedBoostDuration = 2000;
  private activeDash: ActiveDash | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.flameCharge.baseDamage;
    this.cooldown = ATTACKS.flameCharge.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.dash(),
    });
  }

  private dash(): void {
    const dir = this.player.getAttackDirection();
    const angle = Math.atan2(dir.y, dir.x);
    const cardinal = angleToCardinal(angle);

    // Sprite direcional — sem rotação, escala 1x (pixel-perfect)
    const textureKey = `atk-flame-charge-${cardinal}`;
    const animKey = `anim-flame-charge-${cardinal}`;
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

    // Ativar hit detection contínua
    this.activeDash = {
      sprite: chargeSprite,
      hitEnemies: new Set(),
      cardinal,
      offset,
    };

    chargeSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followCharge);
      this.activeDash = null;
      chargeSprite.destroy();
    });

    // Trail de fogo ao longo do caminho
    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * this.dashDistance;
    const endY = startY + Math.sin(angle) * this.dashDistance;
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;

      this.scene.time.delayedCall(i * 30, () => {
        const trailPart = this.scene.add.particles(px, py, 'fire-particle', {
          speed: { min: 20, max: 60 }, lifespan: 300, quantity: 4,
          scale: { start: 1.5, end: 0 }, tint: [0xff4400, 0xff6600, 0xffaa00],
          emitting: false,
        });
        trailPart.explode();
        this.scene.time.delayedCall(400, () => trailPart.destroy());
      });
    }

    // Speed boost temporário (sem tint — evita parecer que o jogador está tomando dano)
    this.player.stats.speed = Math.floor(this.player.stats.baseSpeed * (1 + this.speedBoost));
    this.scene.time.delayedCall(this.speedBoostDuration, () => {
      this.player.stats.speed = this.player.stats.baseSpeed;
    });
  }

  update(_time: number, _delta: number): void {
    if (!this.activeDash) return;
    const { sprite, hitEnemies, cardinal, offset } = this.activeDash;
    if (!sprite.active) { this.activeDash = null; return; }

    const sx = this.player.x + offset.x;
    const sy = this.player.y + offset.y;

    const enemies = getSpatialGrid().queryRadius(sx, sy, HITBOX_REACH + 20);

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const dx = enemy.x - sx;
      const dy = enemy.y - sy;

      let hit = false;
      switch (cardinal) {
        case 'up':    hit = Math.abs(dx) < HITBOX_HALF_W && dy > -HITBOX_REACH && dy < 10; break;
        case 'down':  hit = Math.abs(dx) < HITBOX_HALF_W && dy > -10 && dy < HITBOX_REACH; break;
        case 'left':  hit = dx > -HITBOX_REACH && dx < 10 && Math.abs(dy) < HITBOX_HALF_W; break;
        case 'right': hit = dx > -10 && dx < HITBOX_REACH && Math.abs(dy) < HITBOX_HALF_W; break;
      }
      if (!hit) continue;

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
    this.damage += 5;
    this.dashDistance += 10;
    this.speedBoost += 0.03;
    this.cooldown = Math.max(1800, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.dash(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeDash = null;
  }
}
