import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Solar Blade: lamina solar com brilho dourado e alta chance de critico.
 * Evolucao de leafBlade. Padrao cone com setRotation.
 * Tint dourado 0xffdd44, 40% crit base com 2x multiplicador.
 */
export class SolarBlade implements Attack {
  readonly type = 'solarBlade' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 70;
  private critChance = 0.4;
  private readonly critMultiplier = 2.0;
  private readonly arcAngleDeg = 80;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.solarBlade.baseDamage;
    this.cooldown = ATTACKS.solarBlade.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slash(),
    });
  }

  private slash(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? Math.floor(this.damage * this.critMultiplier) : this.damage;

    // Visual: sprite com tint dourado, rotacionado na direcao do ataque
    const offsetX = Math.cos(dirAngleRad) * 35;
    const offsetY = Math.sin(dirAngleRad) * 35;
    const blade = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-solar-blade'
    );
    blade.setScale(isCrit ? 1.8 : 1.4).setDepth(10).setAlpha(0.95);
    blade.setTint(0xffdd44);
    blade.setRotation(dirAngleRad);
    blade.play('anim-solar-blade');

    // Sprite segue o jogador
    const followBlade = (): void => {
      if (blade.active) blade.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followBlade);
    blade.once('animationcomplete', () => {
      this.scene.events.off('update', followBlade);
      blade.destroy();
    });

    // Particulas douradas ao longo do arco
    const angleDeg = Phaser.Math.RadToDeg(dirAngleRad);
    this.scene.add.particles(this.player.x + offsetX, this.player.y + offsetY, 'fire-particle', {
      speed: { min: 60, max: 120 },
      angle: { min: angleDeg - this.arcAngleDeg / 2, max: angleDeg + this.arcAngleDeg / 2 },
      lifespan: 250,
      quantity: 8,
      scale: { start: 1.5, end: 0 },
      tint: [0xffdd44, 0xffaa22, 0xffee66],
      emitting: false,
    }).explode();

    // Texto de crit
    if (isCrit) {
      const critText = this.scene.add.text(this.player.x, this.player.y - 25, 'CRIT!', {
        fontSize: '14px', color: '#ffdd44', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: critText, y: critText.y - 20, alpha: 0, duration: 600,
        onComplete: () => critText.destroy(),
      });
    }

    // Dano em arco
    const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.range);

    for (const enemy of enemies) {
      const angleToEnemy = Math.atan2(
        enemy.y - this.player.y, enemy.x - this.player.x
      );
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(finalDamage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.range += 5;
    this.critChance = Math.min(0.7, this.critChance + 0.03);
    this.cooldown = Math.max(600, this.cooldown - 60);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.slash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
