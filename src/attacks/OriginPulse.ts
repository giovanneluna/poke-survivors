import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { shouldShowVfx } from '../systems/GraphicsSettings';

interface ActiveCone {
  sprite: Phaser.GameObjects.Sprite;
  hitEnemies: Set<number>;
  dirAngleRad: number;
}

/**
 * Origin Pulse: evolucao do Hydro Pump.
 * Cone beam massivo que perfura TODOS os inimigos na direcao.
 * Cria campo de agua residual ao longo do beam (tick damage 25% a cada 300ms).
 * Blastoise tier (minForm: stage2).
 */
export class OriginPulse implements Attack {
  readonly type = 'originPulse' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private range = 120;
  private cooldown: number;
  private readonly coneAngleDeg = 50;
  private readonly lingerDurationMs = 1500;
  private readonly lingerTickMs = 300;
  private activeCone: ActiveCone | null = null;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.originPulse.baseDamage;
    this.cooldown = ATTACKS.originPulse.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown,
      loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    const dir = this.player.getLastDirection();
    const dirAngleRad = Math.atan2(dir.y, dir.x);
    const dirAngleDeg = Phaser.Math.RadToDeg(dirAngleRad);

    // Sprite animado de Origin Pulse (hydro pump escalonado) na direcao do ataque
    const offsetX = Math.cos(dirAngleRad) * 50;
    const offsetY = Math.sin(dirAngleRad) * 50;
    const beam = this.scene.add.sprite(
      this.player.x + offsetX, this.player.y + offsetY, 'atk-hydro-pump'
    );
    beam.setScale(0.8).setDepth(10).setAlpha(0.9);
    beam.setRotation(dirAngleRad - Math.PI / 2);
    beam.play('anim-hydro-pump');
    const followBeam = (): void => {
      if (beam.active) beam.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    };
    this.scene.events.on('update', followBeam);
    this.scene.tweens.add({
      targets: beam,
      scale: 1.2,
      alpha: 0,
      duration: 900,
      onComplete: () => {
        this.scene.events.off('update', followBeam);
        this.activeCone = null;
        beam.destroy();
      },
    });

    // Particulas de agua ao longo do cone (fix leak: destroy after explode)
    const coneParticles = this.scene.add.particles(this.player.x, this.player.y, 'water-particle', {
      speed: { min: 200, max: 400 },
      angle: { min: dirAngleDeg - this.coneAngleDeg / 2, max: dirAngleDeg + this.coneAngleDeg / 2 },
      lifespan: 400,
      quantity: 25,
      scale: { start: 3, end: 0.3 },
      tint: [0x3388ff, 0x44aaff, 0x0044ff, 0x66ccff],
      emitting: false,
    });
    coneParticles.explode();
    this.scene.time.delayedCall(500, () => coneParticles.destroy());

    // Shake da camera
    this.scene.cameras.main.shake(200, 0.004);

    // Registra cone ativo — dano aplicado em update()
    this.activeCone = {
      sprite: beam,
      hitEnemies: new Set<number>(),
      dirAngleRad,
    };

    // Campo de agua residual ao longo do beam (posicoes fixas — correto)
    this.spawnLingerField(dirAngleRad);
  }

  /**
   * Cria zonas de tick damage ao longo da linha do beam.
   * Cada zona pulsa dano a 25% do baseDamage a cada 300ms por 1.5s.
   */
  private spawnLingerField(angleRad: number): void {
    const tickDamage = Math.max(1, Math.floor(this.damage * 0.25));
    const fieldSteps = 4;
    const totalTicks = Math.floor(this.lingerDurationMs / this.lingerTickMs);

    for (let s = 0; s < fieldSteps; s++) {
      const t = (s + 1) / (fieldSteps + 1);
      const px = this.player.x + Math.cos(angleRad) * this.range * t;
      const py = this.player.y + Math.sin(angleRad) * this.range * t;

      // Visual: circulo de agua pulsante
      let waterZone: Phaser.GameObjects.Arc | null = null;
      if (shouldShowVfx()) {
        waterZone = this.scene.add.circle(px, py, 18, 0x3388ff, 0.25).setDepth(3);
      }

      let tickCount = 0;
      const tickEvent = this.scene.time.addEvent({
        delay: this.lingerTickMs,
        repeat: totalTicks - 1,
        callback: () => {
          tickCount++;

          // Particulas de tick (fix leak: destroy after explode)
          const tickParticles = this.scene.add.particles(px, py, 'water-particle', {
            speed: { min: 10, max: 30 },
            lifespan: 200,
            quantity: 2,
            scale: { start: 1, end: 0 },
            tint: [0x3388ff, 0x44aaff],
            emitting: false,
          });
          tickParticles.explode();
          this.scene.time.delayedCall(300, () => tickParticles.destroy());

          // Dano AoE na zona
          const nearbyEnemies = getSpatialGrid().queryRadius(px, py, 30);

          for (const enemy of nearbyEnemies) {
            setDamageSource(this.type);
            const killed = enemy.takeDamage(tickDamage);
            if (killed) {
              this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
            }
          }

          if (tickCount >= totalTicks) {
            tickEvent.destroy();
          }
        },
      });

      // Fade out e destruir a zona visual
      if (waterZone) {
        this.scene.tweens.add({
          targets: waterZone,
          alpha: 0,
          duration: this.lingerDurationMs,
          onComplete: () => waterZone?.destroy(),
        });
      }
    }
  }

  update(_time: number, _delta: number): void {
    if (!this.activeCone) return;
    const { sprite, hitEnemies, dirAngleRad } = this.activeCone;
    if (!sprite.active) { this.activeCone = null; return; }

    const px = this.player.x;
    const py = this.player.y;
    const enemies = getSpatialGrid().queryRadius(px, py, this.range);

    for (const enemy of enemies) {
      const uid = (enemy.getData('uid') as number) ?? 0;
      if (hitEnemies.has(uid)) continue;

      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);

      let inCone = dist < 25;
      if (!inCone) {
        const angleToEnemy = Math.atan2(enemy.y - py, enemy.x - px);
        const angleDiff = Math.abs(
          Phaser.Math.Angle.ShortestBetween(
            Phaser.Math.RadToDeg(dirAngleRad),
            Phaser.Math.RadToDeg(angleToEnemy)
          )
        );
        inCone = angleDiff <= this.coneAngleDeg / 2;
      }

      if (inCone) {
        hitEnemies.add(uid);
        setDamageSource(this.type);
        const killed = enemy.takeDamage(this.damage);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }
  }

  upgrade(): void {
    this.level++;
    this.damage += 10;
    this.range += 10;
    this.cooldown = Math.max(2000, this.cooldown - 250);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true, callback: () => this.fire(),
    });
  }

  destroy(): void {
    this.timer.destroy();
    this.activeCone = null;
  }
}
