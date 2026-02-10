import Phaser from 'phaser';
import type { Player } from './Player';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

// ── Constants ──────────────────────────────────────────────────────────
const ORBIT_RADIUS_X = 80;
const ORBIT_RADIUS_Y = 50;
const BOB_AMPLITUDE = 3;
const BOB_FREQUENCY = 0.003;
const BULLET_SPEED = 300;
const BULLET_LIFESPAN_MS = 1500;
const QUERY_RANGE = 300;

/**
 * Companion -- um Pokémon que orbita o player e dispara projéteis
 * no inimigo mais próximo via SpatialHashGrid.queryNearest().
 *
 * Obtido via Friend Ball (drop de bosses).
 * Escala dano com nível do player e evolução.
 */
export class Companion extends Phaser.Physics.Arcade.Sprite {
  private orbitAngle: number;
  private readonly orbitSpeed: number = 1.5;
  private lastAttackTime: number = 0;
  private readonly attackCooldown: number = 2000;
  private readonly baseDamage: number = 5;
  private readonly companionKey: string;
  private damageMultiplier: number = 1.0;
  private shadow: Phaser.GameObjects.Image | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    orbitOffset: number,
  ) {
    super(scene, x, y, key);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as Phaser.GameObjects.GameObject);

    this.companionKey = key;
    this.orbitAngle = orbitOffset;

    this.setScale(0.6);
    this.setDepth(11);

    // Desabilita corpo físico do companion (não colide com nada)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.enable = false;

    // Sombra sutil
    this.shadow = scene.add
      .image(x, y + 6, 'shadow')
      .setDepth(10)
      .setScale(0.5)
      .setAlpha(0.4);

    // Tenta tocar animação de idle/walk se existir
    const animKey = `${key}-down`;
    if (scene.anims.exists(animKey)) {
      this.play(animKey);
    }
  }

  // ── Update (chamado pelo CompanionSystem) ──────────────────────────
  update(time: number, delta: number, player: Player): void {
    if (!this.active || !this.scene) return;

    // Atualiza posição orbital
    this.orbitAngle += this.orbitSpeed * (delta / 1000);
    if (this.orbitAngle > Math.PI * 2) {
      this.orbitAngle -= Math.PI * 2;
    }

    const bobOffset = Math.sin(time * BOB_FREQUENCY) * BOB_AMPLITUDE;
    const targetX = player.x + Math.cos(this.orbitAngle) * ORBIT_RADIUS_X;
    const targetY = player.y + Math.sin(this.orbitAngle) * ORBIT_RADIUS_Y + bobOffset;

    this.setPosition(targetX, targetY);

    // Flip horizontal baseado na posição relativa ao player
    this.setFlipX(this.x < player.x);

    // Atualiza sombra
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 6);
    }

    // Tenta atacar se cooldown permite
    if (time - this.lastAttackTime >= this.attackCooldown) {
      this.tryAttack(time, player);
    }
  }

  // ── Tentativa de ataque ────────────────────────────────────────────
  private tryAttack(time: number, player: Player): void {
    const grid = getSpatialGrid();
    if (!grid) return;

    const nearest = grid.queryNearest(this.x, this.y, QUERY_RANGE);
    if (!nearest || !nearest.active) return;

    const damage = this.computeDamage(player);
    this.lastAttackTime = time;

    // Emite evento para CompanionSystem disparar o projétil
    this.scene.events.emit(
      'companion-fire',
      this.x,
      this.y,
      nearest.x,
      nearest.y,
      damage,
    );
  }

  // ── Disparo do projétil (chamado pelo CompanionSystem) ─────────────
  fire(
    bulletGroup: Phaser.Physics.Arcade.Group,
    targetX: number,
    targetY: number,
    damage: number,
  ): void {
    const bullet = bulletGroup.get(
      this.x,
      this.y,
      'companion-bullet',
    ) as Phaser.Physics.Arcade.Sprite | null;

    if (!bullet) return;

    bullet.setTexture('companion-bullet');
    bullet.setActive(true).setVisible(true);
    bullet.setScale(0.8);
    bullet.setDepth(9);
    bullet.setData('damage', damage);

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.reset(this.x, this.y);
    body.setCircle(6);

    // Direção para o alvo
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const vx = Math.cos(angle) * BULLET_SPEED;
    const vy = Math.sin(angle) * BULLET_SPEED;
    body.setVelocity(vx, vy);

    // Auto-kill após lifespan
    this.scene.time.delayedCall(BULLET_LIFESPAN_MS, () => {
      if (bullet.active) {
        bullet.setActive(false).setVisible(false);
        body.stop();
      }
    });
  }

  // ── Dano escalado ──────────────────────────────────────────────────
  private computeDamage(player: Player): number {
    const levelScaling = 1 + player.stats.level * 0.05;
    return Math.floor(this.baseDamage * levelScaling * this.damageMultiplier);
  }

  // ── Player evoluiu — boost de dano ─────────────────────────────────
  onPlayerEvolve(): void {
    this.damageMultiplier = 1.5;
  }

  // ── Getter para key do Pokémon ─────────────────────────────────────
  getKey(): string {
    return this.companionKey;
  }

  // ── Cleanup ────────────────────────────────────────────────────────
  destroy(fromScene?: boolean): void {
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    super.destroy(fromScene);
  }
}
