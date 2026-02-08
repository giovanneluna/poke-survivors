import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Sludge Wave 2: onda toxica 360 graus expansiva a partir do jogador.
 * Evolucao de sludgeBomb. Sprite escala de 0.5 a 4.0, alpha fade.
 * Aplica dano uma vez em todos inimigos no raio + tint roxo temporario.
 */
export class SludgeWave2 implements Attack {
  readonly type = 'sludgeWave2' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 100;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.sludgeWave2.baseDamage;
    this.cooldown = ATTACKS.sludgeWave2.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.wave(),
    });
  }

  private wave(): void {
    const cx = this.player.x;
    const cy = this.player.y;

    // Sprite animado de sludge wave, expande via tween
    const waveSprite = this.scene.add.sprite(cx, cy, 'atk-sludge-wave');
    waveSprite.setScale(0.5).setDepth(9).setAlpha(0.8);
    waveSprite.play('anim-sludge-wave');

    this.scene.tweens.add({
      targets: waveSprite,
      scale: 4.0,
      alpha: 0.2,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => waveSprite.destroy(),
    });

    // Particulas roxas em 8 direcoes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const angleDeg = Phaser.Math.RadToDeg(angle);
      this.scene.add.particles(cx, cy, 'fire-particle', {
        speed: { min: 80, max: 180 },
        angle: { min: angleDeg - 15, max: angleDeg + 15 },
        lifespan: 350,
        quantity: 3,
        scale: { start: 2, end: 0 },
        tint: [0x9944cc, 0xbb66dd, 0x7733aa],
        emitting: false,
      }).explode();
    }

    // Dano: aplica uma vez em todos inimigos no raio
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(cx, cy, enemySprite.x, enemySprite.y);
      if (dist > this.radius) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }

      // Poison visual: tint roxo por 500ms
      enemySprite.setTint(0x9944cc);
      this.scene.time.delayedCall(500, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.radius += 15;
    this.cooldown = Math.max(1500, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.wave(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
