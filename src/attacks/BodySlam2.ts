import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

interface ActiveDash {
  sprite: Phaser.GameObjects.Sprite;
  hitEnemies: Set<number>;
  angle: number;
}

/**
 * Body Slam 2: dash pesado na direcao do movimento (Bulbasaur line).
 * Evolucao de tackle. Usa sprite unico com setRotation (sem variantes direcionais).
 * Inimigos atingidos ficam stunned (velocity 0) com tint amarelo.
 * Jogador ganha speed boost temporario.
 */
export class BodySlam2 implements Attack {
  readonly type = 'bodySlam2' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 100;
  private stunDuration = 500;
  private readonly dashWidth = 30;
  private activeDash: ActiveDash | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.bodySlam2.baseDamage;
    this.cooldown = ATTACKS.bodySlam2.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  private dash(): void {
    const dir = this.player.getLastDirection();
    const angle = Math.atan2(dir.y, dir.x);

    // Sprite com rotacao (sem variantes direcionais)
    const slamSprite = this.scene.add.sprite(this.player.x, this.player.y, 'atk-wood-hammer');
    slamSprite.setRotation(angle);
    slamSprite.setDepth(10).setAlpha(0.9);
    slamSprite.play('anim-wood-hammer');

    // Sprite segue o jogador
    const followSlam = (): void => {
      if (slamSprite.active) {
        slamSprite.setPosition(this.player.x, this.player.y);
      }
    };
    this.scene.events.on('update', followSlam);
    slamSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followSlam);
      this.activeDash = null;
      slamSprite.destroy();
    });

    // Trail de impacto ao longo do caminho (fix leak: destroy after explode)
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
        const trailParticles = this.scene.add.particles(px, py, 'fire-particle', {
          speed: { min: 15, max: 40 },
          lifespan: 250,
          quantity: 3,
          scale: { start: 1.2, end: 0 },
          tint: [0xccddff, 0xffffff, 0x88bbff],
          emitting: false,
        });
        trailParticles.explode();
        this.scene.time.delayedCall(350, () => trailParticles.destroy());
      });
    }

    // Registra dash ativo — dano aplicado em update()
    this.activeDash = {
      sprite: slamSprite,
      hitEnemies: new Set<number>(),
      angle,
    };

    // Speed boost temporario
    this.player.stats.speed = Math.floor(this.player.stats.baseSpeed * 1.3);
    this.scene.time.delayedCall(500, () => {
      this.player.stats.speed = this.player.stats.baseSpeed;
    });
  }

  update(_time: number, _delta: number): void {
    if (!this.activeDash) return;
    const { sprite, hitEnemies, angle } = this.activeDash;
    if (!sprite.active) { this.activeDash = null; return; }

    const px = this.player.x;
    const py = this.player.y;
    const endX = px + Math.cos(angle) * this.dashDistance;
    const endY = py + Math.sin(angle) * this.dashDistance;
    const dx = endX - px;
    const dy = endY - py;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const enemies = getSpatialGrid().queryRadius(px, py, this.dashDistance + 20);

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const perpDist = Math.abs((dy * (enemy.x - px) - dx * (enemy.y - py)) / len);
      if (perpDist > this.dashWidth) continue;

      const projT = ((enemy.x - px) * dx + (enemy.y - py) * dy) / (len * len);
      if (projT < -0.1 || projT > 1.1) continue;

      hitEnemies.add(uid);
      setDamageSource(this.type);
      const killed = enemy.takeDamage(this.damage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }

      // Stun: zera velocidade e aplica tint amarelo
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.set(0, 0);
        enemy.setTint(0xffffaa);
        this.scene.time.delayedCall(this.stunDuration, () => {
          if (enemy.active) enemy.clearTint();
        });
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.dashDistance += 15;
    this.stunDuration += 100;
    this.cooldown = Math.max(1200, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeDash = null;
  }
}
