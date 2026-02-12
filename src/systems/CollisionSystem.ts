import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Destructible } from '../entities/Destructible';
import { Pickup } from '../entities/Pickup';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';
import type { PickupSystem } from './PickupSystem';
import { setDamageSource, clearDamageSource } from './DamageTracker';
import { unlockPokedexEntry } from './SaveSystem';
import { getMegaSystem } from './MegaSystem';
import { getCompanionSystem } from './CompanionSystem';
import { getStatsTracker } from './RunRecorder';
import { getComboSystem } from './ComboSystem';
import { ENEMY_TYPES } from '../data/type-chart';
import type { EnemyType } from '../types';

export class CollisionSystem {
  private readonly attackColliders = new Map<string, Phaser.Physics.Arcade.Collider[]>();

  constructor(
    private readonly ctx: GameContext,
    private readonly pickupSystem: PickupSystem,
  ) {}

  // ── Base collisions (player↔enemy, player↔xp, etc.) ──────────────
  setupBaseCollisions(): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;

    // Enemies don't stack
    scene.physics.add.collider(this.ctx.enemyGroup, this.ctx.enemyGroup);

    // Enemy → player (melee)
    scene.physics.add.overlap(
      player as Phaser.GameObjects.GameObject, this.ctx.enemyGroup,
      (_player, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.active) {
          const took = player.takeDamage(enemy.getContactDamage(), scene.time.now);
          if (took) {
            enemy.playAttackAnim();
            SoundManager.playPlayerHit();
            const ce = enemy.contactEffect;
            if (ce) {
              switch (ce.type) {
                case 'slow':
                  player.applySlow(ce.durationMs, scene.time.now);
                  break;
                case 'poison':
                  if (ce.dps) player.applyPoison(ce.dps, ce.durationMs, scene.time.now);
                  break;
                case 'knockback':
                  player.applyKnockback(enemy.x, enemy.y, ce.force ?? 200);
                  break;
                case 'drain':
                  enemy.heal(ce.amount ?? 3);
                  break;
                case 'stun':
                  player.applyStun(ce.durationMs, scene.time.now);
                  break;
                case 'confusion':
                  player.applyConfusion(ce.durationMs, scene.time.now);
                  break;
              }
            }
            scene.events.emit('stats-refresh');
            if (player.isDead()) scene.events.emit('player-died');
          }
        }
      }
    );

    // Enemy projectile → player
    scene.physics.add.overlap(
      player as Phaser.GameObjects.GameObject, this.ctx.enemyProjectiles,
      (_player, projObj) => {
        const proj = projObj as Phaser.Physics.Arcade.Sprite;
        if (!proj.active) return;

        const dmg = proj.getData('damage') as number;
        const took = player.takeDamage(dmg, scene.time.now);

        this.ctx.enemyProjectiles.killAndHide(proj);
        (proj.body as Phaser.Physics.Arcade.Body).enable = false;

        if (took) {
          SoundManager.playPlayerHit();
          const effect = proj.getData('effect') as string | null;
          const duration = proj.getData('effectDuration') as number;
          if (effect === 'slow') {
            player.applySlow(duration, scene.time.now);
          } else if (effect === 'confusion') {
            player.applyConfusion(duration, scene.time.now);
          } else if (effect === 'stun') {
            player.applyStun(duration, scene.time.now);
          }
          scene.events.emit('stats-refresh');
          if (player.isDead()) scene.events.emit('player-died');
        }
      }
    );

    // Player → XP gems
    scene.physics.add.overlap(
      player as Phaser.GameObjects.GameObject, this.ctx.xpGems,
      (_player, gemObj) => {
        const gem = gemObj as Phaser.Physics.Arcade.Sprite;
        if (!gem.active) return;
        const body = gem.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.enable = false;
        this.ctx.xpGems.killAndHide(gem);
        const xpAmount = gem.getData('xpValue') as number ?? 1;
        SoundManager.playXpPickup();
        const leveled = player.addXp(xpAmount);
        scene.events.emit('stats-refresh');
        if (leveled) scene.events.emit('request-level-up');
      }
    );

    // Player → pickups
    scene.physics.add.overlap(
      player as Phaser.GameObjects.GameObject, this.ctx.pickups,
      (_player, pickupObj) => {
        const pickup = pickupObj as Pickup;
        if (!pickup.active) return;
        this.pickupSystem.applyPickup(pickup);
      }
    );
  }

  // ── Projectile attack collisions (Ember, Water Gun, etc.) ─────────
  setupProjectileCollisions(
    attackType: string,
    bullets: Phaser.Physics.Arcade.Group,
    getDamage: () => number,
    hitElement: 'fire' | 'water' = 'fire',
    onHit?: (x: number, y: number) => void,
  ): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const scene = this.ctx.scene;

    // Bullets vs enemies
    colliders.push(scene.physics.add.overlap(bullets, this.ctx.enemyGroup, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active) return;
      const hitX = bullet.x; const hitY = bullet.y;
      bullets.killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      SoundManager.playHit();
      this.pickupSystem.playHitEffect(hitX, hitY, hitElement);
      onHit?.(hitX, hitY);
      setDamageSource(attackType);
      const killed = enemy.takeDamage(getDamage());
      clearDamageSource();
      if (killed) { SoundManager.playEnemyDeath(); this.onEnemyKilled(enemy); }
    }));

    // Bullets vs destructibles
    colliders.push(scene.physics.add.overlap(bullets, this.ctx.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      bullets.killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(getDamage());
      if (destroyed) this.pickupSystem.onDestructibleDestroyed(dest);
    }));

    this.attackColliders.set(attackType, colliders);
  }

  // ── Orbital attack collisions (FireSpin, RapidSpin, etc.) ─────────
  setupOrbitalCollisions(
    attackType: string,
    orbs: Phaser.Physics.Arcade.Group,
    getDamage: () => number,
    hitCooldownMs: number = 400,
    destDamage: number = 1,
    hitElement: 'fire' | 'water' = 'fire',
  ): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const scene = this.ctx.scene;
    const hitCooldowns = new WeakMap<Phaser.GameObjects.GameObject, number>();

    // Orbs vs enemies (with cooldown — uses WeakMap for stable identity)
    colliders.push(scene.physics.add.overlap(orbs, this.ctx.enemyGroup, (_orbObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return;
      const lastHit = hitCooldowns.get(enemy) ?? 0;
      if (scene.time.now - lastHit < hitCooldownMs) return;
      hitCooldowns.set(enemy, scene.time.now);
      this.pickupSystem.playHitEffect(enemy.x, enemy.y, hitElement);
      setDamageSource(attackType);
      const killed = enemy.takeDamage(getDamage());
      clearDamageSource();
      if (killed) { this.onEnemyKilled(enemy); }
    }));

    // Orbs vs destructibles
    colliders.push(scene.physics.add.overlap(orbs, this.ctx.destructibles, (_orbObj, destObj) => {
      const dest = destObj as Destructible;
      if (!dest.active) return;
      const destroyed = dest.takeDamage(destDamage);
      if (destroyed) this.pickupSystem.onDestructibleDestroyed(dest);
    }));

    // Orbs destroy enemy projectiles
    colliders.push(scene.physics.add.overlap(orbs, this.ctx.enemyProjectiles, (_orbObj, projObj) => {
      const proj = projObj as Phaser.Physics.Arcade.Sprite;
      if (!proj.active) return;
      this.ctx.enemyProjectiles.killAndHide(proj);
      (proj.body as Phaser.Physics.Arcade.Body).enable = false;
      this.pickupSystem.playHitEffect(proj.x, proj.y, hitElement);
    }));

    this.attackColliders.set(attackType, colliders);
  }

  // ── Deflect-only collisions (aura that destroys enemy projectiles) ──
  setupDeflectCollisions(
    attackType: string,
    zone: Phaser.Physics.Arcade.Group,
    hitElement: 'fire' | 'water' = 'water',
  ): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const scene = this.ctx.scene;

    colliders.push(scene.physics.add.overlap(zone, this.ctx.enemyProjectiles, (_zoneObj, projObj) => {
      const proj = projObj as Phaser.Physics.Arcade.Sprite;
      if (!proj.active) return;
      this.ctx.enemyProjectiles.killAndHide(proj);
      (proj.body as Phaser.Physics.Arcade.Body).enable = false;
      this.pickupSystem.playHitEffect(proj.x, proj.y, hitElement);
    }));

    this.attackColliders.set(attackType, colliders);
  }

  // ── Inferno-style collisions (projectile that explodes on hit) ────
  setupInfernoCollisions(
    attackType: string,
    bullets: Phaser.Physics.Arcade.Group,
    getDamage: () => number,
    explodeAt: (x: number, y: number) => void,
  ): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const scene = this.ctx.scene;

    colliders.push(scene.physics.add.overlap(bullets, this.ctx.enemyGroup, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active) return;
      bullets.killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      setDamageSource(attackType);
      const killed = enemy.takeDamage(getDamage());
      clearDamageSource();
      if (killed) { this.onEnemyKilled(enemy); }
      explodeAt(enemy.x, enemy.y);
    }));

    colliders.push(scene.physics.add.overlap(bullets, this.ctx.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      bullets.killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(getDamage());
      if (destroyed) this.pickupSystem.onDestructibleDestroyed(dest);
    }));

    this.attackColliders.set(attackType, colliders);
  }

  // ── Destructible-only collisions (for collision:'none' attacks with bullets) ──
  setupDestructibleOnlyCollisions(
    attackType: string,
    bullets: Phaser.Physics.Arcade.Group,
    getDamage: () => number,
  ): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    colliders.push(this.ctx.scene.physics.add.overlap(bullets, this.ctx.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      bullets.killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(getDamage());
      if (destroyed) this.pickupSystem.onDestructibleDestroyed(dest);
    }));
    this.attackColliders.set(`${attackType}-dest`, colliders);
  }

  // ── Remove colliders for attack evolution ─────────────────────────
  removeAttackColliders(type: string): void {
    for (const key of [type, `${type}-dest`]) {
      const colliders = this.attackColliders.get(key);
      if (colliders) {
        colliders.forEach(c => c.destroy());
        this.attackColliders.delete(key);
      }
    }
  }

  // ── Enemy killed handler ──────────────────────────────────────────
  private onEnemyKilled(enemy: Enemy): void {
    this.ctx.player.stats.kills++;
    this.pickupSystem.spawnXpGem(enemy.x, enemy.y, enemy.xpValue);

    // Run stats + combo tracking
    getStatsTracker().recordKill(enemy.enemyKey, enemy.xpValue);
    getComboSystem().recordKill();

    // Mega gauge tracking
    getMegaSystem()?.addKill();

    // Pokédex tracking
    const enemyType = ENEMY_TYPES[enemy.enemyKey as EnemyType];
    unlockPokedexEntry(enemy.enemyKey, enemy.enemyKey, enemyType ?? 'normal');

    if (enemy instanceof Boss) {
      this.pickupSystem.spawnPickup(enemy.x, enemy.y, 'gachaBox');
      this.pickupSystem.spawnBossCoins(enemy.x, enemy.y);
      getCompanionSystem()?.tryDropFriendBall(enemy.x, enemy.y);
      getStatsTracker().recordBossKill(enemy.name);
      this.ctx.scene.events.emit('boss-killed', enemy.name);
    }
  }
}
