import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import type { Player } from '../entities/Player';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Withdraw: aura defensiva de carapaca ao redor do jogador.
 * Reduz dano recebido, aplica slow em inimigos proximos,
 * e deflecta projeteis inimigos que entram na zona.
 * Visual: anéis de whirlpool girando + círculo translúcido.
 */
export class Withdraw implements Attack {
  readonly type = 'withdraw' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private damageReduction = 0.15;
  private slowRadius = 45;
  private slowAmount = 0.7;
  private readonly shellVisual: Phaser.GameObjects.Arc | null;
  private readonly ringsSprite: Phaser.GameObjects.Sprite | null;
  private tickTimer: Phaser.Time.TimerEvent;

  /** Zone de deflexao: sprite invisivel com corpo circular para overlap com projeteis */
  private readonly deflectZone: Phaser.Physics.Arcade.Sprite;
  private readonly deflectGroup: ArcadeGroup;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;

    // Visual: circulo translucido azul
    if (shouldShowVfx()) {
      this.shellVisual = scene.add.circle(player.x, player.y, this.slowRadius, 0x3388ff, 0.12);
      this.shellVisual.setDepth(7);
      this.shellVisual.setStrokeStyle(1.5, 0x3388ff, 0.25);

      // Visual: sprite whirlpool-rings animado e girando
      this.ringsSprite = scene.add.sprite(player.x, player.y, 'atk-whirlpool-rings');
      this.ringsSprite.setDepth(8).setAlpha(0.7).setScale(2.5);
      this.ringsSprite.play('anim-whirlpool-rings');
    } else {
      this.shellVisual = null;
      this.ringsSprite = null;
    }

    // Deflect zone: sprite invisivel com corpo circular
    this.deflectZone = scene.physics.add.sprite(player.x, player.y, '__DEFAULT');
    this.deflectZone.setVisible(false).setActive(true);
    const body = this.deflectZone.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.slowRadius);
    body.setOffset(-this.slowRadius + 8, -this.slowRadius + 8);
    body.pushable = false;
    body.immovable = true;

    this.deflectGroup = scene.physics.add.group();
    this.deflectGroup.add(this.deflectZone);

    this.tickTimer = scene.time.addEvent({
      delay: 500, loop: true, callback: () => this.tick(),
    });
  }

  private tick(): void {
    const enemies = getSpatialGrid().queryRadius(this.player.x, this.player.y, this.slowRadius);

    for (const enemy of enemies) {
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (!body) continue;

      enemy.setTint(0x3388ff);
      body.velocity.scale(this.slowAmount);

      this.scene.time.delayedCall(400, () => {
        if (enemy.active) enemy.clearTint();
      });
    }
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  getDeflectZone(): ArcadeGroup {
    return this.deflectGroup;
  }

  update(_time: number, delta: number): void {
    if (this.shellVisual) {
      this.shellVisual.x = this.player.x;
      this.shellVisual.y = this.player.y;
      const pulse = 0.10 + Math.sin(_time * 0.003) * 0.04;
      this.shellVisual.setFillStyle(0x3388ff, pulse);
    }

    // Anéis seguem jogador e giram continuamente
    if (this.ringsSprite) {
      this.ringsSprite.x = this.player.x;
      this.ringsSprite.y = this.player.y;
      this.ringsSprite.rotation += delta * 0.002;
    }

    // Deflect zone segue jogador
    this.deflectZone.x = this.player.x;
    this.deflectZone.y = this.player.y;
  }

  upgrade(): void {
    this.level++;
    this.damageReduction = Math.min(0.40, this.damageReduction + 0.02);
    this.slowRadius += 5;
    this.slowAmount = Math.max(0.4, this.slowAmount - 0.02);

    this.shellVisual?.setRadius(this.slowRadius);
    // Rings crescem proporcionalmente
    this.ringsSprite?.setScale(2.5 + this.level * 0.3);
    // Deflect zone cresce com o raio
    const body = this.deflectZone.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.slowRadius);
    body.setOffset(-this.slowRadius + 8, -this.slowRadius + 8);
  }

  destroy(): void {
    this.tickTimer.destroy();
    this.shellVisual?.destroy();
    this.ringsSprite?.destroy();
    this.deflectGroup.destroy(true);
  }
}
