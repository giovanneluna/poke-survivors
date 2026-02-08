import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Petal Blizzard: tempestade de pétalas que cobre toda a tela.
 * PRIME attack — Venusaur exclusivo (minForm: stage2).
 * Múltiplos sprites em posições aleatórias, todos causando dano em TODOS os inimigos visíveis.
 * Sem range check — fullscreen damage.
 */
export class PetalBlizzard implements Attack {
  readonly type = 'petalBlizzard' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private duration = 3000;
  private spriteCount = 6;

  /** Sprites e timers ativos da tempestade atual */
  private activeSprites: Phaser.GameObjects.Sprite[] = [];
  private tickEvent: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.petalBlizzard.baseDamage;
    this.cooldown = ATTACKS.petalBlizzard.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.storm(),
    });
  }

  private storm(): void {
    // Texto dramático
    const txt = this.scene.add.text(this.player.x, this.player.y - 40, 'PETAL BLIZZARD!', {
      fontSize: '14px',
      color: '#ff88cc',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 25,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy(),
    });

    // Spawnar sprites em posições aleatórias ao redor do jogador
    this.activeSprites = [];
    for (let i = 0; i < this.spriteCount; i++) {
      const offsetX = Phaser.Math.Between(-200, 200);
      const offsetY = Phaser.Math.Between(-150, 150);
      const sprite = this.scene.add.sprite(
        this.player.x + offsetX,
        this.player.y + offsetY,
        'atk-petal-blizzard'
      );
      sprite.setScale(1.2).setDepth(9).setAlpha(0.7);
      sprite.play('anim-petal-blizzard');
      this.activeSprites.push(sprite);

      // Drift aleatório: cada sprite se move suavemente em direção randômica
      const driftX = Phaser.Math.Between(-80, 80);
      const driftY = Phaser.Math.Between(-80, 80);
      this.scene.tweens.add({
        targets: sprite,
        x: sprite.x + driftX,
        y: sprite.y + driftY,
        duration: this.duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
      });
    }

    // Tick de dano: 300ms, danifica TODOS os inimigos na tela (sem range check)
    let elapsed = 0;
    this.tickEvent = this.scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        elapsed += 300;

        const enemies = this.enemyGroup.getChildren().filter(
          (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
        );

        for (const enemySprite of enemies) {
          const enemy = enemySprite as unknown as Enemy;
          if (typeof enemy.takeDamage === 'function') {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(this.damage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
            }
          }
        }

        if (elapsed >= this.duration) {
          cleanup();
        }
      },
    });

    const cleanup = (): void => {
      if (this.tickEvent) {
        this.tickEvent.destroy();
        this.tickEvent = null;
      }
      // Fade out e destruir sprites
      for (const sprite of this.activeSprites) {
        if (sprite.active) {
          this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            duration: 400,
            onComplete: () => sprite.destroy(),
          });
        }
      }
      this.activeSprites = [];
    };

    // Safety cleanup
    this.scene.time.delayedCall(this.duration + 500, cleanup);
  }

  update(_time: number, _delta: number): void {
    // Sprites já possuem drift tween, sem lógica adicional
  }

  upgrade(): void {
    this.level++;
    this.damage += 3;
    this.duration += 300;
    this.cooldown = Math.max(3500, this.cooldown - 200);
    // A cada 2 levels, +1 sprite
    if (this.level % 2 === 0) {
      this.spriteCount++;
    }
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.storm(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    if (this.tickEvent) this.tickEvent.destroy();
    for (const sprite of this.activeSprites) {
      if (sprite.active) sprite.destroy();
    }
    this.activeSprites = [];
  }
}
