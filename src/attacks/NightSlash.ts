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
  finalDamage: number;
}

/**
 * Night Slash: garrada sombria com 50% crit chance.
 * Evolucao de Slash + Scope Lens.
 * Arco amplo com alta probabilidade de critico devastador.
 * Dano aplicado continuamente durante a animacao (segue o jogador).
 */
export class NightSlash implements Attack {
  readonly type = 'nightSlash' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 80;
  private critChance = 0.5;
  private critMultiplier = 2.2;
  private readonly arcAngleDeg = 140;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.nightSlash.baseDamage;
    this.cooldown = ATTACKS.nightSlash.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  private swipe(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? Math.floor(this.damage * this.critMultiplier) : this.damage;

    // Visual: arco sombrio (escuro com brilho roxo se crit)
    const offsetX = Math.cos(dirAngleRad) * 35;
    const offsetY = Math.sin(dirAngleRad) * 35;
    const arc = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-night-slash'
    );
    const color = isCrit ? 0xcc44ff : 0x444466;
    arc.setScale(isCrit ? 1.6 : 1.2).setDepth(10).setAlpha(0.9).setTint(color);
    arc.setRotation(dirAngleRad);
    arc.play('anim-night-slash');
    const followArc = (): void => {
      if (arc.active) arc.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followArc);

    // Ativar hit detection continua
    this.activeCone = {
      sprite: arc,
      hitEnemies: new Set(),
      dirAngleRad,
      finalDamage,
    };

    arc.once('animationcomplete', () => {
      this.scene.events.off('update', followArc);
      this.activeCone = null;
      arc.destroy();
    });

    // Particulas sombrias
    const particles = this.scene.add.particles(this.player.x + offsetX, this.player.y + offsetY, 'fire-particle', {
      speed: { min: 30, max: 80 }, lifespan: 200, quantity: 6,
      scale: { start: 1.2, end: 0 }, tint: [0x333355, 0x444466, 0x6644aa],
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(300, () => particles.destroy());

    // Texto de crit grande
    if (isCrit) {
      const critText = this.scene.add.text(this.player.x, this.player.y - 25, 'CRITICAL!', {
        fontSize: '14px', color: '#cc44ff', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: critText, y: critText.y - 25, alpha: 0, duration: 700,
        onComplete: () => critText.destroy(),
      });
    }
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleRad, finalDamage } = this.activeCone;
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
          Phaser.Math.RadToDeg(angleToEnemy)
        )
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
    this.critChance = Math.min(0.75, this.critChance + 0.03);
    this.critMultiplier += 0.1;
    this.cooldown = Math.max(350, this.cooldown - 40);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.swipe(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeCone = null;
  }
}
