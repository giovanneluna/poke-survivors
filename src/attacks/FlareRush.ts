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

/**
 * Flare Rush: dash longo com rastro de fogo persistente.
 * Evolução de Flame Charge + Quick Claw.
 * Usa sprites direcionais (up/down/left/right) sem rotação.
 */
export class FlareRush implements Attack {
  readonly type = 'flareRush' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 130;
  private trailDuration = 2000;
  private speedBoost = 0.25;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.flareRush.baseDamage;
    this.cooldown = ATTACKS.flareRush.baseCooldown;

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

    // Criar trilha de fogo persistente
    const trailPoints: { x: number; y: number }[] = [];
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      trailPoints.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
      });
    }

    // Sprite direcional — sem rotação, escala 1x (pixel-perfect)
    const textureKey = `atk-flame-charge-${cardinal}`;
    const animKey = `anim-flame-charge-${cardinal}`;
    const offset = DIR_OFFSET[cardinal];

    const origin = DIR_ORIGIN[cardinal];
    const rushSprite = this.scene.add.sprite(
      this.player.x + offset.x,
      this.player.y + offset.y,
      textureKey,
    );
    rushSprite.setOrigin(origin.x, origin.y);
    rushSprite.setDepth(10).setAlpha(0.9);
    rushSprite.play(animKey);

    const followRush = (): void => {
      if (rushSprite.active) {
        rushSprite.setPosition(this.player.x + offset.x, this.player.y + offset.y);
      }
    };
    this.scene.events.on('update', followRush);
    rushSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followRush);
      rushSprite.destroy();
    });

    // Visual: partículas + zonas de fogo persistentes no trail
    for (let i = 0; i < trailPoints.length; i++) {
      const p = trailPoints[i];
      this.scene.time.delayedCall(i * 25, () => {
        const particles = this.scene.add.particles(p.x, p.y, 'fire-particle', {
          speed: { min: 20, max: 50 }, lifespan: 350, quantity: 5,
          scale: { start: 1.8, end: 0 }, tint: [0xff4400, 0xff6600, 0xffaa00],
          emitting: false,
        });
        particles.explode();
        this.scene.time.delayedCall(400, () => particles.destroy());

        // Zona de fogo visual
        const fire = this.scene.add.circle(p.x, p.y, 12, 0xff4400, 0.3);
        fire.setDepth(6);
        this.scene.tweens.add({
          targets: fire, alpha: 0, duration: this.trailDuration,
          onComplete: () => fire.destroy(),
        });
      });
    }

    // Dano ao longo da trilha (imediato)
    const enemies = getSpatialGrid().getActiveEnemies();

    for (const enemy of enemies) {
      const dashDx = endX - startX;
      const dashDy = endY - startY;
      const dashLen = Math.sqrt(dashDx * dashDx + dashDy * dashDy);
      if (dashLen === 0) continue;

      const perpDist = Math.abs(
        (dashDy * (enemy.x - startX) - dashDx * (enemy.y - startY)) / dashLen
      );
      if (perpDist > 30) continue;

      const projT = ((enemy.x - startX) * dashDx + (enemy.y - startY) * dashDy) / (dashLen * dashLen);
      if (projT < -0.1 || projT > 1.1) continue;

      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }

    // Trail damage tick — O(n) line-segment check em vez de O(n×10) point check
    const dx = endX - startX;
    const dy = endY - startY;
    const trailLen = Math.sqrt(dx * dx + dy * dy);
    let trailElapsed = 0;
    const trailTick = this.scene.time.addEvent({
      delay: 400, loop: true,
      callback: () => {
        trailElapsed += 400;
        if (trailElapsed >= this.trailDuration) { trailTick.destroy(); return; }
        if (trailLen === 0) return;

        const liveEnemies = getSpatialGrid().getActiveEnemies();
        for (const enemy of liveEnemies) {
          // Distância perpendicular ao segmento
          const perpDist = Math.abs(
            (dy * (enemy.x - startX) - dx * (enemy.y - startY)) / trailLen
          );
          if (perpDist > 20) continue;
          // Projeção no segmento
          const projT = ((enemy.x - startX) * dx + (enemy.y - startY) * dy) / (trailLen * trailLen);
          if (projT < -0.1 || projT > 1.1) continue;

          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(Math.floor(this.damage * 0.3));
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }
        }
      },
    });

    // Speed boost (sem tint — evita parecer que o jogador está tomando dano)
    this.player.stats.speed = Math.floor(this.player.stats.baseSpeed * (1 + this.speedBoost));
    this.scene.time.delayedCall(2500, () => {
      this.player.stats.speed = this.player.stats.baseSpeed;
    });
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.dashDistance += 12;
    this.trailDuration += 300;
    this.speedBoost += 0.03;
    this.cooldown = Math.max(1200, this.cooldown - 120);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
