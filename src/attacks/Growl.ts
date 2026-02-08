import Phaser from 'phaser';
import type { Attack } from '../types';
import type { Player } from '../entities/Player';

/**
 * Growl: aura debuff ao redor do jogador.
 * Não causa dano — inimigos dentro do raio ficam mais lentos e
 * sofrem redução visual (tint cinza).
 * Padrão aura (Smokescreen-like), tickDamage = 0.
 * Bulbasaur base.
 */
export class Growl implements Attack {
  readonly type = 'growl' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private radius = 70;
  private debuffAmount = 0.85;
  private readonly rings: Phaser.GameObjects.Sprite[] = [];
  private tickTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;

    // 3 anéis visuais orbitando
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.sprite(0, 0, 'atk-screech');
      ring.setScale(1.0).setDepth(8).setAlpha(0.4);
      ring.play('anim-screech');
      this.rings.push(ring);
    }

    // Tick de debuff a cada 600ms
    this.tickTimer = scene.time.addEvent({
      delay: 600, loop: true, callback: () => this.tick(),
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

      // Debuff visual: tint cinza
      enemySprite.setTint(0xaaaaaa);
      const body = enemySprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.scale(this.debuffAmount);

      // Limpar tint após curto tempo
      this.scene.time.delayedCall(500, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {
    const t = _time * 0.002;
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      const angle = t + (i * Math.PI * 2 / this.rings.length);
      ring.x = this.player.x + Math.cos(angle) * (this.radius * 0.6);
      ring.y = this.player.y + Math.sin(angle) * (this.radius * 0.6);
      ring.setAlpha(0.25 + Math.sin(t * 2 + i) * 0.1);
    }
  }

  upgrade(): void {
    this.level++;
    this.radius += 12;
    this.debuffAmount = Math.max(0.5, this.debuffAmount - 0.03);

    // Adiciona anel a cada 3 níveis
    if (this.level % 3 === 0) {
      const ring = this.scene.add.sprite(0, 0, 'atk-screech');
      ring.setScale(1.0).setDepth(8).setAlpha(0.4);
      ring.play('anim-screech');
      this.rings.push(ring);
    }
  }

  destroy(): void {
    this.tickTimer.destroy();
    for (const ring of this.rings) ring.destroy();
  }
}
