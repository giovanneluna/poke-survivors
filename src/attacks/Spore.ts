import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Spore: esporos perfeitos com 100% stun em area.
 * Evolucao de sleepPowder. Puro controle (dano 0 base).
 * Spawna na posicao do jogador, aplica stun (velocity 0, green tint)
 * em TODOS inimigos no raio. Apos duracao, inimigos retornam ao normal.
 */
export class Spore implements Attack {
  readonly type = 'spore' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private cooldown: number;
  private radius = 90;
  private stunDuration = 1500;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.cooldown = ATTACKS.spore.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.release(),
    });
  }

  private release(): void {
    const cx = this.player.x;
    const cy = this.player.y;

    // Sprite animado de esporos
    const sporeSprite = this.scene.add.sprite(cx, cy, 'atk-aromatherapy');
    sporeSprite.setScale(1.5).setDepth(9).setAlpha(0.8);
    sporeSprite.play('anim-aromatherapy');
    sporeSprite.once('animationcomplete', () => {
      this.scene.tweens.add({
        targets: sporeSprite,
        alpha: 0,
        duration: 300,
        onComplete: () => sporeSprite.destroy(),
      });
    });

    // Circulo indicador de area
    const areaIndicator = this.scene.add.circle(cx, cy, this.radius, 0x66bb66, 0.15);
    areaIndicator.setDepth(5);
    this.scene.tweens.add({
      targets: areaIndicator,
      alpha: 0,
      duration: 800,
      onComplete: () => areaIndicator.destroy(),
    });

    // Particulas verdes de esporos
    this.scene.add.particles(cx, cy, 'fire-particle', {
      speed: { min: 20, max: 60 },
      lifespan: 500,
      quantity: 15,
      scale: { start: 1.5, end: 0 },
      tint: [0x66bb66, 0x88dd88, 0xaaffaa],
      angle: { min: 0, max: 360 },
      emitting: false,
    }).explode();

    // Stun todos inimigos no raio
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(cx, cy, enemySprite.x, enemySprite.y);
      if (dist > this.radius) continue;

      // Stun: zera velocidade, aplica tint verde
      const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.set(0, 0);
        enemySprite.setTint(0x66bb66);

        // Texto "ZZZ" flutuante
        const zzz = this.scene.add.text(enemySprite.x, enemySprite.y - 15, 'ZZZ', {
          fontSize: '10px', color: '#88dd88', fontFamily: 'monospace',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(50);
        this.scene.tweens.add({
          targets: zzz, y: zzz.y - 15, alpha: 0, duration: this.stunDuration,
          onComplete: () => zzz.destroy(),
        });

        // Restaurar apos a duracao do stun
        this.scene.time.delayedCall(this.stunDuration, () => {
          if (enemySprite.active) {
            enemySprite.clearTint();
          }
        });
      }

      // Dano (0 base, mas pode escalar com upgrade se necessario)
      const baseDmg = ATTACKS.spore.baseDamage;
      if (baseDmg > 0) {
        const enemy = enemySprite as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(baseDmg);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          }
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.radius += 12;
    this.stunDuration += 200;
    this.cooldown = Math.max(2500, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.release(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
