import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Bubble Beam: evolucao do Bubble.
 * Rajada rapida de bolhas com slow garantido ao impactar.
 * Dispara 5 bolhas por burst em padrao spread (+/-20 graus).
 */
export class BubbleBeam implements Attack {
  readonly type = 'bubbleBeam' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bubblesPerBurst = 5;
  private fireId = 0;

  /** Raio de slow AoE ao estourar */
  private readonly slowRadius = 30;

  /** Fator de reducao de velocidade */
  private readonly slowVelocityScale = 0.5;

  /** Duracao do slow em ms */
  private readonly slowDurationMs = 2000;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.bubbleBeam.baseDamage;
    this.cooldown = ATTACKS.bubbleBeam.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-sparkling-aria',
      maxSize: 80,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const nearest = getSpatialGrid().queryNearest(this.player.x, this.player.y);
    if (!nearest) return;

    const target = nearest;
    const baseAngle = Math.atan2(
      target.y - this.player.y,
      target.x - this.player.x
    );

    // Dispara N bolhas com spread uniforme de +/-20 graus
    for (let i = 0; i < this.bubblesPerBurst; i++) {
      const bubble = this.bullets.get(
        this.player.x, this.player.y, 'atk-sparkling-aria'
      ) as Phaser.Physics.Arcade.Sprite | null;
      if (!bubble) continue;

      const currentFireId = ++this.fireId;
      bubble.setData('fireId', currentFireId);
      bubble.setActive(true).setVisible(true).setScale(0.8).setAlpha(0.9);
      bubble.setDepth(8);
      bubble.play('anim-sparkling-aria');

      const body = bubble.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;

      // Spread uniforme de -20 a +20 graus
      const spreadRange = 40; // total degrees
      const spreadDeg = this.bubblesPerBurst > 1
        ? -spreadRange / 2 + (spreadRange / (this.bubblesPerBurst - 1)) * i
        : 0;
      const finalAngle = baseAngle + Phaser.Math.DegToRad(spreadDeg);

      body.setVelocity(
        Math.cos(finalAngle) * 200,
        Math.sin(finalAngle) * 200,
      );

      // Trail de particulas
      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bubble,
        speed: { min: 3, max: 12 },
        lifespan: 200,
        scale: { start: 0.8, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: [0x44aaff, 0x88ccff, 0xaaddff],
      });

      // Auto-destruir apos 2s com efeito de slow AoE
      this.scene.time.delayedCall(2000, () => {
        if (bubble.active && bubble.getData('fireId') === currentFireId) {
          this.popBubble(bubble);
        }
        trail.destroy();
      });
    }
  }

  /**
   * Estoura a bolha: aplica slow garantido em inimigos proximos.
   */
  private popBubble(bubble: Phaser.Physics.Arcade.Sprite): void {
    const px = bubble.x;
    const py = bubble.y;

    // Desativar a bolha
    this.bullets.killAndHide(bubble);
    const body = bubble.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.enable = false;

    // Efeito visual de estouro (auto-destroy após lifespan)
    const burstParticles = this.scene.add.particles(px, py, 'water-particle', {
      speed: { min: 20, max: 60 },
      lifespan: 300,
      quantity: 5,
      scale: { start: 1.2, end: 0 },
      tint: [0x3388ff, 0x44aaff, 0x88ccff],
      emitting: false,
    });
    burstParticles.explode();
    this.scene.time.delayedCall(400, () => burstParticles.destroy());

    // Aplica slow em inimigos no raio
    const nearbyEnemies = getSpatialGrid().queryRadius(px, py, this.slowRadius);

    for (const enemy of nearbyEnemies) {
      // Tint visual de slow
      enemy.setTint(0x3388ff);
      this.scene.time.delayedCall(this.slowDurationMs, () => {
        if (enemy.active) enemy.clearTint();
      });

      // Reduz velocidade
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        enemyBody.velocity.scale(this.slowVelocityScale);
      }
    }
  }

  /**
   * Chamado pelo CollisionSystem quando uma bolha acerta um inimigo.
   * Alem do dano padrao, estoura a bolha para aplicar slow AoE.
   */
  onBulletHit(bullet: Phaser.Physics.Arcade.Sprite): void {
    this.popBubble(bullet);
  }

  getDamage(): number { return this.damage; }
  getBullets(): ArcadeGroup { return this.bullets; }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 4;
    if (this.level % 2 === 0) this.bubblesPerBurst++;
    this.cooldown = Math.max(300, this.cooldown - 50);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
