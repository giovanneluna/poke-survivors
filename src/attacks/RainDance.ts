import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Rain Dance: chuva continua de dano em area centrada no player.
 * PRIME attack - Blastoise exclusivo.
 * Zona de chuva com particulas caindo + splashes no chao + dano tick.
 */
export class RainDance implements Attack {
  readonly type = 'rainDance' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 120;
  private duration = 3000;
  private readonly tickInterval = 300;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.rainDance.baseDamage;
    this.cooldown = ATTACKS.rainDance.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.summonRain(),
    });
  }

  private summonRain(): void {
    const cx = this.player.x;
    const cy = this.player.y;

    // Texto de ativacao
    const txt = this.scene.add.text(cx, cy - 40, 'RAIN DANCE!', {
      fontSize: '14px',
      color: '#44aaff',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 25,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy(),
    });

    // Zona visual: circulo semi-transparente no chao
    const zoneCircle = this.scene.add.graphics();
    zoneCircle.setDepth(4);
    zoneCircle.fillStyle(0x3388ff, 0.1);
    zoneCircle.fillCircle(cx, cy, this.radius);
    zoneCircle.lineStyle(2, 0x3388ff, 0.3);
    zoneCircle.strokeCircle(cx, cy, this.radius);

    // Emitter de gotas de chuva caindo do alto
    const rainEmitter = this.scene.add.particles(cx, cy - 100, 'water-particle', {
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, this.radius),
        quantity: 1,
      },
      speedY: { min: 200, max: 350 },
      speedX: { min: -15, max: 15 },
      lifespan: 600,
      scale: { start: 0.8, end: 0.3 },
      quantity: 4,
      frequency: 60,
      tint: [0x3388ff, 0x44aaff, 0x66ccff],
      alpha: { start: 0.8, end: 0.3 },
    });

    // Tick de dano + splashes de agua no chao
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: this.tickInterval,
      loop: true,
      callback: () => {
        elapsed += this.tickInterval;
        if (elapsed >= this.duration) {
          cleanup();
          return;
        }

        // Splash visual em posicoes aleatorias dentro do raio
        const splashCount = 3;
        for (let i = 0; i < splashCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * this.radius;
          const sx = cx + Math.cos(angle) * dist;
          const sy = cy + Math.sin(angle) * dist;

          // Mini splash
          this.scene.add.particles(sx, sy, 'water-particle', {
            speed: { min: 20, max: 50 },
            angle: { min: 200, max: 340 },
            lifespan: 200,
            quantity: 3,
            scale: { start: 0.8, end: 0 },
            tint: [0x3388ff, 0x66ccff],
            emitting: false,
          }).explode();
        }

        // Dano em todos os inimigos na zona
        const enemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        for (const enemySprite of enemies) {
          const dist = Phaser.Math.Distance.Between(cx, cy, enemySprite.x, enemySprite.y);
          if (dist > this.radius) continue;

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
      rainEmitter.destroy();
      this.scene.tweens.add({
        targets: zoneCircle,
        alpha: 0,
        duration: 300,
        onComplete: () => zoneCircle.destroy(),
      });
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.radius += 12;
    this.duration += 300;
    this.cooldown = Math.max(3000, this.cooldown - 300);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.summonRain(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
