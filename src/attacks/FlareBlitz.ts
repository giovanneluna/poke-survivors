import Phaser from 'phaser';
import type { Attack } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';
import { safeExplode } from '../utils/particles';

/**
 * Flare Blitz: dash devastador em chamas com recoil.
 * Dano massivo em linha + AoE no ponto de impacto, mas custa HP.
 * Charizard tier (minForm: stage2).
 */
export class FlareBlitz implements Attack {
  readonly type = 'flareBlitz' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;
  private dashDistance = 120;
  private explosionRadius = 60;
  private recoilPercent = 0.08;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.flareBlitz.baseDamage;
    this.cooldown = ATTACKS.flareBlitz.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.blitz(),
    });
  }

  private blitz(): void {
    const dir = this.player.getLastDirection();
    const angle = Math.atan2(dir.y, dir.x);

    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * this.dashDistance;
    const endY = startY + Math.sin(angle) * this.dashDistance;

    // Trail de fogo intenso ao longo do caminho
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;
      this.scene.time.delayedCall(i * 20, () => {
        safeExplode(this.scene, px, py, 'fire-particle', {
          speed: { min: 40, max: 100 }, lifespan: 400, quantity: 6,
          scale: { start: 2, end: 0 }, tint: [0xff0000, 0xff4400, 0xff8800],
        });
      });
    }

    // Sprite animado do flare blitz no dash
    const blitzSprite = this.scene.add.sprite(startX, startY, 'atk-flare-blitz');
    blitzSprite.setScale(1).setDepth(10).setAlpha(0.9);
    blitzSprite.setRotation(angle);
    blitzSprite.play('anim-flare-blitz');
    this.scene.tweens.add({
      targets: blitzSprite, x: endX, y: endY, duration: steps * 20,
    });
    blitzSprite.once('animationcomplete', () => blitzSprite.destroy());

    // Explosão no ponto final
    this.scene.time.delayedCall(steps * 20, () => {
      safeExplode(this.scene, endX, endY, 'fire-particle', {
        speed: { min: 60, max: 150 }, lifespan: 500, quantity: 20,
        scale: { start: 3, end: 0 }, tint: [0xff0000, 0xff2200, 0xffaa00],
      });
    });

    // Dano: inimigos na linha + raio de explosão
    const enemies = getSpatialGrid().getActiveEnemies();

    for (const enemy of enemies) {
      // Check distância à linha do dash
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const perpDist = Math.abs(
        (dy * (enemy.x - startX) - dx * (enemy.y - startY)) / len
      );
      const projT = ((enemy.x - startX) * dx + (enemy.y - startY) * dy) / (len * len);

      // Na linha do dash (±30px) ou no raio de explosão
      const inLine = perpDist < 30 && projT >= -0.1 && projT <= 1.1;
      const distToEnd = Phaser.Math.Distance.Between(enemy.x, enemy.y, endX, endY);
      const inExplosion = distToEnd <= this.explosionRadius;

      if (!inLine && !inExplosion) continue;

      if (typeof enemy.takeDamage === 'function') {
        // Dano aumentado se na explosão
        const dmg = inExplosion ? Math.floor(this.damage * 1.3) : this.damage;
        setDamageSource(this.type);
        const killed = enemy.takeDamage(dmg);
        if (killed) {
          this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
        }
      }
    }

    // Recoil: custa HP
    const recoilDmg = Math.floor(this.player.stats.maxHp * this.recoilPercent);
    if (this.player.stats.hp > recoilDmg + 1) {
      this.player.stats.hp -= recoilDmg;
      // Flash vermelho no player
      this.player.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => {
        if (this.player.active) this.player.clearTint();
      });
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 8;
    this.dashDistance += 10;
    this.explosionRadius += 5;
    this.recoilPercent = Math.max(0.03, this.recoilPercent - 0.007);
    this.cooldown = Math.max(2500, this.cooldown - 200);
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.player.getAdjustedCooldown(this.cooldown), loop: true, callback: () => this.blitz(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
