import Phaser from 'phaser';
import type { Attack } from '../types';
import type { Player } from '../entities/Player';

/**
 * Withdraw: aura defensiva de carapaca ao redor do jogador.
 * Reduz dano recebido e aplica slow em inimigos proximos.
 * Equivalente ao Smokescreen do Charmander, mas focado em defesa.
 */
export class Withdraw implements Attack {
  readonly type = 'withdraw' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private damageReduction = 0.15;
  private slowRadius = 45;
  private slowAmount = 0.7; // multiplicador de velocidade (1.0 = sem slow)
  private readonly shellVisual: Phaser.GameObjects.Arc;
  private tickTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;

    // Visual: circulo translucido azul representando a carapaca
    this.shellVisual = scene.add.circle(player.x, player.y, this.slowRadius, 0x3388ff, 0.15);
    this.shellVisual.setDepth(7);
    this.shellVisual.setStrokeStyle(1.5, 0x3388ff, 0.3);

    // Tick de slow a cada 500ms
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
      if (dist > this.slowRadius) continue;

      // Slow visual
      enemySprite.setTint(0x3388ff);
      const body = enemySprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.scale(this.slowAmount);

      // Limpar tint apos um curto tempo
      this.scene.time.delayedCall(400, () => {
        if (enemySprite.active) enemySprite.clearTint();
      });
    }
  }

  /** Retorna a fracao de reducao de dano atual (ex: 0.15 = 15%) */
  getDamageReduction(): number {
    return this.damageReduction;
  }

  update(_time: number, _delta: number): void {
    // Shell visual segue o jogador
    this.shellVisual.x = this.player.x;
    this.shellVisual.y = this.player.y;

    // Pulso sutil no alpha para feedback visual
    const pulse = 0.12 + Math.sin(_time * 0.003) * 0.04;
    this.shellVisual.setFillStyle(0x3388ff, pulse);
  }

  upgrade(): void {
    this.level++;
    this.damageReduction = Math.min(0.40, this.damageReduction + 0.02);
    this.slowRadius += 5;
    this.slowAmount = Math.max(0.4, this.slowAmount - 0.02);

    // Atualiza tamanho visual da carapaca
    this.shellVisual.setRadius(this.slowRadius);
  }

  destroy(): void {
    this.tickTimer.destroy();
    this.shellVisual.destroy();
  }
}
