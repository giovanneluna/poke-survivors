import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';

/**
 * Bubble: bolhas lentas multi-shot que aplicam slow ao impactar.
 * Variacao do Ember com foco em controle de grupo (crowd control).
 */
export class Bubble implements Attack {
  readonly type = 'bubble' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private bubblesPerBurst = 3;
  private fireId = 0;

  /** Raio de slow AoE ao estourar a bolha */
  private readonly slowRadius = 60;

  /** Fator de reducao de velocidade aplicado aos inimigos */
  private readonly slowVelocityScale = 0.6;

  /** Duracao do slow em ms */
  private readonly slowDurationMs = 1500;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.bubble.baseDamage;
    this.cooldown = ATTACKS.bubble.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-wave-splash',
      maxSize: 120,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Alvo mais proximo
    const closest = enemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        ),
      }))
      .sort((a, b) => a.dist - b.dist)[0];

    const target = closest.enemy;
    const baseAngle = Math.atan2(
      target.y - this.player.y,
      target.x - this.player.x
    );

    // Dispara N bolhas com spread aleatorio
    for (let i = 0; i < this.bubblesPerBurst; i++) {
      const bubble = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-wave-splash'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bubble) continue;

      const currentFireId = ++this.fireId;
      bubble.setData('fireId', currentFireId);
      bubble.setActive(true).setVisible(true).setScale(1.5).setAlpha(0.8);
      bubble.setDepth(8);
      bubble.play('anim-wave-splash');

      const body = bubble.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(this.player.x, this.player.y);
      body.checkCollision.none = false;
      body.setCircle(12, -8, -8);

      // Spread aleatorio de +/-15 graus
      const spreadDeg = Phaser.Math.FloatBetween(-15, 15);
      const finalAngle = baseAngle + Phaser.Math.DegToRad(spreadDeg);

      body.setVelocity(
        Math.cos(finalAngle) * 150,
        Math.sin(finalAngle) * 150,
      );

      // Trail de particulas (bolhas)
      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bubble,
        speed: { min: 3, max: 12 },
        lifespan: 250,
        scale: { start: 0.8, end: 0 },
        quantity: 1,
        frequency: 60,
        tint: [0x44aaff, 0x88ccff, 0xaaddff],
      });

      // Auto-destruir apos 1.8s (so se ainda for o mesmo disparo)
      this.scene.time.delayedCall(1800, () => {
        if (bubble.active && bubble.getData('fireId') === currentFireId) {
          this.popBubble(bubble);
        }
        trail.destroy();
      });
    }
  }

  /**
   * Estoura a bolha: aplica slow em inimigos proximos e gera efeito visual.
   */
  private popBubble(bubble: Phaser.Physics.Arcade.Sprite): void {
    const px = bubble.x;
    const py = bubble.y;

    // Desativar a bolha
    this.bullets.killAndHide(bubble);
    const body = bubble.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.enable = false;

    // Efeito visual de estouro
    this.scene.add.particles(px, py, 'water-particle', {
      speed: { min: 20, max: 50 },
      lifespan: 300,
      quantity: 4,
      scale: { start: 1.2, end: 0 },
      tint: [0x44aaff, 0x88ccff],
      emitting: false,
    }).explode();

    // Aplica slow em inimigos no raio
    const nearbyEnemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of nearbyEnemies) {
      const dist = Phaser.Math.Distance.Between(px, py, enemySprite.x, enemySprite.y);
      if (dist > this.slowRadius) continue;

      // Tint visual de slow
      enemySprite.setTint(0x3388ff);
      this.scene.time.delayedCall(this.slowDurationMs, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });

      // Reduz velocidade atual
      const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body | null;
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

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  update(_time: number, _delta: number): void {
    // Bubble e baseado em timer, nao precisa de update por frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 3;
    if (this.level % 3 === 0) {
      this.bubblesPerBurst++;
    }
    this.cooldown = Math.max(400, this.cooldown - 60);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
