import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

interface ActiveCone {
  sprite: Phaser.GameObjects.Sprite;
  hitEnemies: Set<number>;
  dirAngleRad: number;
  followFn: () => void;
}

/**
 * Blast Burn: evolucao do Flamethrower.
 * Explosao nuclear massiva na direcao do movimento.
 * Raio enorme, dano devastador, visual espetacular.
 * Dano aplicado continuamente durante a animacao (segue o jogador).
 */
export class BlastBurn implements Attack {
  readonly type = 'blastBurn' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private range = 180;
  private cooldown: number;
  private readonly coneAngleDeg = 70;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.blastBurn.baseDamage;
    this.cooldown = ATTACKS.blastBurn.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getAimDirection();
    const dirAngleDeg = Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x));
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Sprite animado Blast Burn na direcao do ataque
    const offsetX = Math.cos(dirAngleRad) * 60;
    const offsetY = Math.sin(dirAngleRad) * 60;
    const burn = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-blast-burn'
    );
    burn.setScale(2).setDepth(10).setAlpha(0.9);
    burn.play('anim-blast-burn');
    const followBurn = (): void => {
      if (burn.active) burn.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followBurn);

    // Ativar hit detection continua ANTES do tween
    this.activeCone = {
      sprite: burn,
      hitEnemies: new Set(),
      dirAngleRad,
      followFn: followBurn,
    };

    this.scene.tweens.add({
      targets: burn,
      scale: 3,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        this.scene.events.off('update', followBurn);
        this.activeCone = null;
        burn.destroy();
      },
    });

    // Particulas complementares
    if (shouldShowVfx()) {
      const particles1 = this.scene.add.particles(this.player.x, this.player.y, 'fire-particle', {
        speed: { min: 200, max: 400 },
        angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
        lifespan: 400,
        quantity: getVfxQuantity(25),
        scale: { start: 3, end: 0.3 },
        tint: [0xff0000, 0xff2200, 0xff6600, 0xffaa00],
        emitting: false,
      });
      particles1.explode();
      this.scene.time.delayedCall(500, () => particles1.destroy());
    }

    // Shake da camera
    this.scene.cameras.main.shake(200, 0.005);
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

      // Inimigos muito perto sempre sao atingidos (evita bug de angulo a dist ~0)
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
    this.damage += 15;
    this.range += 25;
    this.cooldown = Math.max(2000, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    if (this.activeCone) {
      this.scene.events.off('update', this.activeCone.followFn);
      if (this.activeCone.sprite.active) this.activeCone.sprite.destroy();
      this.activeCone = null;
    }
  }
}
