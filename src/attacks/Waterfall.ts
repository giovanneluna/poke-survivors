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
 * Waterfall: evolucao do Aqua Jet.
 * Dash longo com trilha de agua persistente que aplica slow.
 * Equivalente ao Flare Rush do Charmander, com tematica aquatica.
 * Trail permanece e reduz velocidade dos inimigos que passam por ela.
 * Usa sprites direcionais (up/down/left/right) sem rotação.
 */
export class Waterfall implements Attack {
  readonly type = 'waterfall' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 130;
  private trailDuration = 2000;
  private speedBoost = 0.25;

  /** Fator de reducao de velocidade nos inimigos na trilha */
  private readonly trailSlowScale = 0.5;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.waterfall.baseDamage;
    this.cooldown = ATTACKS.waterfall.baseCooldown;

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

    // Criar trilha de agua persistente
    const trailPoints: { x: number; y: number }[] = [];
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      trailPoints.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
      });
    }

    // Sprite direcional — sem rotação
    const textureKey = `atk-aqua-jet-${cardinal}`;
    const animKey = `anim-aqua-jet-${cardinal}`;
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

    // Visual: particulas de agua + zonas de agua persistentes no trail
    for (let i = 0; i < trailPoints.length; i++) {
      const p = trailPoints[i];
      this.scene.time.delayedCall(i * 25, () => {
        // Particulas de splash (auto-destroy)
        const splashPart = this.scene.add.particles(p.x, p.y, 'water-particle', {
          speed: { min: 20, max: 50 }, lifespan: 350, quantity: 5,
          scale: { start: 1.8, end: 0 }, tint: [0x3388ff, 0x44aaff, 0x66ccff],
          emitting: false,
        });
        splashPart.explode();
        this.scene.time.delayedCall(450, () => splashPart.destroy());

        // Zona de agua visual (circulo azul translucido)
        const waterZone = this.scene.add.circle(p.x, p.y, 14, 0x3388ff, 0.3);
        waterZone.setDepth(6);
        this.scene.tweens.add({
          targets: waterZone, alpha: 0, duration: this.trailDuration,
          onComplete: () => waterZone.destroy(),
        });
      });
    }

    // Dano ao longo da trilha (imediato)
    const enemies = getSpatialGrid().getActiveEnemies();

    for (const enemy of enemies) {
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const perpDist = Math.abs(
        (dy * (enemy.x - startX) - dx * (enemy.y - startY)) / len
      );
      if (perpDist > 30) continue;

      const projT = ((enemy.x - startX) * dx + (enemy.y - startY) * dy) / (len * len);
      if (projT < -0.1 || projT > 1.1) continue;

      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }

    // Trail damage + slow tick (inimigos que passam pela trilha depois)
    let trailElapsed = 0;
    const trailTick = this.scene.time.addEvent({
      delay: 400, loop: true,
      callback: () => {
        trailElapsed += 400;
        if (trailElapsed >= this.trailDuration) { trailTick.destroy(); return; }

        const liveEnemies = getSpatialGrid().getActiveEnemies();
        for (const enemy of liveEnemies) {
          // Check se esta perto de algum ponto do trail
          for (const p of trailPoints) {
            const dist = Phaser.Math.Distance.Between(p.x, p.y, enemy.x, enemy.y);
            if (dist < 20) {
              if (typeof enemy.takeDamage === 'function') {
                // Trail tick damage: 30% do dano base
                setDamageSource(this.type);
                const killed = enemy.takeDamage(Math.floor(this.damage * 0.3));
                if (killed) {
                  this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
                }
              }

              // Slow: reduz velocidade dos inimigos na trilha
              const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
              if (enemyBody) {
                enemyBody.velocity.scale(this.trailSlowScale);
              }
              enemy.setTint(0x3388ff);
              this.scene.time.delayedCall(500, () => {
                if (enemy.active) enemy.clearTint();
              });

              break; // So aplica uma vez por tick por inimigo
            }
          }
        }
      },
    });

    // Speed boost temporário (sem tint — evita parecer que o jogador está tomando dano)
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
