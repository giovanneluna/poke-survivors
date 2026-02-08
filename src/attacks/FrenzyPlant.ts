import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Frenzy Plant: raízes gigantes irrompem do chão no cluster de inimigos mais denso.
 * PRIME attack — Venusaur exclusivo (minForm: stage2).
 * Dano massivo + stun em área. Cooldown longo compensado pelo poder devastador.
 * Spawna na posição média dos 3 inimigos mais próximos.
 */
export class FrenzyPlant implements Attack {
  readonly type = 'frenzyPlant' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 100;
  private stunDuration = 1500;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.frenzyPlant.baseDamage;
    this.cooldown = ATTACKS.frenzyPlant.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.summon(),
    });
  }

  private summon(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Posição: média dos 3 inimigos mais próximos (cluster targeting)
    const sorted = enemies
      .map(e => ({
        sprite: e,
        dist: Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y),
      }))
      .sort((a, b) => a.dist - b.dist);

    const clusterSize = Math.min(3, sorted.length);
    let tx = 0;
    let ty = 0;
    for (let i = 0; i < clusterSize; i++) {
      tx += sorted[i].sprite.x;
      ty += sorted[i].sprite.y;
    }
    tx /= clusterSize;
    ty /= clusterSize;

    // Texto dramático
    const txt = this.scene.add.text(tx, ty - 40, 'FRENZY PLANT!', {
      fontSize: '16px',
      color: '#44ff44',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => txt.destroy(),
    });

    // Shadow/alvo no chão
    const shadow = this.scene.add.circle(tx, ty, this.radius * 0.5, 0x228822, 0.2);
    shadow.setDepth(5);
    this.scene.tweens.add({
      targets: shadow,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      onComplete: () => shadow.destroy(),
    });

    // Sprite de raízes (ingrain)
    const rootSprite = this.scene.add.sprite(tx, ty, 'atk-ingrain');
    rootSprite.setScale(1.5).setDepth(10).setAlpha(0.9);
    rootSprite.play('anim-ingrain');
    rootSprite.once('animationcomplete', () => rootSprite.destroy());

    // Screen shake
    this.scene.cameras.main.shake(300, 0.008);

    // Partículas de terra/raízes
    this.scene.add.particles(tx, ty, 'fire-particle', {
      speed: { min: 60, max: 150 },
      lifespan: 500,
      quantity: 15,
      scale: { start: 2, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0x228822, 0x44aa44, 0x886633],
      emitting: false,
    }).explode();

    // Dano + stun em TODOS os inimigos no raio
    const stunDur = this.stunDuration;
    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(tx, ty, enemySprite.x, enemySprite.y);
      if (dist > this.radius) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }

      // Stun visual: velocity 0 + tint amarelo
      const body = enemySprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.set(0, 0);
      enemySprite.setTint(0xccaa00);

      this.scene.time.delayedCall(stunDur, () => {
        if (enemySprite.active) {
          enemySprite.clearTint();
        }
      });
    }
  }

  update(_time: number, _delta: number): void {
    // Timer-based, sem lógica per-frame
  }

  upgrade(): void {
    this.level++;
    this.damage += 12;
    this.radius += 12;
    this.stunDuration += 200;
    this.cooldown = Math.max(5000, this.cooldown - 400);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.summon(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
