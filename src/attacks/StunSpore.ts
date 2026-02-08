import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Stun Spore: esporos paralisantes em área no inimigo mais próximo.
 * Padrão area (Hurricane-like) — spawna no inimigo mais perto,
 * aplica dano + stun (velocity 0) por duração.
 * Ivysaur (stage1).
 */
export class StunSpore implements Attack {
  readonly type = 'stunSpore' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 60;
  private stunDuration = 1000;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.stunSpore.baseDamage;
    this.cooldown = ATTACKS.stunSpore.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.release(),
    });
  }

  private release(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Encontra inimigo mais próximo
    const nearest = enemies.reduce((best, e) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      const bd = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
      return d < bd ? e : best;
    });

    const tx = nearest.x;
    const ty = nearest.y;

    // Visual: sprite de esporo no local
    const spore = this.scene.add.sprite(tx, ty, 'atk-stun-spore');
    spore.setScale(1.5).setDepth(9).setAlpha(0.9);
    spore.play('anim-stun-spore');

    // Fade out após animação
    spore.once('animationcomplete', () => {
      this.scene.tweens.add({
        targets: spore,
        alpha: 0,
        duration: 300,
        onComplete: () => spore.destroy(),
      });
    });

    // Aplica dano + stun a todos inimigos no raio
    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(tx, ty, enemySprite.x, enemySprite.y);
      if (dist > this.radius) continue;

      // Dano
      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          continue;
        }
      }

      // Stun: velocity 0 + tint amarelo
      const body = enemySprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.set(0, 0);
      enemySprite.setTint(0xffcc00);

      // Remove stun após duração
      this.scene.time.delayedCall(this.stunDuration, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.radius += 10;
    this.stunDuration += 150;
    this.cooldown = Math.max(3500, this.cooldown - 300);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.release(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
