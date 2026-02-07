import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Fire Blast: evolução do Fire Spin.
 * Anel de fogo expansivo que pulsa dano ao redor do jogador.
 * Mais orbes, maior raio, e pulsos de onda de fogo.
 */
export class FireBlast implements Attack {
  readonly type = 'fireBlast' as const;
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
  private readonly pulseRadius = 120;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.fireBlast.baseDamage;

    this.orbs = scene.physics.add.group();
    this.createOrbs();

    // Pulso de fogo a cada 2s
    this.pulseTimer = scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.pulse(),
    });
  }

  private createOrbs(): void {
    this.orbs.clear(true, true);
    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(0, 0, 'atk-fire-range');
      orb.setScale(1.2);
      orb.setDepth(9);
      orb.setAlpha(0.9);
      orb.setTint(0xff4400);
      orb.play('anim-fire-orb');
      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.setCircle(14);
      body.setOffset(6, 6);
      body.pushable = false;
      body.immovable = true;
      this.orbs.add(orb);
    }
  }

  private pulse(): void {
    // Visual: sprite Fire Blast expandindo
    const blast = this.scene.add.sprite(this.player.x, this.player.y, 'atk-fire-blast');
    blast.setScale(1.5).setDepth(7).setAlpha(0.8);
    blast.play('anim-fire-blast');
    this.scene.tweens.add({
      targets: blast,
      scale: 2.5,
      alpha: 0,
      duration: 600,
      onComplete: () => blast.destroy(),
    });

    // Dano AoE no pulso
    const enemies = this.enemyGroup.getChildren();
    for (const child of enemies) {
      const enemy = child as Enemy;
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= this.pulseRadius) {
        enemy.takeDamage(Math.floor(this.damage * 0.5));
      }
    }
  }

  getDamage(): number { return this.damage; }
  getOrbs(): ArcadeGroup { return this.orbs; }

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
