import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';
import { shouldShowVfx } from '../systems/GraphicsSettings';

/**
 * Solar Beam: raio solar devastador que segue o jogador.
 * Venusaur tier (minForm: stage2).
 * Fases: frames 0-1 = carga (sem dano), frames 2-5 = feixe ativo (dano crescente),
 * frames 6-7 = dissipação (sem dano).
 * O feixe perfura TODOS os inimigos na linha.
 * Frame 5 = dano máximo (2x base).
 */
export class SolarBeam implements Attack {
  readonly type = 'solarBeam' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;

  private activeBeam: Phaser.GameObjects.Sprite | null = null;
  private beamAngle = 0;
  private readonly hitCooldowns = new Map<number, number>();

  private static readonly HIT_RADIUS = 30;
  private static readonly BEAM_LENGTH = 140;
  /** Damage multiplier per active frame: frame 2=0.5x, 3=0.75x, 4=1x, 5=1.5x */
  private static readonly FRAME_DAMAGE: Record<number, number> = {
    2: 0.5,
    3: 0.75,
    4: 1.0,
    5: 1.5,
  };

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.solarBeam.baseDamage;
    this.cooldown = ATTACKS.solarBeam.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    if (this.activeBeam) return;

    const aimTarget = this.player.getAimTarget();
    const nearest = aimTarget ?? getSpatialGrid().queryNearest(this.player.x, this.player.y, 300);
    if (!nearest) return;

    this.beamAngle = Math.atan2(
      nearest.y - this.player.y,
      nearest.x - this.player.x
    );

    this.hitCooldowns.clear();

    const beam = this.scene.add.sprite(this.player.x, this.player.y, 'atk-solar-beam');
    beam.setScale(1.5).setDepth(8);
    beam.setRotation(this.beamAngle + Math.PI / 2);
    beam.setOrigin(0.5, 1);
    beam.play('anim-solar-beam');

    this.activeBeam = beam;

    // Trail de partículas durante o feixe
    let trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    if (shouldShowVfx()) {
      trail = this.scene.add.particles(0, 0, 'fire-particle', {
        follow: beam,
        speed: { min: 5, max: 20 },
        lifespan: 250,
        scale: { start: 1.2, end: 0 },
        quantity: 1,
        frequency: 80,
        tint: [0x66dd44, 0xaaff66, 0xffff44],
      });
    }

    beam.once('animationcomplete', () => {
      this.activeBeam = null;
      beam.destroy();
      trail?.destroy();
    });
  }

  update(_time: number, _delta: number): void {
    if (!this.activeBeam || !this.activeBeam.active) return;

    // Beam follows player position
    this.activeBeam.setPosition(this.player.x, this.player.y);

    // Check current frame for damage phase
    const currentFrame = this.activeBeam.anims?.currentFrame?.index ?? 0;
    const damageMultiplier = SolarBeam.FRAME_DAMAGE[currentFrame];

    // Only deal damage on frames 2-5
    if (damageMultiplier === undefined) return;

    const now = this.scene.time.now;
    const beamTipX = this.player.x + Math.cos(this.beamAngle) * SolarBeam.BEAM_LENGTH;
    const beamTipY = this.player.y + Math.sin(this.beamAngle) * SolarBeam.BEAM_LENGTH;

    // Check enemies along the beam line
    const enemies = getSpatialGrid().queryRadius(
      (this.player.x + beamTipX) / 2,
      (this.player.y + beamTipY) / 2,
      SolarBeam.BEAM_LENGTH
    );

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;

      // Per-enemy hit cooldown (300ms between hits on same enemy)
      const lastHit = this.hitCooldowns.get(uid) ?? 0;
      if (now - lastHit < 300) continue;

      // Check if enemy is close to the beam line
      const dist = this.pointToLineDist(
        enemy.x, enemy.y,
        this.player.x, this.player.y,
        beamTipX, beamTipY
      );
      if (dist > SolarBeam.HIT_RADIUS) continue;

      // Check enemy is between player and beam tip (not behind)
      const dotProduct =
        (enemy.x - this.player.x) * (beamTipX - this.player.x) +
        (enemy.y - this.player.y) * (beamTipY - this.player.y);
      if (dotProduct < 0) continue;

      this.hitCooldowns.set(uid, now);

      if (typeof enemy.takeDamage === 'function') {
        setDamageSource(this.type);
        const frameDamage = Math.floor(this.damage * damageMultiplier);
        const killed = enemy.takeDamage(frameDamage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }

      // Hit particle
      safeExplode(this.scene, enemy.x, enemy.y, 'fire-particle', {
        speed: { min: 20, max: 50 },
        lifespan: 200,
        quantity: 3,
        scale: { start: 1, end: 0 },
        tint: [0x66dd44, 0xaaff66],
      });
    }
  }

  /** Distance from point (px,py) to line segment (x1,y1)-(x2,y2) */
  private pointToLineDist(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  getDamage(): number {
    return this.damage;
  }

  getBullets(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group({ maxSize: 0 });
  }

  upgrade(): void {
    this.level++;
    this.damage += 10;
    this.cooldown = Math.max(2500, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown),
      loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    if (this.activeBeam) {
      this.activeBeam.destroy();
      this.activeBeam = null;
    }
  }
}
