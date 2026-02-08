import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Whirlpool: vórtice de agua que prende e puxa inimigos.
 * Spawna na posicao do inimigo mais proximo, causa tick damage e aplica slow ao sair.
 * Procedural visual com circulo rotante + particulas de agua.
 * Wartortle tier (minForm: stage1).
 */
export class Whirlpool implements Attack {
  readonly type = 'whirlpool' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 70;
  private pullForce = 80;
  private duration = 2500;
  private readonly slowMultiplier = 0.4;
  private readonly slowDurationMs = 1000;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.whirlpool.baseDamage;
    this.cooldown = ATTACKS.whirlpool.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.summon(),
    });
  }

  private summon(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Spawna na posicao do inimigo mais proximo
    const nearest = enemies.reduce((best, e) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      const bd = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
      return d < bd ? e : best;
    });
    const tx = nearest.x;
    const ty = nearest.y;

    // Visual procedural: circulo de agua rotante
    const vortex = this.scene.add.circle(tx, ty, this.radius, 0x3388ff, 0.3);
    vortex.setDepth(7);
    vortex.setStrokeStyle(2, 0x44aaff, 0.6);

    // Anel interno rotante
    const innerRing = this.scene.add.circle(tx, ty, this.radius * 0.5, 0x44aaff, 0.2);
    innerRing.setDepth(7);
    innerRing.setStrokeStyle(1, 0x66ccff, 0.5);

    // Rotacao e scaling do vortex
    this.scene.tweens.add({
      targets: vortex,
      scale: { from: 0.4, to: 1.2 },
      alpha: { from: 0.4, to: 0.2 },
      duration: this.duration,
      ease: 'Sine.easeInOut',
    });

    this.scene.tweens.add({
      targets: innerRing,
      angle: 720,
      scale: { from: 0.3, to: 1 },
      alpha: { from: 0.3, to: 0.1 },
      duration: this.duration,
      ease: 'Sine.easeInOut',
    });

    // Particulas de agua girando ao redor do centro
    const waterEmitter = this.scene.add.particles(tx, ty, 'water-particle', {
      speed: { min: 20, max: 60 },
      lifespan: 400,
      quantity: 3,
      frequency: 80,
      scale: { start: 1.5, end: 0 },
      tint: [0x3388ff, 0x44aaff, 0x66ccff],
      angle: { min: 0, max: 360 },
    });

    // Track de inimigos que estao dentro do vortex (para aplicar slow ao sair)
    const enemiesInside = new Set<Phaser.Physics.Arcade.Sprite>();

    // Tick de dano + pull a cada 250ms
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: 250, loop: true,
      callback: () => {
        elapsed += 250;
        if (elapsed >= this.duration) {
          cleanup();
          return;
        }

        const aliveEnemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        // Detecta quem saiu do vortex para aplicar slow
        const currentInside = new Set<Phaser.Physics.Arcade.Sprite>();

        for (const enemySprite of aliveEnemies) {
          const dist = Phaser.Math.Distance.Between(tx, ty, enemySprite.x, enemySprite.y);

          if (dist <= this.radius) {
            currentInside.add(enemySprite);
            enemiesInside.add(enemySprite);

            // Pull para o centro
            const angleToCenter = Math.atan2(ty - enemySprite.y, tx - enemySprite.x);
            const body = enemySprite.body as Phaser.Physics.Arcade.Body;
            body.velocity.x += Math.cos(angleToCenter) * this.pullForce;
            body.velocity.y += Math.sin(angleToCenter) * this.pullForce;

            // Tint azul enquanto dentro
            enemySprite.setTint(0x4488ff);

            // Tick damage
            const enemy = enemySprite as unknown as Enemy;
            if (typeof enemy.takeDamage === 'function') {
              const killed = enemy.takeDamage(this.damage);
              if (killed) {
                this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
                enemiesInside.delete(enemySprite);
              }
            }
          }
        }

        // Aplica slow nos que sairam do raio
        for (const prevEnemy of enemiesInside) {
          if (!currentInside.has(prevEnemy) && prevEnemy.active) {
            this.applySlow(prevEnemy);
            enemiesInside.delete(prevEnemy);
          }
        }
      },
    });

    const cleanup = () => {
      tickEvent.destroy();
      waterEmitter.destroy();

      // Aplica slow em todos que ainda estao dentro ao terminar
      for (const enemySprite of enemiesInside) {
        if (enemySprite.active) {
          this.applySlow(enemySprite);
          enemySprite.clearTint();
        }
      }
      enemiesInside.clear();

      // Fade out visual
      this.scene.tweens.add({
        targets: [vortex, innerRing],
        alpha: 0, scale: 0.3, duration: 300,
        onComplete: () => {
          vortex.destroy();
          innerRing.destroy();
        },
      });
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  /**
   * Aplica slow de 40% por 1s no inimigo via velocity reduction.
   * O moveToward() do proximo frame restaura a velocidade natural,
   * mas o slow visual + reducao momentanea cria o efeito desejado.
   */
  private applySlow(enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const body = enemySprite.body as Phaser.Physics.Arcade.Body;
    body.velocity.x *= this.slowMultiplier;
    body.velocity.y *= this.slowMultiplier;
    enemySprite.setTint(0x6688cc);

    this.scene.time.delayedCall(this.slowDurationMs, () => {
      if (enemySprite.active) {
        enemySprite.clearTint();
      }
    });
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.radius += 8;
    this.pullForce += 10;
    this.duration += 300;
    this.cooldown = Math.max(2500, this.cooldown - 300);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.summon(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
