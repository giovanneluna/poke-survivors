import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Outrage: modo berserk 360° por duração, confusão ao final.
 * Dano contínuo em área 360° enquanto ativo, depois player fica lento brevemente.
 * Charizard tier (minForm: stage2).
 */
export class Outrage implements Attack {
  readonly type = 'outrage' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 70;
  private berserkDuration = 3000;
  private confusionDuration = 1500;
  private isActive = false;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.outrage.baseDamage;
    this.cooldown = ATTACKS.outrage.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.activate(),
    });
  }

  private activate(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Visual: aura dracônica animada
    this.player.setTint(0x7744ff);
    const aura = this.scene.add.sprite(this.player.x, this.player.y, 'atk-outrage');
    aura.setScale(1.5).setDepth(7).setAlpha(0.7);
    aura.play('anim-outrage');

    // Texto "OUTRAGE!"
    const txt = this.scene.add.text(this.player.x, this.player.y - 30, 'OUTRAGE!', {
      fontSize: '14px', color: '#cc88ff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 20, alpha: 0, duration: 800,
      onComplete: () => txt.destroy(),
    });

    // Tick de dano 360° a cada 150ms
    let elapsed = 0;
    const tickEvent = this.scene.time.addEvent({
      delay: 150, loop: true,
      callback: () => {
        elapsed += 150;
        if (elapsed >= this.berserkDuration || !this.player.active) {
          endBerserk();
          return;
        }

        // Atualizar posição da aura
        aura.setPosition(this.player.x, this.player.y);

        // Partículas de rage
        this.scene.add.particles(this.player.x, this.player.y, 'dragon-particle', {
          speed: { min: 50, max: 120 }, lifespan: 200, quantity: 4,
          scale: { start: 1.5, end: 0 }, angle: { min: 0, max: 360 },
          tint: [0x7744ff, 0x9966ff, 0xcc88ff],
          emitting: false,
        }).explode();

        // Dano 360°
        const enemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );
        for (const enemySprite of enemies) {
          const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, enemySprite.x, enemySprite.y
          );
          if (dist > this.radius) continue;

          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
            }
          }
        }
      },
    });

    const endBerserk = () => {
      tickEvent.destroy();
      aura.destroy();
      this.isActive = false;

      // Confusão: player fica lento
      if (this.player.active) {
        this.player.setTint(0xffff00);
        const origSpeed = this.player.stats.speed;
        this.player.stats.speed = Math.floor(origSpeed * 0.4);

        const confTxt = this.scene.add.text(this.player.x, this.player.y - 20, 'Confused...', {
          fontSize: '10px', color: '#ffff44', fontFamily: 'monospace',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(50);
        this.scene.tweens.add({
          targets: confTxt, alpha: 0, duration: this.confusionDuration,
          onComplete: () => confTxt.destroy(),
        });

        this.scene.time.delayedCall(this.confusionDuration, () => {
          if (this.player.active) {
            this.player.stats.speed = origSpeed;
            this.player.clearTint();
          }
        });
      }
    };
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 6;
    this.radius += 8;
    this.berserkDuration += 300;
    this.confusionDuration = Math.max(500, this.confusionDuration - 150);
    this.cooldown = Math.max(5000, this.cooldown - 400);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.activate(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
