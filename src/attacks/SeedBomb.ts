import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Seed Bomb: sementes explosivas em posicoes aleatorias perto do jogador.
 * Evolucao de leechSeed. Spawna N bombas que explodem em AoE.
 * Cada bomba toca a animacao seed-flare e ao completar, aplica dano em raio.
 */
export class SeedBomb implements Attack {
  readonly type = 'seedBomb' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bombCount = 3;
  private explosionRadius = 50;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.seedBomb.baseDamage;
    this.cooldown = ATTACKS.seedBomb.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.launch(),
    });
  }

  private launch(): void {
    for (let i = 0; i < this.bombCount; i++) {
      // Posicao aleatoria entre 40 e 80px do jogador
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 40;
      const bx = this.player.x + Math.cos(angle) * dist;
      const by = this.player.y + Math.sin(angle) * dist;

      // Stagger o spawn para efeito visual
      this.scene.time.delayedCall(i * 100, () => {
        const bomb = this.scene.add.sprite(bx, by, 'atk-seed-flare');
        bomb.setScale(1.0).setDepth(10).setAlpha(0.9);
        bomb.play('anim-seed-flare');

        bomb.once('animationcomplete', () => {
          // Explosao visual
          safeExplode(this.scene, bx, by, 'fire-particle', {
            speed: { min: 40, max: 100 },
            lifespan: 300,
            quantity: 10,
            scale: { start: 2, end: 0 },
            tint: [0x44dd66, 0x88ff44, 0xaaff66],
            angle: { min: 0, max: 360 },
          });

          // Circulo de impacto
          if (shouldShowVfx()) {
            const ring = this.scene.add.circle(bx, by, this.explosionRadius * 0.6, 0x44dd66, 0.3);
            ring.setDepth(5);
            this.scene.tweens.add({
              targets: ring,
              alpha: 0,
              scaleX: 1.5,
              scaleY: 1.5,
              duration: 300,
              onComplete: () => ring.destroy(),
            });
          }

          // Dano AoE
          const enemies = getSpatialGrid().queryRadius(bx, by, this.explosionRadius);

          for (const enemy of enemies) {
            if (typeof enemy.takeDamage === 'function') {
              setDamageSource(this.type);
              const killed = enemy.takeDamage(this.damage);
              if (killed) {
                this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
              }
            }
          }

          bomb.destroy();
        });
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    this.explosionRadius += 5;
    // +1 bomb every 3 levels, max 6
    if (this.level % 3 === 0 && this.bombCount < 6) {
      this.bombCount++;
    }
    this.cooldown = Math.max(800, this.cooldown - 80);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.launch(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
