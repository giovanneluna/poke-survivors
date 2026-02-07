import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Dragon Pulse: beam dracônico que perfura tudo.
 * Evolução de Dragon Breath + Dragon Fang.
 * Projétil largo que atravessa todos os inimigos na linha.
 */
export class DragonPulse implements Attack {
  readonly type = 'dragonPulse' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private beamWidth = 35;
  private beamLength = 250;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.dragonPulse.baseDamage;
    this.cooldown = ATTACKS.dragonPulse.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const angle = Math.atan2(dir.y, dir.x);
    const endX = this.player.x + Math.cos(angle) * this.beamLength;
    const endY = this.player.y + Math.sin(angle) * this.beamLength;

    // Visual: sprites animados de dragon pulse ao longo do beam
    const pulseCount = 4;
    for (let i = 0; i < pulseCount; i++) {
      const t = (i + 0.5) / pulseCount;
      const px = this.player.x + (endX - this.player.x) * t;
      const py = this.player.y + (endY - this.player.y) * t;
      this.scene.time.delayedCall(i * 40, () => {
        const pulseSprite = this.scene.add.sprite(px, py, 'atk-dragon-pulse');
        pulseSprite.setScale(1.5).setDepth(10).setAlpha(0.85);
        pulseSprite.setRotation(angle);
        pulseSprite.play('anim-dragon-pulse');
        pulseSprite.once('animationcomplete', () => pulseSprite.destroy());
      });
    }

    // Partículas ao longo do beam
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = this.player.x + (endX - this.player.x) * t;
      const py = this.player.y + (endY - this.player.y) * t;
      this.scene.add.particles(px, py, 'dragon-particle', {
        speed: { min: 20, max: 60 }, lifespan: 250, quantity: 3,
        scale: { start: 1.5, end: 0 }, tint: [0x7744ff, 0x9966ff, 0xcc88ff],
        emitting: false,
      }).explode();
    }

    // Dano: todos na linha (pierce infinito)
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    const startX = this.player.x;
    const startY = this.player.y;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);

    for (const enemySprite of enemies) {
      // Distância perpendicular à linha
      const perpDist = Math.abs(
        (dy * (enemySprite.x - startX) - dx * (enemySprite.y - startY)) / len
      );
      if (perpDist > this.beamWidth / 2 + 10) continue;

      // Projeção na direção do beam (só para frente)
      const projT = ((enemySprite.x - startX) * dx + (enemySprite.y - startY) * dy) / (len * len);
      if (projT < -0.05 || projT > 1.05) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.beamWidth += 5;
    this.beamLength += 20;
    this.cooldown = Math.max(800, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
