import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Fire Fang: mordida flamejante no inimigo mais próximo.
 * Equivalente ao "Garlic" do Vampire Survivors (melee próximo).
 * Teleport-strike: efeito visual na posição do inimigo.
 */
export class FireFang implements Attack {
  readonly type = 'fireFang' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private range = 70;
  private burnChance = 0.2;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.fireFang.baseDamage;
    this.cooldown = ATTACKS.fireFang.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.bite(),
    });
  }

  private bite(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Encontra o inimigo mais próximo dentro do range
    let closest: Phaser.Physics.Arcade.Sprite | null = null;
    let closestDist = Infinity;
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < closestDist && dist <= this.range) {
        closest = enemy;
        closestDist = dist;
      }
    }
    if (!closest) return;

    // Visual: fire fang animado na posição do inimigo
    const fang = this.scene.add.sprite(closest.x, closest.y - 5, 'atk-fire-fang');
    fang.setScale(1.2).setDepth(10).setAlpha(0.9);
    fang.play('anim-fire-fang');
    fang.once('animationcomplete', () => fang.destroy());

    // Partículas de fogo
    this.scene.add.particles(closest.x, closest.y, 'fire-particle', {
      speed: { min: 20, max: 60 }, lifespan: 200, quantity: 5,
      scale: { start: 1.2, end: 0 }, tint: [0xff6600, 0xff4400],
      emitting: false,
    }).explode();

    // Dano
    const enemy = closest as unknown as Enemy;
    if (typeof enemy.takeDamage === 'function') {
      const killed = enemy.takeDamage(this.damage);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', closest.x, closest.y, enemy.xpValue);
      }
      // Burn effect (visual tint)
      if (!killed && Math.random() < this.burnChance) {
        closest.setTint(0xff4400);
        this.scene.time.delayedCall(2000, () => {
          if (closest && closest.active) closest.clearTint();
        });
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.range += 8;
    this.burnChance = Math.min(0.6, this.burnChance + 0.05);
    this.cooldown = Math.max(500, this.cooldown - 60);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.bite(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
