import Phaser from 'phaser';
import type { Attack } from '../types';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

/**
 * Smokescreen: aura de fumaça ao redor do jogador que causa slow.
 * Equivalente à "Garlic" do Vampire Survivors (dano passivo próximo).
 * Inimigos dentro da nuvem ficam mais lentos.
 */
export class Smokescreen implements Attack {
  readonly type = 'smokescreen' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private radius = 60;
  private slowAmount = 0.5; // multiplicador de velocidade
  private tickDamage = 2;
  private readonly smokeClouds: Phaser.GameObjects.Sprite[] = [];
  private tickTimer: Phaser.Time.TimerEvent;
  private readonly tintedEnemies: Set<Phaser.Physics.Arcade.Sprite> = new Set();
  private clearTintTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;

    // Cria 4 nuvens de fumaça animadas orbitando
    for (let i = 0; i < 4; i++) {
      const cloud = scene.add.sprite(0, 0, 'atk-smokescreen');
      cloud.setScale(1.2).setDepth(8).setAlpha(0.5);
      cloud.play('anim-smokescreen');
      this.smokeClouds.push(cloud);
    }

    // Tick de dano/slow a cada 500ms
    this.tickTimer = scene.time.addEvent({
      delay: 500, loop: true, callback: () => this.tick(),
    });

    // Um único timer para limpar tints em batch (a cada 400ms)
    this.clearTintTimer = scene.time.addEvent({
      delay: 400, loop: true, callback: () => this.clearTints(),
    });
  }

  private clearTints(): void {
    for (const sprite of this.tintedEnemies) {
      if (sprite.active) sprite.clearTint();
    }
    this.tintedEnemies.clear();
  }

  private tick(): void {
    const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.radius);

    for (const enemy of enemies) {
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (!body) continue;

      // Slow visual
      enemy.setTint(0x888888);
      body.velocity.scale(this.slowAmount);
      this.tintedEnemies.add(enemy);

      // Tick damage
      if (this.tickDamage > 0) {
        if (typeof enemy.takeDamage === 'function') {
          setDamageSource(this.type);
          const killed = enemy.takeDamage(this.tickDamage);
          if (killed) {
            this.tintedEnemies.delete(enemy);
            this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
          }
        }
      }
    }
  }

  update(_time: number, _delta: number): void {
    const t = _time * 0.002;
    for (let i = 0; i < this.smokeClouds.length; i++) {
      const cloud = this.smokeClouds[i];
      const angle = t + (i * Math.PI * 2 / this.smokeClouds.length);
      cloud.x = this.player.x + Math.cos(angle) * (this.radius * 0.6);
      cloud.y = this.player.y + Math.sin(angle) * (this.radius * 0.6);
      cloud.setAlpha(0.3 + Math.sin(t * 2 + i) * 0.15);
    }
  }

  upgrade(): void {
    this.level++;
    this.radius += 10;
    this.tickDamage += 1;
    this.slowAmount = Math.max(0.2, this.slowAmount - 0.04);

    // Adiciona mais nuvens
    if (this.level % 2 === 0) {
      const cloud = this.scene.add.sprite(0, 0, 'atk-smokescreen');
      cloud.setScale(1.2).setDepth(8).setAlpha(0.5);
      cloud.play('anim-smokescreen');
      this.smokeClouds.push(cloud);
    }
  }

  destroy(): void {
    this.tickTimer.destroy();
    this.clearTintTimer.destroy();
    this.tintedEnemies.clear();
    for (const cloud of this.smokeClouds) cloud.destroy();
  }
}
