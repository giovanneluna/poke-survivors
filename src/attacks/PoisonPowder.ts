import Phaser from 'phaser';
import type { Attack } from '../types';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Poison Powder: aura tóxica ao redor do jogador com tick damage.
 * Padrão aura (Smokescreen-like) — nuvens de veneno orbitam e causam
 * dano periódico + tint roxo nos inimigos.
 * Bulbasaur base.
 */
export class PoisonPowder implements Attack {
  readonly type = 'poisonPowder2' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private radius = 55;
  private tickDamage = 3;
  private readonly poisonClouds: Phaser.GameObjects.Sprite[] = [];
  private tickTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;

    // 4 nuvens de veneno orbitando
    for (let i = 0; i < 4; i++) {
      const cloud = scene.add.sprite(0, 0, 'atk-smog');
      cloud.setScale(1.2).setDepth(8).setAlpha(0.5);
      cloud.setTint(0x9944cc);
      cloud.play('anim-smog');
      this.poisonClouds.push(cloud);
    }

    // Tick de dano a cada 500ms
    this.tickTimer = scene.time.addEvent({
      delay: 500, loop: true, callback: () => this.tick(),
    });
  }

  private tick(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemySprite.x, enemySprite.y
      );
      if (dist > this.radius) continue;

      // Tint roxo de veneno
      enemySprite.setTint(0x9944cc);

      // Tick damage
      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.tickDamage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }

      // Limpar tint após curto tempo
      this.scene.time.delayedCall(400, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {
    const t = _time * 0.002;
    for (let i = 0; i < this.poisonClouds.length; i++) {
      const cloud = this.poisonClouds[i];
      const angle = t + (i * Math.PI * 2 / this.poisonClouds.length);
      cloud.x = this.player.x + Math.cos(angle) * (this.radius * 0.6);
      cloud.y = this.player.y + Math.sin(angle) * (this.radius * 0.6);
      cloud.setAlpha(0.3 + Math.sin(t * 2 + i) * 0.15);
    }
  }

  upgrade(): void {
    this.level++;
    this.radius += 8;
    this.tickDamage += 1;

    // Adiciona nuvem a cada 2 níveis
    if (this.level % 2 === 0) {
      const cloud = this.scene.add.sprite(0, 0, 'atk-smog');
      cloud.setScale(1.2).setDepth(8).setAlpha(0.5);
      cloud.setTint(0x9944cc);
      cloud.play('anim-smog');
      this.poisonClouds.push(cloud);
    }
  }

  destroy(): void {
    this.tickTimer.destroy();
    for (const cloud of this.poisonClouds) cloud.destroy();
  }
}
