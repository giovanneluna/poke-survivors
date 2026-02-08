import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';

/**
 * Rapid Spin: orbes de carapaça que orbitam o jogador.
 * Padrao VS Bible: ativo por X segundos, depois cooldown, depois ativo novamente.
 * Equivalente ao Fire Spin do Charmander, mas com rotacao mais rapida.
 */
export class RapidSpin implements Attack {
  readonly type = 'rapidSpin' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly orbs: ArcadeGroup;
  private orbCount = 2;
  private radius = 60;
  private damage: number;
  private readonly rotationSpeed = 4;
  private angle = 0;

  // ── Ciclo ativo/cooldown (VS Bible pattern) ─────────────────────
  private state: 'active' | 'cooldown' = 'active';
  private stateTimer = 0;
  private activeDuration = 4000;
  private cooldownDuration = 3000;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.rapidSpin.baseDamage;

    this.orbs = scene.physics.add.group();
    this.createOrbs();
  }

  private createOrbs(): void {
    this.orbs.clear(true, true);

    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(0, 0, 'atk-rapid-spin');
      orb.setScale(0.7);
      orb.setDepth(9);
      orb.setAlpha(0.9);
      orb.play('anim-rapid-spin');

      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.setCircle(16);
      body.setOffset(20, 20);
      body.pushable = false;
      body.immovable = true;

      this.orbs.add(orb);
    }

    // Se criando durante cooldown, esconder imediatamente
    if (this.state === 'cooldown') {
      this.hideOrbs();
    }
  }

  private hideOrbs(): void {
    const children = this.orbs.getChildren();
    for (const child of children) {
      const orb = child as Phaser.Physics.Arcade.Sprite;
      orb.setVisible(false);
      orb.setActive(false);
      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
    }
  }

  private showOrbs(): void {
    const children = this.orbs.getChildren();
    for (const child of children) {
      const orb = child as Phaser.Physics.Arcade.Sprite;
      orb.setVisible(true);
      orb.setActive(true);
      orb.setAlpha(0);
      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      // Fade in suave
      this.scene.tweens.add({
        targets: orb,
        alpha: 0.9,
        duration: 200,
        ease: 'Sine.InOut',
      });
    }
  }

  getDamage(): number {
    return this.damage;
  }

  getOrbs(): ArcadeGroup {
    return this.orbs;
  }

  update(_time: number, delta: number): void {
    this.stateTimer += delta;

    if (this.state === 'active') {
      // Girar orbs em torno do player
      this.angle += this.rotationSpeed * (delta / 1000);

      const children = this.orbs.getChildren();
      const total = children.length;

      for (let i = 0; i < total; i++) {
        const orb = children[i] as Phaser.Physics.Arcade.Sprite;
        const orbAngle = this.angle + (i * (Math.PI * 2) / total);
        orb.x = this.player.x + Math.cos(orbAngle) * this.radius;
        orb.y = this.player.y + Math.sin(orbAngle) * this.radius;
      }

      // Transicao para cooldown
      if (this.stateTimer >= this.activeDuration) {
        this.state = 'cooldown';
        this.stateTimer = 0;
        // Fade out rapido antes de esconder
        const orbChildren = this.orbs.getChildren();
        for (const child of orbChildren) {
          const orb = child as Phaser.Physics.Arcade.Sprite;
          this.scene.tweens.add({
            targets: orb,
            alpha: 0,
            duration: 200,
            ease: 'Sine.InOut',
            onComplete: () => {
              orb.setVisible(false);
              orb.setActive(false);
              const body = orb.body as Phaser.Physics.Arcade.Body;
              body.enable = false;
            },
          });
        }
      }
    } else {
      // Cooldown: orbs invisiveis, sem colisao
      if (this.stateTimer >= this.cooldownDuration) {
        this.state = 'active';
        this.stateTimer = 0;
        this.showOrbs();
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.orbCount++;
    this.radius += 8;
    this.activeDuration += 500;
    this.cooldownDuration = Math.max(1000, this.cooldownDuration - 300);
    this.createOrbs();
  }

  destroy(): void {
    this.orbs.destroy(true);
  }
}
