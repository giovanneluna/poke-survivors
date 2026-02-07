import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';

/**
 * Fire Spin: orbes de fogo que orbitam o jogador.
 * Equivalente ao "King Bible" do Vampire Survivors.
 */
export class FireSpin implements Attack {
  readonly type = 'fireSpin' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly orbs: ArcadeGroup;
  private orbCount = 2;
  private radius = 65;
  private damage: number;
  private readonly rotationSpeed = 3; // radianos por segundo
  private angle = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.fireSpin.baseDamage;

    this.orbs = scene.physics.add.group();
    this.createOrbs();
  }

  private createOrbs(): void {
    // Limpa orbes existentes
    this.orbs.clear(true, true);

    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(0, 0, 'atk-fire-range');
      orb.setScale(1);
      orb.setDepth(9);
      orb.setAlpha(0.9);
      orb.play('anim-fire-orb');

      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.setCircle(12);
      body.setOffset(8, 8);
      body.pushable = false;
      body.immovable = true;

      this.orbs.add(orb);
    }
  }

  getDamage(): number {
    return this.damage;
  }

  getOrbs(): ArcadeGroup {
    return this.orbs;
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
    this.damage += 3;
    this.orbCount++;
    this.radius += 8;
    this.createOrbs();
  }

  destroy(): void {
    this.orbs.destroy(true);
  }
}
