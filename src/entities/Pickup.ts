import Phaser from 'phaser';
import type { PickupType } from '../types';

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  readonly pickupType: PickupType;

  constructor(scene: Phaser.Scene, x: number, y: number, pickupType: PickupType, textureKey: string) {
    super(scene, x, y, textureKey);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as Phaser.GameObjects.GameObject);

    this.pickupType = pickupType;
    this.setScale(1.5);
    this.setDepth(4);

    // Animação de flutuação
    scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Auto-destruir após 15s
    scene.time.delayedCall(15000, () => {
      if (this.active) {
        scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 500,
          onComplete: () => this.destroy(),
        });
      }
    });
  }
}
