import Phaser from 'phaser';
import type { DestructibleConfig, DestructibleType } from '../types';

export class Destructible extends Phaser.Physics.Arcade.Sprite {
  private hp: number;
  readonly config: DestructibleConfig;
  readonly destructibleType: DestructibleType;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DestructibleConfig) {
    super(scene, x, y, config.textureKey);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as Phaser.GameObjects.GameObject, true); // static body

    this.config = config;
    this.destructibleType = config.key;
    this.hp = config.hp;
    this.setScale(config.scale);
    this.setDepth(3);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });

    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-2, 2),
      y: this.y + Phaser.Math.Between(-2, 2),
      duration: 50,
      yoyo: true,
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    // Partículas de destruição
    const tint = this.destructibleType === 'tallGrass' ? 0x5b9e4a
      : this.destructibleType === 'berryBush' ? 0x2d7a2d
      : this.destructibleType === 'rockSmash' ? 0x888888
      : 0xddaa44;

    this.scene.add.particles(this.x, this.y, 'fire-particle', {
      speed: { min: 20, max: 60 },
      lifespan: 300,
      quantity: 8,
      scale: { start: 1.5, end: 0 },
      tint: [tint, 0xffffff],
      emitting: false,
    }).explode();

    this.destroy();
  }
}
