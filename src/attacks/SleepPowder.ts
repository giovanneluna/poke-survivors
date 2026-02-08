import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Sleep Powder: cone de esporos soporíferos que aplica slow pesado.
 * Padrão cone (Scratch-like) mas sem dano significativo — foco em
 * crowd control com 80% slow por 2s.
 * Ivysaur (stage1).
 */
export class SleepPowder implements Attack {
  readonly type = 'sleepPowder' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private cooldown: number;
  private range = 80;
  private readonly arcAngleDeg = 120;
  private slowDuration = 2000;
  private readonly slowScale = 0.2; // 80% slow (velocity * 0.2)

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.cooldown = ATTACKS.sleepPowder.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.spore(),
    });
  }

  private spore(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);

    // Visual: sprite de esporo na direção
    const offsetX = Math.cos(dirAngleRad) * 30;
    const offsetY = Math.sin(dirAngleRad) * 30;
    const spore = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-cotton-spore'
    );
    spore.setScale(1.5).setDepth(10).setAlpha(0.8);
    spore.setRotation(dirAngleRad);
    spore.play('anim-cotton-spore');

    const followSpore = (): void => {
      if (spore.active) spore.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followSpore);
    spore.once('animationcomplete', () => {
      this.scene.events.off('update', followSpore);
      spore.destroy();
    });

    // Aplica slow em arco
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemySprite.x, enemySprite.y
      );
      if (dist > this.range) continue;

      const angleToEnemy = Math.atan2(
        enemySprite.y - this.player.y, enemySprite.x - this.player.x
      );
      const angleDiff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(dirAngleRad),
          Phaser.Math.RadToDeg(angleToEnemy)
        )
      );
      if (angleDiff > this.arcAngleDeg / 2) continue;

      // Aplica slow visual + mecânico
      enemySprite.setTint(0x66cc44);
      const body = enemySprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.scale(this.slowScale);

      // Emite evento de kill para qualquer ataque que cause dano 0 (se a spec mudar)
      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(0);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }

      // Remove tint e slow após duração
      this.scene.time.delayedCall(this.slowDuration, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.range += 10;
    this.slowDuration += 200;
    this.cooldown = Math.max(3000, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.spore(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
