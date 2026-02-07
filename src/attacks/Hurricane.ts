import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Hurricane: tornado que puxa inimigos para o centro.
 * Spawna em posição aleatória próxima, puxa e causa dano contínuo.
 * Charizard tier (minForm: stage2).
 */
export class Hurricane implements Attack {
  readonly type = 'hurricane' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 80;
  private pullForce = 100;
  private duration = 3000;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.hurricane.baseDamage;
    this.cooldown = ATTACKS.hurricane.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.summon(),
    });
  }

  private summon(): void {
    // Spawna tornado perto do cluster de inimigos mais denso
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Posição: média dos inimigos próximos ou inimigo mais perto
    let tx = this.player.x + Phaser.Math.Between(-100, 100);
    let ty = this.player.y + Phaser.Math.Between(-100, 100);
    if (enemies.length > 0) {
      const nearest = enemies.reduce((best, e) => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
        const bd = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
        return d < bd ? e : best;
      });
      tx = nearest.x;
      ty = nearest.y;
    }

    // Visual: tornado animado
    const tornado = this.scene.add.sprite(tx, ty, 'atk-hurricane');
    tornado.setScale(1.2).setDepth(9).setAlpha(0.8);
    tornado.play('anim-hurricane');

    // Escala do tornado (cresce e depois encolhe)
    this.scene.tweens.add({
      targets: tornado,
      scale: { from: 0.5, to: 1.8 },
      alpha: { from: 0.9, to: 0.5 },
      duration: this.duration,
      ease: 'Sine.easeInOut',
    });

    // Partículas de vento
    const windEmitter = this.scene.add.particles(tx, ty, 'wind-particle', {
      speed: { min: 20, max: 80 }, lifespan: 400, quantity: 3, frequency: 80,
      scale: { start: 1.5, end: 0 }, tint: [0x88ccff, 0xaaddff, 0xffffff],
      angle: { min: 0, max: 360 },
    });

    // Tick de dano + pull a cada 200ms
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        elapsed += 200;
        if (elapsed >= this.duration) {
          cleanup();
          return;
        }

        const aliveEnemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        for (const enemySprite of aliveEnemies) {
          const dist = Phaser.Math.Distance.Between(tx, ty, enemySprite.x, enemySprite.y);
          if (dist > this.radius) continue;

          // Pull para o centro
          const angleToCenter = Math.atan2(ty - enemySprite.y, tx - enemySprite.x);
          const body = enemySprite.body as Phaser.Physics.Arcade.Body;
          body.velocity.x += Math.cos(angleToCenter) * this.pullForce;
          body.velocity.y += Math.sin(angleToCenter) * this.pullForce;

          // Dano
          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
            }
          }
        }
      },
    });

    const cleanup = () => {
      tickEvent.destroy();
      windEmitter.destroy();
      this.scene.tweens.add({
        targets: tornado, alpha: 0, scale: 0.3, duration: 300,
        onComplete: () => tornado.destroy(),
      });
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.radius += 10;
    this.pullForce += 15;
    this.duration += 300;
    this.cooldown = Math.max(3500, this.cooldown - 300);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.summon(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
