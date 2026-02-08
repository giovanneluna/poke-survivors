import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Body Slam 2: dash pesado na direcao do movimento (Bulbasaur line).
 * Evolucao de tackle. Usa sprite unico com setRotation (sem variantes direcionais).
 * Inimigos atingidos ficam stunned (velocity 0) com tint amarelo.
 * Jogador ganha speed boost temporario.
 */
export class BodySlam2 implements Attack {
  readonly type = 'bodySlam2' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 100;
  private stunDuration = 500;
  private readonly dashWidth = 30;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.bodySlam2.baseDamage;
    this.cooldown = ATTACKS.bodySlam2.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  private dash(): void {
    const dir = this.player.getLastDirection();
    const angle = Math.atan2(dir.y, dir.x);

    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * this.dashDistance;
    const endY = startY + Math.sin(angle) * this.dashDistance;

    // Sprite com rotacao (sem variantes direcionais)
    const slamSprite = this.scene.add.sprite(this.player.x, this.player.y, 'atk-wood-hammer');
    slamSprite.setRotation(angle);
    slamSprite.setDepth(10).setAlpha(0.9);
    slamSprite.play('anim-wood-hammer');

    // Sprite segue o jogador
    const followSlam = (): void => {
      if (slamSprite.active) {
        slamSprite.setPosition(this.player.x, this.player.y);
      }
    };
    this.scene.events.on('update', followSlam);
    slamSprite.once('animationcomplete', () => {
      this.scene.events.off('update', followSlam);
      slamSprite.destroy();
    });

    // Trail de impacto ao longo do caminho
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;

      this.scene.time.delayedCall(i * 30, () => {
        this.scene.add.particles(px, py, 'fire-particle', {
          speed: { min: 15, max: 40 },
          lifespan: 250,
          quantity: 3,
          scale: { start: 1.2, end: 0 },
          tint: [0xccddff, 0xffffff, 0x88bbff],
          emitting: false,
        }).explode();
      });
    }

    // Dano a inimigos no caminho (perpendicular distance check)
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);

    for (const enemySprite of enemies) {
      // Verificar se esta perto da linha de dash
      const distToMid = Phaser.Math.Distance.Between(
        enemySprite.x, enemySprite.y,
        (startX + endX) / 2, (startY + endY) / 2
      );
      if (distToMid > this.dashDistance * 0.7) continue;

      if (len === 0) continue;
      const perpDist = Math.abs(
        (dy * (enemySprite.x - startX) - dx * (enemySprite.y - startY)) / len
      );
      if (perpDist > this.dashWidth) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }

      // Stun: zera velocidade e aplica tint amarelo
      const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.set(0, 0);
        enemySprite.setTint(0xffffaa);
        this.scene.time.delayedCall(this.stunDuration, () => {
          if (enemySprite.active) enemySprite.clearTint();
        });
      }
    }

    // Speed boost temporario
    this.player.stats.speed = Math.floor(this.player.stats.baseSpeed * 1.3);
    this.scene.time.delayedCall(500, () => {
      this.player.stats.speed = this.player.stats.baseSpeed;
    });
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.dashDistance += 15;
    this.stunDuration += 100;
    this.cooldown = Math.max(1200, this.cooldown - 100);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
