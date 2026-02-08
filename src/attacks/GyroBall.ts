import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Gyro Ball: evolucao do Rapid Spin.
 * Orbes metalicas always-active (sem ciclo de cooldown) + pulso shockwave.
 * Equivalente ao Fire Blast do Charmander.
 * Bonus: +50% dano em inimigos com velocidade < 50 (slowed).
 */
export class GyroBall implements Attack {
  readonly type = 'gyroBall' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly orbs: ArcadeGroup;
  private orbCount = 5;
  private radius = 90;
  private damage: number;
  private readonly rotationSpeed = 4;
  private angle = 0;
  private pulseTimer: Phaser.Time.TimerEvent;
  private pulseRadius = 110;

  /** Threshold de velocidade para considerar "slow" */
  private readonly slowThreshold = 50;

  /** Bonus de dano em inimigos slowed */
  private readonly slowBonusDmg = 1.5;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.gyroBall.baseDamage;

    this.orbs = scene.physics.add.group();
    this.createOrbs();

    // Pulso shockwave a cada 2.5s
    this.pulseTimer = scene.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => this.pulse(),
    });
  }

  private createOrbs(): void {
    this.orbs.clear(true, true);
    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(0, 0, 'atk-rapid-spin');
      orb.setScale(0.6);
      orb.setDepth(9);
      orb.setAlpha(0.9);
      orb.setTint(0x888888);
      orb.play('anim-rapid-spin');

      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.setCircle(16);
      body.setOffset(20, 20);
      body.pushable = false;
      body.immovable = true;

      this.orbs.add(orb);
    }
  }

  private pulse(): void {
    // Visual: shockwave ring expandindo + fading
    const ring = this.scene.add.circle(
      this.player.x, this.player.y, 20, 0x888888, 0
    );
    ring.setDepth(7);
    ring.setStrokeStyle(3, 0xaaaaaa, 0.7);
    this.scene.tweens.add({
      targets: ring,
      scaleX: this.pulseRadius / 20,
      scaleY: this.pulseRadius / 20,
      alpha: 0,
      duration: 500,
      ease: 'Sine.Out',
      onComplete: () => ring.destroy(),
    });

    // Segundo anel com delay para efeito visual
    const ring2 = this.scene.add.circle(
      this.player.x, this.player.y, 15, 0x6688aa, 0
    );
    ring2.setDepth(7);
    ring2.setStrokeStyle(2, 0x88aacc, 0.5);
    this.scene.tweens.add({
      targets: ring2,
      scaleX: this.pulseRadius / 15,
      scaleY: this.pulseRadius / 15,
      alpha: 0,
      duration: 600,
      delay: 80,
      ease: 'Sine.Out',
      onComplete: () => ring2.destroy(),
    });

    // Dano AoE no pulso (40% do dano base) com bonus em slowed
    const enemies = this.enemyGroup.getChildren();
    for (const child of enemies) {
      const enemy = child as Enemy;
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      if (dist > this.pulseRadius) continue;

      let pulseDmg = Math.floor(this.damage * 0.4);

      // Bonus contra inimigos lentos
      const enemyBody = (enemy as unknown as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body | null;
      if (enemyBody) {
        const speed = enemyBody.velocity.length();
        if (speed < this.slowThreshold) {
          pulseDmg = Math.floor(pulseDmg * this.slowBonusDmg);
        }
      }

      setDamageSource(this.type);
      const killed = enemy.takeDamage(pulseDmg);
      if (killed) {
        this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
      }
    }
  }

  /**
   * Calcula dano do orb com bonus contra slowed.
   * Chamado pelo collision system para dano por contato.
   */
  getDamage(): number { return this.damage; }
  getOrbs(): ArcadeGroup { return this.orbs; }

  /**
   * Calcula dano efetivo contra um inimigo especifico (bonus slow).
   */
  getEffectiveDamage(enemySprite: Phaser.Physics.Arcade.Sprite): number {
    const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body | null;
    if (enemyBody) {
      const speed = enemyBody.velocity.length();
      if (speed < this.slowThreshold) {
        return Math.floor(this.damage * this.slowBonusDmg);
      }
    }
    return this.damage;
  }

  update(_time: number, delta: number): void {
    this.angle += this.rotationSpeed * (delta / 1000);
    const children = this.orbs.getChildren();
    const total = children.length;
    for (let i = 0; i < total; i++) {
      const orb = children[i] as Phaser.Physics.Arcade.Sprite;
      const orbAngle = this.angle + (i * (Math.PI * 2) / total);
      orb.x = this.player.x + Math.cos(orbAngle) * this.radius;
      orb.y = this.player.y + Math.sin(orbAngle) * this.radius;
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 5;
    this.orbCount++;
    this.radius += 10;
    this.createOrbs();
  }

  destroy(): void {
    this.pulseTimer.destroy();
    this.orbs.destroy(true);
  }
}
