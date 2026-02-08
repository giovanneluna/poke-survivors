import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Toxic: aura de veneno persistente ao redor do jogador.
 * Evolucao de poisonPowder. Padrao aura (como Smokescreen).
 * UNICO: Dano escala com tempo — cada tick que o inimigo permanece no raio,
 * toxicStacks incrementa e dano aumenta (ate maxStacks * 2 bonus).
 * Stacks resetam quando o inimigo sai do raio.
 */
export class Toxic implements Attack {
  readonly type = 'toxic' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private radius = 65;
  private tickDamage = 5;
  private maxStacks = 5;
  private readonly acidClouds: Phaser.GameObjects.Sprite[] = [];
  private tickTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.tickDamage = ATTACKS.toxic.baseDamage;

    // 3 nuvens de acido orbitando com tint roxo
    for (let i = 0; i < 3; i++) {
      const cloud = scene.add.sprite(0, 0, 'atk-acid-spray');
      cloud.setScale(0.8).setDepth(8).setAlpha(0.5);
      cloud.setTint(0x9944cc);
      cloud.play('anim-acid-spray');
      this.acidClouds.push(cloud);
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

      if (dist > this.radius) {
        // Fora do raio: resetar stacks
        if (enemySprite.getData('toxicStacks') !== undefined) {
          enemySprite.setData('toxicStacks', 0);
        }
        continue;
      }

      // Dentro do raio: incrementar stacks
      const currentStacks = (enemySprite.getData('toxicStacks') as number | undefined) ?? 0;
      const newStacks = Math.min(currentStacks + 1, this.maxStacks);
      enemySprite.setData('toxicStacks', newStacks);

      // Dano escala com stacks
      const scaledDamage = this.tickDamage + newStacks * 2;

      // Visual: tint roxo proporcional aos stacks
      const intensity = Math.floor(0x99 - newStacks * 0x10);
      const tintColor = (intensity << 16) | (0x44 << 8) | 0xcc;
      enemySprite.setTint(tintColor);

      // Aplicar dano
      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(scaledDamage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }

      // Limpar tint apos um curto tempo
      this.scene.time.delayedCall(400, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {
    const t = _time * 0.002;
    for (let i = 0; i < this.acidClouds.length; i++) {
      const cloud = this.acidClouds[i];
      const angle = t + (i * Math.PI * 2 / this.acidClouds.length);
      cloud.x = this.player.x + Math.cos(angle) * (this.radius * 0.6);
      cloud.y = this.player.y + Math.sin(angle) * (this.radius * 0.6);
      cloud.setAlpha(0.3 + Math.sin(t * 2 + i) * 0.15);
    }
  }

  upgrade(): void {
    this.level++;
    this.radius += 10;
    this.tickDamage += 2;
    this.maxStacks += 1;
  }

  destroy(): void {
    this.tickTimer.destroy();
    for (const cloud of this.acidClouds) cloud.destroy();
  }
}
