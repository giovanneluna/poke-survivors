import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Flame Charge: dash em chamas na direção do movimento.
 * O jogador avança rapidamente, causando dano e ganhando speed boost temporário.
 * Equivalente ao "Lightning Ring" dash.
 */
export class FlameCharge implements Attack {
  readonly type = 'flameCharge' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 80;
  private speedBoost = 0.15;
  private speedBoostDuration = 2000;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.flameCharge.baseDamage;
    this.cooldown = ATTACKS.flameCharge.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  private dash(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(dirAngleRad) * this.dashDistance;
    const endY = startY + Math.sin(dirAngleRad) * this.dashDistance;

    // Sprite animado do flame charge na posição do dash
    const chargeSprite = this.scene.add.sprite(startX, startY, 'atk-flame-charge');
    chargeSprite.setScale(1).setDepth(10).setAlpha(0.9);
    chargeSprite.setRotation(dirAngleRad - Math.PI / 2);
    chargeSprite.play('anim-flame-charge');
    this.scene.tweens.add({
      targets: chargeSprite, x: endX, y: endY, duration: 150,
    });
    chargeSprite.once('animationcomplete', () => chargeSprite.destroy());

    // Trail de fogo ao longo do caminho
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;

      this.scene.time.delayedCall(i * 30, () => {
        this.scene.add.particles(px, py, 'fire-particle', {
          speed: { min: 20, max: 60 }, lifespan: 300, quantity: 4,
          scale: { start: 1.5, end: 0 }, tint: [0xff4400, 0xff6600, 0xffaa00],
          emitting: false,
        }).explode();
      });
    }

    // Dano a inimigos no caminho
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      // Verificar se o inimigo está perto da linha do dash
      const distToLine = Phaser.Math.Distance.Between(
        enemySprite.x, enemySprite.y,
        (startX + endX) / 2, (startY + endY) / 2
      );
      if (distToLine > this.dashDistance * 0.7) continue;

      // Verificar distância perpendicular à linha
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const perpDist = Math.abs(
        (dy * (enemySprite.x - startX) - dx * (enemySprite.y - startY)) / len
      );
      if (perpDist > 25) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }
    }

    // Speed boost temporário
    this.player.stats.speed = Math.floor(this.player.stats.baseSpeed * (1 + this.speedBoost));
    this.player.setTint(0xff8800);
    this.scene.time.delayedCall(this.speedBoostDuration, () => {
      this.player.stats.speed = this.player.stats.baseSpeed;
      if (this.player.active) this.player.clearTint();
    });
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.dashDistance += 10;
    this.speedBoost += 0.03;
    this.cooldown = Math.max(1800, this.cooldown - 150);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.dash(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
