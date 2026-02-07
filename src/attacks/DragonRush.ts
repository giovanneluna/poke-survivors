import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Dragon Rush: carga dracônica com stun AoE.
 * Evolução de Dragon Claw + Dragon Fang.
 * Dash em direção com explosão dracônica que stuna todos no raio.
 */
export class DragonRush implements Attack {
  readonly type = 'dragonRush' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private chargeDistance = 100;
  private stunRadius = 70;
  private stunDuration = 1200;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.dragonRush.baseDamage;
    this.cooldown = ATTACKS.dragonRush.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.charge(),
    });
  }

  private charge(): void {
    const dir = this.player.getLastDirection();
    const angle = Math.atan2(dir.y, dir.x);

    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * this.chargeDistance;
    const endY = startY + Math.sin(angle) * this.chargeDistance;

    // Trail de energia dracônica
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;
      this.scene.time.delayedCall(i * 25, () => {
        this.scene.add.particles(px, py, 'dragon-particle', {
          speed: { min: 30, max: 80 }, lifespan: 300, quantity: 5,
          scale: { start: 1.5, end: 0 }, tint: [0x7744ff, 0x9966ff],
          emitting: false,
        }).explode();
      });
    }

    // Sprite animado ao longo do dash
    const rushSprite = this.scene.add.sprite(startX, startY, 'atk-dragon-rush');
    rushSprite.setScale(1.2).setDepth(10).setAlpha(0.9);
    rushSprite.setRotation(angle);
    rushSprite.play('anim-dragon-rush');
    this.scene.tweens.add({
      targets: rushSprite, x: endX, y: endY, duration: steps * 25,
    });
    rushSprite.once('animationcomplete', () => rushSprite.destroy());

    // Explosão no ponto final
    this.scene.time.delayedCall(steps * 25, () => {
      this.scene.add.particles(endX, endY, 'dragon-particle', {
        speed: { min: 60, max: 150 }, lifespan: 400, quantity: 15,
        scale: { start: 2, end: 0 }, angle: { min: 0, max: 360 },
        tint: [0x7744ff, 0x9966ff, 0xcc88ff],
        emitting: false,
      }).explode();
    });

    // Dano na linha + AoE stun no final
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      // Dano na linha do dash
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const perpDist = Math.abs(
        (dy * (enemySprite.x - startX) - dx * (enemySprite.y - startY)) / len
      );
      const projT = ((enemySprite.x - startX) * dx + (enemySprite.y - startY) * dy) / (len * len);
      const inLine = perpDist < 25 && projT >= -0.1 && projT <= 1.1;

      // Stun AoE no ponto de impacto
      const distToEnd = Phaser.Math.Distance.Between(enemySprite.x, enemySprite.y, endX, endY);
      const inStunRadius = distToEnd <= this.stunRadius;

      if (!inLine && !inStunRadius) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }

        // Stun para os que estão no raio
        if (!killed && inStunRadius) {
          enemySprite.setTint(0x7744ff);
          const body = enemySprite.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(0, 0);
          this.scene.time.delayedCall(this.stunDuration, () => {
            if (enemySprite.active) enemySprite.clearTint();
          });
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 7;
    this.chargeDistance += 10;
    this.stunRadius += 8;
    this.stunDuration += 150;
    this.cooldown = Math.max(1500, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.charge(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
