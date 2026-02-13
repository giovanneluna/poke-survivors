import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';


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
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 70;
  private pullForce = 80;
  private duration = 2500;
  private readonly slowMultiplier = 0.4;
  private readonly slowDurationMs = 1000;
  private pendingCleanups: Array<() => void> = [];

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.whirlpool.baseDamage;
    this.cooldown = ATTACKS.whirlpool.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.summon(),
    });
  }

  private summon(): void {
    const activeEnemies = getSpatialGrid().getActiveEnemies();
    if (activeEnemies.length === 0) return;

    // Spawna na posicao do inimigo mais proximo
    const nearest = activeEnemies.reduce((best, e) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      const bd = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
      return d < bd ? e : best;
    });
    const tx = nearest.x;
    const ty = nearest.y;

    // Visual: animated whirlpool sprite
    const vortexScale = this.radius / 48; // atk-whirlpool-tibia is 96×96, radius is ~70
    const vortex = this.scene.add.sprite(tx, ty, 'atk-whirlpool-tibia');
    vortex.setDepth(7).setScale(vortexScale).setAlpha(0.85);
    vortex.play('anim-whirlpool-tibia');

    // Spinning + scale pulse
    this.scene.tweens.add({
      targets: vortex,
      angle: 720,
      scale: { from: vortexScale * 0.5, to: vortexScale * 1.2 },
      alpha: { from: 0.9, to: 0.4 },
      duration: this.duration,
      ease: 'Sine.easeInOut',
    });

    // Inner rings overlay
    const innerRing = this.scene.add.sprite(tx, ty, 'atk-whirlpool-rings');
    innerRing.setDepth(8).setScale(vortexScale * 1.5).setAlpha(0.6);
    innerRing.play('anim-whirlpool-rings');

    this.scene.tweens.add({
      targets: innerRing,
      angle: -360,
      alpha: { from: 0.6, to: 0.2 },
      duration: this.duration,
      ease: 'Sine.easeInOut',
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

        const aliveEnemies = getSpatialGrid().queryRadius(tx, ty, this.radius);

        // Detecta quem saiu do vortex para aplicar slow
        const currentInside = new Set<Phaser.Physics.Arcade.Sprite>();

        for (const enemy of aliveEnemies) {
          currentInside.add(enemy);
          enemiesInside.add(enemy);

          // Pull para o centro
          const body = enemy.body as Phaser.Physics.Arcade.Body | null;
          if (body) {
            const angleToCenter = Math.atan2(ty - enemy.y, tx - enemy.x);
            body.velocity.x += Math.cos(angleToCenter) * this.pullForce;
            body.velocity.y += Math.sin(angleToCenter) * this.pullForce;
          }

          // Tint azul enquanto dentro
          enemy.setTint(0x4488ff);

          // Tick damage
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
              enemiesInside.delete(enemy);
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

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      tickEvent.destroy();

      // Aplica slow em todos que ainda estao dentro ao terminar
      for (const enemySprite of enemiesInside) {
        if (enemySprite.active) {
          this.applySlow(enemySprite);
          enemySprite.clearTint();
        }
      }
      enemiesInside.clear();

      // Fade out visual
      if (vortex.active) {
        this.scene.tweens.add({
          targets: [vortex, innerRing],
          alpha: 0, scale: 0.3, duration: 300,
          onComplete: () => {
            if (vortex.active) vortex.destroy();
            if (innerRing.active) innerRing.destroy();
          },
        });
      }
      const idx = this.pendingCleanups.indexOf(cleanup);
      if (idx !== -1) this.pendingCleanups.splice(idx, 1);
    };
    this.pendingCleanups.push(cleanup);

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  /**
   * Aplica slow de 40% por 1s no inimigo via velocity reduction.
   * O moveToward() do proximo frame restaura a velocidade natural,
   * mas o slow visual + reducao momentanea cria o efeito desejado.
   */
  private applySlow(enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const body = enemySprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    body.velocity.x *= this.slowMultiplier;
    body.velocity.y *= this.slowMultiplier;
    enemySprite.setTint(0x6688cc);

    this.scene.time.delayedCall(this.slowDurationMs, () => {
      if (enemySprite.active) enemySprite.clearTint();
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
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.summon(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    for (const fn of [...this.pendingCleanups]) fn();
    this.pendingCleanups.length = 0;
  }
}
