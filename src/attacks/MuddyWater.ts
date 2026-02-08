import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

/**
 * Muddy Water: evolucao do Water Pulse.
 * Projeteis pesados que perfuram ate N inimigos com tint amarronzado.
 * Inimigos atingidos recebem debuff visual de precisao (texto "MISS" 20%).
 * Blastoise tier (minForm: stage2).
 */
export class MuddyWater implements Attack {
  readonly type = 'muddyWater' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: ArcadeGroup;
  private readonly bullets: ArcadeGroup;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private projectileCount = 1;
  private maxPierces = 5;
  private fireId = 0;

  private static readonly SPEED = 220;
  private static readonly MUDDY_TINTS: readonly number[] = [0x664422, 0x886633, 0x3388ff] as const;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.damage = ATTACKS.muddyWater.baseDamage;
    this.cooldown = ATTACKS.muddyWater.baseCooldown;

    this.bullets = scene.physics.add.group({
      defaultKey: 'atk-water-pulse',
      maxSize: 30,
    });

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const enemies = this.enemyGroup.getChildren().filter(
      (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
    );
    if (enemies.length === 0) return;

    // Ordena por distancia ao player
    const sorted = enemies
      .map(enemy => ({
        enemy,
        dist: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    const count = Math.min(this.projectileCount, sorted.length);

    for (let i = 0; i < count; i++) {
      const target = sorted[i].enemy;

      // Inimigo muito perto: dano direto
      if (sorted[i].dist < 20) {
        const enemy = target as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', target.x, target.y, enemy.xpValue);
          }
        }
        this.spawnMissDebuff(target.x, target.y);
        continue;
      }

      const bullet = this.bullets.get(
        this.player.x,
        this.player.y,
        'atk-water-pulse'
      ) as Phaser.Physics.Arcade.Sprite | null;

      if (!bullet) continue;

      const currentFireId = ++this.fireId;
      bullet.setData('fireId', currentFireId);
      bullet.setData('pierceCount', 0);
      bullet.setData('hitEnemies', new Set<number>());
      bullet.setActive(true).setVisible(true).setScale(1);
      bullet.setDepth(8).setTint(0x664422);
      bullet.play('anim-water-pulse');

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = false;
      body.enable = true;

      this.scene.physics.moveToObject(bullet, target, MuddyWater.SPEED);

      // Trail de particulas com tint lamacento
      const trail = this.scene.add.particles(0, 0, 'water-particle', {
        follow: bullet,
        speed: { min: 5, max: 20 },
        lifespan: 200,
        scale: { start: 1.2, end: 0 },
        quantity: 1,
        frequency: 50,
        tint: MuddyWater.MUDDY_TINTS as unknown as number[],
      });

      // Auto-destruir apos 3s (so se ainda for o mesmo disparo)
      this.scene.time.delayedCall(3000, () => {
        if (bullet.active && bullet.getData('fireId') === currentFireId) {
          this.killBullet(bullet);
        }
        trail.destroy();
      });
    }
  }

  /**
   * Verifica colisao manual por frame para suportar piercing.
   * Projéteis nao morrem no hit — continuam ate esgotar pierceCount ou lifetime.
   */
  update(_time: number, _delta: number): void {
    const activeBullets = this.bullets.getChildren().filter(
      (b): b is Phaser.Physics.Arcade.Sprite => (b as Phaser.Physics.Arcade.Sprite).active
    );

    for (const bullet of activeBullets) {
      const hitEnemies = bullet.getData('hitEnemies') as Set<number> | undefined;
      const pierceCount = (bullet.getData('pierceCount') as number) ?? 0;

      if (pierceCount >= this.maxPierces) {
        this.killBullet(bullet);
        continue;
      }

      const enemies = this.enemyGroup.getChildren().filter(
        (e): e is Phaser.Physics.Arcade.Sprite => (e as Phaser.Physics.Arcade.Sprite).active
      );

      for (const enemySprite of enemies) {
        // Evita hit duplicado no mesmo inimigo
        const enemyId = enemySprite.getData('instanceId') as number | undefined;
        if (enemyId !== undefined && hitEnemies?.has(enemyId)) continue;

        const dist = Phaser.Math.Distance.Between(
          bullet.x, bullet.y, enemySprite.x, enemySprite.y
        );
        if (dist > 22) continue;

        // Hit confirmado
        const enemy = enemySprite as unknown as Enemy;
        if (typeof enemy.takeDamage === 'function') {
          const killed = enemy.takeDamage(this.damage);
          if (killed) {
            this.scene.events.emit('cone-attack-kill', enemySprite.x, enemySprite.y, enemy.xpValue);
          }
        }

        // Registra pierce
        bullet.setData('pierceCount', pierceCount + 1);
        if (enemyId !== undefined && hitEnemies) {
          hitEnemies.add(enemyId);
        }

        // Debuff visual de precisao
        this.spawnMissDebuff(enemySprite.x, enemySprite.y);

        // Flash de impacto (sem destruir projetil)
        this.scene.add.particles(enemySprite.x, enemySprite.y, 'water-particle', {
          speed: { min: 15, max: 40 },
          lifespan: 150,
          quantity: 3,
          scale: { start: 1, end: 0 },
          tint: [0x664422, 0x886633],
          emitting: false,
        }).explode();

        if ((bullet.getData('pierceCount') as number) >= this.maxPierces) {
          this.killBullet(bullet);
          break;
        }
      }
    }
  }

  /**
   * 20% de chance de mostrar texto "MISS" flutuante no inimigo atingido.
   * Apenas visual (flavor), tintado amarelo.
   */
  private spawnMissDebuff(x: number, y: number): void {
    if (Math.random() >= 0.2) return;

    const missText = this.scene.add.text(x, y - 15, 'MISS', {
      fontSize: '10px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: missText,
      y: missText.y - 20,
      alpha: 0,
      duration: 600,
      onComplete: () => missText.destroy(),
    });
  }

  private killBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
    this.bullets.killAndHide(bullet);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.enable = false;
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): ArcadeGroup {
    return this.bullets;
  }

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.maxPierces++;
    if (this.level % 3 === 0) {
      this.projectileCount++;
    }
    this.cooldown = Math.max(600, this.cooldown - 120);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.bullets.destroy(true);
  }
}
