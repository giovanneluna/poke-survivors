import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Flamethrower: explosão de fogo na direção do movimento.
 * Equivalente ao "Fire Wand" do Vampire Survivors.
 * Causa dano em área (cone) na direção que o jogador se move.
 */
export class Flamethrower implements Attack {
  readonly type = 'flamethrower' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private range = 100;
  private cooldown: number;
  private readonly coneAngleDeg = 50;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    _enemyGroup: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.flamethrower.baseDamage;
    this.cooldown = ATTACKS.flamethrower.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const dirAngleDeg = Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x));

    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Sprite direcional Tibia (4 cardinais, cada cobrindo 90°)
    const { key, anim, originX, originY } = this.getDirectionalSprite(dirAngleRad);
    const flame = this.scene.add.sprite(this.player.x, this.player.y, key);
    flame.setOrigin(originX, originY);
    flame.setScale(1.2).setDepth(10).setAlpha(0.9);
    flame.play(anim);

    // Fogo segue o jogador enquanto a animação roda
    const followPlayer = (): void => {
      if (flame.active) flame.setPosition(this.player.x, this.player.y);
    };
    this.scene.events.on('update', followPlayer);
    flame.once('animationcomplete', () => {
      this.scene.events.off('update', followPlayer);
      flame.destroy();
    });

    // Partículas complementares (auto-destroy após lifespan)
    const particles = this.scene.add.particles(this.player.x, this.player.y, 'fire-particle', {
      speed: { min: 150, max: 250 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 300,
      quantity: 12,
      scale: { start: 2, end: 0.3 },
      tint: [0xff2200, 0xff6600, 0xffaa00],
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(400, () => particles.destroy());

    // Dano em cone
    const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.range);

    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );

      // Inimigos muito perto sempre são atingidos (evita bug de ângulo a dist ~0)
      let inCone = dist < 25;
      if (!inCone) {
        const angleToEnemy = Math.atan2(
          enemy.y - this.player.y,
          enemy.x - this.player.x
        );
        const angleDiff = Math.abs(
          Phaser.Math.Angle.ShortestBetween(
            Phaser.Math.RadToDeg(dirAngleRad),
            Phaser.Math.RadToDeg(angleToEnemy)
          )
        );
        inCone = angleDiff <= this.coneAngleDeg / 2;
      }

      if (inCone) {
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
        }
      }
    }
  }

  /**
   * Mapeia ângulo em radianos para a sprite direcional Tibia.
   *
   * 4 sprites cardinais (confirmadas pelo usuário via all-sheet):
   *   107 → UP    (atk-flame-up)    — fogo sobe
   *   108 → DOWN  (atk-flame-down)  — fogo desce
   *   109 → LEFT  (atk-flame-left)  — fogo vai ←
   *   110 → RIGHT (atk-flame-right) — fogo vai →
   *
   * Phaser: 0°=→, 90°=↓, 180°=←, 270°=↑
   * Cada sprite cobre um quadrante de 90°.
   */
  private getDirectionalSprite(angle: number): {
    key: string; anim: string; originX: number; originY: number;
  } {
    const deg = ((Phaser.Math.RadToDeg(angle) % 360) + 360) % 360;

    // → RIGHT (315°–45°): fogo vai para direita, origem na borda esquerda
    if (deg >= 315 || deg < 45)
      return { key: 'atk-flame-right', anim: 'anim-flame-right', originX: 0, originY: 0.5 };
    // ↓ DOWN (45°–135°): fogo vai para baixo, origem na borda de cima
    if (deg >= 45 && deg < 135)
      return { key: 'atk-flame-down', anim: 'anim-flame-down', originX: 0.5, originY: 0 };
    // ← LEFT (135°–225°): fogo vai para esquerda, origem na borda direita
    if (deg >= 135 && deg < 225)
      return { key: 'atk-flame-left', anim: 'anim-flame-left', originX: 1, originY: 0.5 };
    // ↑ UP (225°–315°): fogo vai para cima, origem na borda de baixo
    return { key: 'atk-flame-up', anim: 'anim-flame-up', originX: 0.5, originY: 1 };
  }

  update(_time: number, _delta: number): void {
    // Timer-based, sem update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.range += 20;
    this.cooldown = Math.max(1500, this.cooldown - 200);
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
