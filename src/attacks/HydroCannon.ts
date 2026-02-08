import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { setDamageSource } from '../systems/DamageTracker';

/**
 * Hydro Cannon: ultimate devastador do Blastoise.
 * PRIME attack - Blastoise exclusivo.
 * Explosao massiva no cluster mais denso + sub-blasts em cascata.
 */
export class HydroCannon implements Attack {
  readonly type = 'hydroCannon' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private radius = 120;
  private subBlastCount = 5;
  private readonly subBlastRadius = 50;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.hydroCannon.baseDamage;
    this.cooldown = ATTACKS.hydroCannon.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.blast(),
    });
  }

  /** Encontra o cluster de inimigos mais denso */
  private findDensestCluster(): { x: number; y: number } | null {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return null;

    let bestScore = -1;
    let bestX = this.player.x;
    let bestY = this.player.y;

    for (const candidate of enemies) {
      let score = 0;
      for (const other of enemies) {
        const dist = Phaser.Math.Distance.Between(candidate.x, candidate.y, other.x, other.y);
        if (dist < this.radius) {
          score += 1 - (dist / this.radius);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestX = candidate.x;
        bestY = candidate.y;
      }
    }

    return { x: bestX, y: bestY };
  }

  private blast(): void {
    const target = this.findDensestCluster();
    if (!target) return;

    const { x: tx, y: ty } = target;

    // Texto epico
    const txt = this.scene.add.text(tx, ty - 50, 'HYDRO CANNON!', {
      fontSize: '16px',
      color: '#3388ff',
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

    // Impacto principal
    this.createMainBlast(tx, ty);

    // Sub-blasts em cascata
    for (let i = 0; i < this.subBlastCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(30, this.radius);
      const sx = tx + Math.cos(angle) * dist;
      const sy = ty + Math.sin(angle) * dist;

      this.scene.time.delayedCall(100 + i * 100, () => {
        this.createSubBlast(sx, sy);
      });
    }
  }

  /** Explosao principal: sprite animado + dano AoE + screen shake */
  private createMainBlast(x: number, y: number): void {
    // Shadow/alvo no chao
    const shadow = this.scene.add.circle(x, y, this.radius * 0.5, 0x2266dd, 0.2);
    shadow.setDepth(5);
    this.scene.tweens.add({
      targets: shadow,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      onComplete: () => shadow.destroy(),
    });

    // Sprite de hydro pump animado
    const blastSprite = this.scene.add.sprite(x, y - 40, 'atk-hydro-pump');
    blastSprite.setScale(1.5).setDepth(11).setAlpha(0.9);
    blastSprite.play('anim-hydro-pump');
    blastSprite.once('animationcomplete', () => blastSprite.destroy());

    // Particulas de explosao aquatica massiva
    this.scene.add.particles(x, y, 'water-particle', {
      speed: { min: 100, max: 280 },
      lifespan: 600,
      quantity: 30,
      scale: { start: 3, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0x3388ff, 0x44aaff, 0x2266dd, 0x66ccff],
      emitting: false,
    }).explode();

    // Shockwave ring
    const ring = this.scene.add.graphics();
    ring.setDepth(10);
    const ringTween = this.scene.tweens.addCounter({
      from: 10,
      to: this.radius * 1.5,
      duration: 500,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        const r = tween.getValue() ?? 10;
        ring.clear();
        ring.lineStyle(4, 0x3388ff, Math.max(0, 1 - r / (this.radius * 1.5)));
        ring.strokeCircle(x, y, r);
      },
      onComplete: () => {
        ring.destroy();
        ringTween.destroy();
      },
    });

    // Crater visual
    const crater = this.scene.add.circle(x, y, this.radius * 0.6, 0x224488, 0.25);
    crater.setDepth(4);
    this.scene.tweens.add({
      targets: crater,
      alpha: 0,
      duration: 2000,
      onComplete: () => crater.destroy(),
    });

    // Screen shake
    this.scene.cameras.main.shake(200, 0.005);

    // Dano AoE principal
    this.damageInRadius(x, y, this.radius, this.damage);
  }

  /** Sub-blast: explosao menor com 50% do dano */
  private createSubBlast(x: number, y: number): void {
    // Particulas menores
    this.scene.add.particles(x, y, 'water-particle', {
      speed: { min: 50, max: 150 },
      lifespan: 400,
      quantity: 12,
      scale: { start: 2, end: 0 },
      angle: { min: 0, max: 360 },
      tint: [0x3388ff, 0x44aaff, 0x66ccff],
      emitting: false,
    }).explode();

    // Mini ring
    const miniRing = this.scene.add.graphics();
    miniRing.setDepth(9);
    const ringTween = this.scene.tweens.addCounter({
      from: 5,
      to: this.subBlastRadius * 1.2,
      duration: 300,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        const r = tween.getValue() ?? 5;
        miniRing.clear();
        miniRing.lineStyle(2, 0x44aaff, Math.max(0, 1 - r / (this.subBlastRadius * 1.2)));
        miniRing.strokeCircle(x, y, r);
      },
      onComplete: () => {
        miniRing.destroy();
        ringTween.destroy();
      },
    });

    // Mini camera shake
    this.scene.cameras.main.shake(80, 0.002);

    // Dano AoE sub-blast (50% do dano principal)
    this.damageInRadius(x, y, this.subBlastRadius, Math.floor(this.damage * 0.5));
  }

  /** Aplica dano a todos os inimigos dentro do raio */
  private damageInRadius(x: number, y: number, radius: number, damage: number): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );

    for (const enemySprite of enemies) {
      const dist = Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y);
      if (dist > radius) continue;

      const enemy = enemySprite as unknown as Enemy;
      if (typeof enemy.takeDamage === 'function') {
        const falloff = 1 - (dist / radius) * 0.4;
        setDamageSource(this.type);
        const killed = enemy.takeDamage(Math.floor(damage * falloff));
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
        }
      }
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 10;
    this.radius += 15;
    this.subBlastCount++;
    this.cooldown = Math.max(6000, this.cooldown - 800);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.blast(),
    });
  }

  destroy(): void {
    this.timer.destroy();
  }
}
