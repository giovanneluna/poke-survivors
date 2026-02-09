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
}

/**
 * Flamethrower: explosão de fogo na direção do movimento.
 * Equivalente ao "Fire Wand" do Vampire Survivors.
 * Causa dano em área (cone) na direção que o jogador se move.
 * Dano aplicado continuamente durante a animação (segue o jogador).
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
  private activeCone: ActiveCone | null = null;

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

    // Ativar hit detection contínua
    this.activeCone = {
      sprite: flame,
      hitEnemies: new Set(),
      dirAngleRad,
    };

    flame.once('animationcomplete', () => {
      this.scene.events.off('update', followPlayer);
      this.activeCone = null;
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
  }

  /**
   * Mapeia ângulo em radianos para a sprite direcional Tibia.
   */
  private getDirectionalSprite(angle: number): {
    key: string; anim: string; originX: number; originY: number;
  } {
    const deg = ((Phaser.Math.RadToDeg(angle) % 360) + 360) % 360;

    if (deg >= 315 || deg < 45)
      return { key: 'atk-flame-right', anim: 'anim-flame-right', originX: 0, originY: 0.5 };
    if (deg >= 45 && deg < 135)
      return { key: 'atk-flame-down', anim: 'anim-flame-down', originX: 0.5, originY: 0 };
    if (deg >= 135 && deg < 225)
      return { key: 'atk-flame-left', anim: 'anim-flame-left', originX: 1, originY: 0.5 };
    return { key: 'atk-flame-up', anim: 'anim-flame-up', originX: 0.5, originY: 1 };
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

      // Inimigos muito perto sempre são atingidos (evita bug de ângulo a dist ~0)
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
    this.activeCone = null;
  }
}
