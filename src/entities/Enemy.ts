import Phaser from 'phaser';
import type { EnemyConfig, Direction, SpriteConfig, EnemyRangedConfig, EnemyContactEffect } from '../types';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private hp: number;
  private readonly maxHp: number;
  private readonly speed: number;
  readonly damage: number;
  readonly xpValue: number;
  private hpBar: Phaser.GameObjects.Graphics | null = null;
  private shadow: Phaser.GameObjects.Image | null = null;
  private readonly spriteConfig: SpriteConfig;
  private currentDir: Direction = 'down';
  readonly rangedAttack: EnemyRangedConfig | undefined;
  readonly contactEffect: EnemyContactEffect | undefined;
  private lastAttackTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, config.sprite.key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.spriteConfig = config.sprite;
    this.rangedAttack = config.rangedAttack;
    this.contactEffect = config.contactEffect;

    this.setScale(config.scale);
    this.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 16);
    body.setOffset(
      (config.sprite.frameWidth - 16) / 2,
      config.sprite.frameHeight - 18,
    );

    // Sombra
    this.shadow = scene.add.image(x, y + 8, 'shadow')
      .setDepth(4)
      .setScale(config.scale);

    this.play(`${this.spriteConfig.key}-down`);
  }

  moveToward(target: Phaser.Math.Vector2): void {
    if (!this.active || !this.body) return;

    this.scene.physics.moveToObject(this, target, this.speed);

    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    const newDir = this.velocityToDirection(vx, vy);

    if (newDir !== this.currentDir) {
      this.currentDir = newDir;
      const animKey = `${this.spriteConfig.key}-${newDir}`;
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey);
      }
    }

    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 8);
    }
  }

  tryRangedAttack(playerX: number, playerY: number, time: number): { shouldFire: boolean; config: EnemyRangedConfig } | null {
    if (!this.rangedAttack || !this.active) return null;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    if (dist > this.rangedAttack.range) return null;
    if (time - this.lastAttackTime < this.rangedAttack.cooldownMs) return null;

    this.lastAttackTime = time;
    return { shouldFire: true, config: this.rangedAttack };
  }

  private velocityToDirection(vx: number, vy: number): Direction {
    const absX = Math.abs(vx);
    const absY = Math.abs(vy);
    const threshold = 0.4;

    if (absX > absY * (1 + threshold)) return vx > 0 ? 'right' : 'left';
    if (absY > absX * (1 + threshold)) return vy > 0 ? 'down' : 'up';

    if (vx > 0 && vy > 0) return 'downRight';
    if (vx > 0 && vy < 0) return 'upRight';
    if (vx < 0 && vy > 0) return 'downLeft';
    return 'upLeft';
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });

    this.drawHpBar();

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private drawHpBar(): void {
    if (!this.hpBar) {
      this.hpBar = this.scene.add.graphics().setDepth(15);
    }

    this.hpBar.clear();
    const barWidth = 24;
    const barHeight = 3;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(this.x - barWidth / 2, this.y - 18, barWidth, barHeight);

    const color = hpRatio > 0.5 ? 0x00ff00 : hpRatio > 0.25 ? 0xffff00 : 0xff0000;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(this.x - barWidth / 2, this.y - 18, barWidth * hpRatio, barHeight);
  }

  private die(): void {
    if (this.scene && this.scene.add) {
      this.scene.add.particles(this.x, this.y, 'fire-particle', {
        speed: { min: 30, max: 80 },
        lifespan: 300,
        quantity: 6,
        scale: { start: 1.5, end: 0 },
        emitting: false,
      }).explode();
    }
    this.cleanup();
  }

  cleanup(): void {
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.shadow) { this.shadow.destroy(); this.shadow = null; }
    this.destroy();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.hpBar && this.hp < this.maxHp) {
      this.drawHpBar();
    }
  }
}
