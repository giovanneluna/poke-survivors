import Phaser from 'phaser';
import type { GameContext } from './GameContext';
import { ENEMIES, WAVES, GAME } from '../config';
import type { EnemyConfig } from '../types';
import { Enemy } from '../entities/Enemy';
import { getSpatialGrid } from './SpatialHashGrid';
import { SoundManager } from '../audio/SoundManager';
import { Destructible } from '../entities/Destructible';
import { DESTRUCTIBLES } from '../config';

// ── Types ──────────────────────────────────────────────────────────────

type EventTrigger = 'timed' | 'wave';

interface MapEvent {
  readonly id: string;
  readonly name: string;
  readonly trigger: EventTrigger;
  readonly triggerTimeMs: number;
  readonly repeat?: number;
  readonly minTimeMs?: number;
  readonly chance?: number;
  readonly cooldownMs?: number;
  fired: boolean;
  lastFiredAt: number;
  execute: (ctx: GameContext, gameTime: number) => void;
}

/** Rastreio de efeitos ativos para cleanup/update. */
interface ActiveHealingZone {
  readonly circle: Phaser.GameObjects.Arc;
  readonly cross: Phaser.GameObjects.GameObject;
  readonly createdAt: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  lastHealTick: number;
}

interface ActiveEclipse {
  readonly overlay: Phaser.GameObjects.Rectangle;
  readonly createdAt: number;
  readonly duration: number;
  fadingOut: boolean;
}

interface ActiveSwarm {
  readonly enemyConfig: EnemyConfig;
  spawned: number;
  readonly total: number;
  frameCounter: number;
}

// ── EventSystem ────────────────────────────────────────────────────────

class EventSystemImpl {
  private ctx!: GameContext;
  private readonly events: MapEvent[] = [];

  // ── Active effects ──
  private readonly activeHealingZones: ActiveHealingZone[] = [];
  private activeEclipse: ActiveEclipse | null = null;
  private activeSwarm: ActiveSwarm | null = null;
  private currentWaveIndex = 0;
  private lastGameTime = 0;

  // ── Constants ──
  private static readonly HEAL_ZONE_RADIUS = 80;
  private static readonly HEAL_ZONE_TICK_MS = 500;
  private static readonly HEAL_ZONE_DURATION_MS = 15_000;
  private static readonly HEAL_ZONE_HP = 5;
  private static readonly ECLIPSE_DURATION_MS = 30_000;
  private static readonly SWARM_TOTAL = 40;
  private static readonly SWARM_PER_FRAME = 2;
  private static readonly SWARM_FRAMES = 20;

  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.events.length = 0;
    this.activeHealingZones.length = 0;
    this.activeEclipse = null;
    this.activeSwarm = null;
    this.currentWaveIndex = 0;
    this.registerEvents();
  }

  // ── Event Registration ───────────────────────────────────────────────

  private registerEvents(): void {
    // 1. Pokemon Center — timed, repeating every 3 min
    this.events.push({
      id: 'pokemonCenter',
      name: 'Pokémon Center',
      trigger: 'timed',
      triggerTimeMs: 180_000,
      repeat: 180_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, gameTime) => this.executePokemonCenter(ctx, gameTime),
    });

    // 2. Professor Oak's Lab — timed, one-shot at 4 min
    this.events.push({
      id: 'professorOak',
      name: "Professor Oak's Lab",
      trigger: 'timed',
      triggerTimeMs: 240_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, _gameTime) => this.executeProfessorOak(ctx),
    });

    // 3. Swarm — wave-triggered, 5% chance, min 2 min, cooldown 60s
    this.events.push({
      id: 'swarm',
      name: 'Swarm',
      trigger: 'wave',
      triggerTimeMs: 0,
      chance: 0.05,
      minTimeMs: 120_000,
      cooldownMs: 60_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, gameTime) => this.executeSwarm(ctx, gameTime),
    });

    // 4. Eclipse — timed, one-shot at 6 min
    this.events.push({
      id: 'eclipse',
      name: 'Eclipse',
      trigger: 'timed',
      triggerTimeMs: 360_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, gameTime) => this.executeEclipse(ctx, gameTime),
    });

    // 5. Legendary Sighting — timed, one-shot at 8 min
    this.events.push({
      id: 'legendarySighting',
      name: 'Legendary Sighting',
      trigger: 'timed',
      triggerTimeMs: 480_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, _gameTime) => this.executeLegendarySighting(ctx),
    });

    // 6. Treasure Room — wave-triggered, 8% chance, min 3 min, cooldown 90s
    this.events.push({
      id: 'treasureRoom',
      name: 'Treasure Room',
      trigger: 'wave',
      triggerTimeMs: 0,
      chance: 0.08,
      minTimeMs: 180_000,
      cooldownMs: 90_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, gameTime) => this.executeTreasureRoom(ctx, gameTime),
    });
  }

  // ── Update (chamado todo frame) ──────────────────────────────────────

  update(gameTime: number, _delta: number): void {
    this.lastGameTime = gameTime;

    // Check timed events
    for (const evt of this.events) {
      if (evt.trigger !== 'timed') continue;

      if (evt.repeat != null) {
        // Repeating event
        if (gameTime >= evt.triggerTimeMs && gameTime - evt.lastFiredAt >= evt.repeat) {
          evt.lastFiredAt = gameTime;
          evt.execute(this.ctx, gameTime);
        }
      } else {
        // One-shot event
        if (!evt.fired && gameTime >= evt.triggerTimeMs) {
          evt.fired = true;
          evt.lastFiredAt = gameTime;
          evt.execute(this.ctx, gameTime);
        }
      }
    }

    // Update active healing zones
    this.updateHealingZones(gameTime);

    // Update active eclipse
    this.updateEclipse(gameTime);

    // Update active swarm spawning
    this.updateSwarm();
  }

  // ── Wave Change (chamado pelo SpawnSystem/GameScene) ─────────────────

  onWaveChanged(waveIndex: number, gameTime: number): void {
    this.currentWaveIndex = waveIndex;

    for (const evt of this.events) {
      if (evt.trigger !== 'wave') continue;

      // Min time check
      if (evt.minTimeMs != null && gameTime < evt.minTimeMs) continue;

      // Cooldown check
      if (evt.cooldownMs != null && gameTime - evt.lastFiredAt < evt.cooldownMs) continue;

      // Chance roll
      if (evt.chance != null && Math.random() >= evt.chance) continue;

      // Execute
      evt.lastFiredAt = gameTime;
      evt.execute(this.ctx, gameTime);
    }
  }

  // ── Event Implementations ────────────────────────────────────────────

  private executePokemonCenter(ctx: GameContext, gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    // Random offset 100-200px from player
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(100, 200);
    const x = Phaser.Math.Clamp(
      player.x + Math.cos(angle) * dist,
      100, GAME.worldWidth - 100,
    );
    const y = Phaser.Math.Clamp(
      player.y + Math.sin(angle) * dist,
      100, GAME.worldHeight - 100,
    );

    // Green healing zone circle
    const circle = scene.add.circle(x, y, EventSystemImpl.HEAL_ZONE_RADIUS, 0x44ff44, 0.15);
    circle.setDepth(1);

    // Healing effect at center (RECOVER sprite or fallback cross)
    let cross: Phaser.GameObjects.GameObject;
    if (scene.textures.exists('atk-recover')) {
      const recoverSprite = scene.add.sprite(x, y, 'atk-recover');
      recoverSprite.setDepth(2).setScale(1.5).setAlpha(0.8);
      recoverSprite.play('anim-recover');
      recoverSprite.on('animationcomplete', () => {
        recoverSprite.play('anim-recover');
      });
      cross = recoverSprite;
    } else {
      const gfx = scene.add.graphics();
      gfx.setDepth(2);
      gfx.fillStyle(0xffffff, 0.9);
      gfx.fillRect(x - 8, y - 8, 16, 16);
      gfx.fillStyle(0xff0000, 1);
      gfx.fillRect(x - 2, y - 6, 4, 12);
      gfx.fillRect(x - 6, y - 2, 12, 4);
      cross = gfx;
    }

    // Pulse tween on the circle
    scene.tweens.add({
      targets: circle,
      scaleX: 1.05,
      scaleY: 1.05,
      alpha: 0.25,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.activeHealingZones.push({
      circle,
      cross,
      createdAt: gameTime,
      x,
      y,
      radius: EventSystemImpl.HEAL_ZONE_RADIUS,
      lastHealTick: gameTime,
    });

    scene.events.emit('event-banner', { name: 'Pokémon Center', color: '#44ff44' });
  }

  private executeProfessorOak(ctx: GameContext): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(80, 150);
    const x = Phaser.Math.Clamp(
      player.x + Math.cos(angle) * dist,
      100, GAME.worldWidth - 100,
    );
    const y = Phaser.Math.Clamp(
      player.y + Math.sin(angle) * dist,
      100, GAME.worldHeight - 100,
    );

    // Spawn gacha box pickup
    this.spawnGachaBox(x, y);

    scene.events.emit('event-banner', { name: "Professor Oak's Lab", color: '#ffaa00' });
  }

  private executeSwarm(ctx: GameContext, _gameTime: number): void {
    if (this.activeSwarm) return; // Already swarming

    const wave = WAVES[Math.min(this.currentWaveIndex, WAVES.length - 1)];
    if (wave.enemies.length === 0) return;

    // Pick random enemy type from current wave
    const entry = wave.enemies[Phaser.Math.Between(0, wave.enemies.length - 1)];
    const enemyConfig = ENEMIES[entry.type];
    if (!enemyConfig) return;

    SoundManager.playEventWarning();

    this.activeSwarm = {
      enemyConfig,
      spawned: 0,
      total: EventSystemImpl.SWARM_TOTAL,
      frameCounter: 0,
    };

    ctx.scene.events.emit('event-banner', {
      name: `SWARM: ${enemyConfig.name}!`,
      color: '#ff4444',
    });
  }

  private executeEclipse(ctx: GameContext, gameTime: number): void {
    if (this.activeEclipse) return;

    const scene = ctx.scene;
    const cam = scene.cameras.main;
    SoundManager.playEventWarning();

    const overlay = scene.add.rectangle(
      cam.centerX, cam.centerY,
      cam.width * 3, cam.height * 3,
      0x000022, 0,
    );
    overlay.setDepth(1).setScrollFactor(0);

    // Fade in
    scene.tweens.add({
      targets: overlay,
      alpha: 0.4,
      duration: 2000,
      ease: 'Sine.easeIn',
    });

    this.activeEclipse = {
      overlay,
      createdAt: gameTime,
      duration: EventSystemImpl.ECLIPSE_DURATION_MS,
      fadingOut: false,
    };

    scene.events.emit('event-banner', { name: 'Eclipse!', color: '#6644aa' });
  }

  private executeLegendarySighting(ctx: GameContext): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(
      player.x + Math.cos(angle) * 300,
      100, GAME.worldWidth - 100,
    );
    const y = Phaser.Math.Clamp(
      player.y + Math.sin(angle) * 300,
      100, GAME.worldHeight - 100,
    );

    // Spawn special gacha box with sparkle effect
    this.spawnGachaBox(x, y);

    // Mew visual sprite (decorative, floats away and fades)
    if (scene.textures.exists('mew-walk')) {
      const mew = scene.add.sprite(x, y - 30, 'mew-walk');
      mew.setScale(1.2).setDepth(10);
      mew.play('mew-walk-down');
      scene.tweens.add({
        targets: mew,
        x: x + Phaser.Math.Between(-150, 150),
        y: y + Phaser.Math.Between(-150, 150),
        alpha: 0,
        duration: 5000,
        ease: 'Sine.easeIn',
        onComplete: () => mew.destroy(),
      });
    }

    // Sparkle ring to draw attention
    const sparkle = scene.add.circle(x, y, 40, 0xff44ff, 0.2);
    sparkle.setDepth(1);
    scene.tweens.add({
      targets: sparkle,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeOut',
      onComplete: () => sparkle.destroy(),
    });

    scene.events.emit('event-banner', { name: 'Legendary Sighting!', color: '#ff44ff' });
  }

  private executeTreasureRoom(ctx: GameContext, _gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const chestCount = Phaser.Math.Between(3, 5);
    const chestConfig = DESTRUCTIBLES.treasureChest;

    for (let i = 0; i < chestCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(80, 200);
      const x = Phaser.Math.Clamp(
        player.x + Math.cos(angle) * dist,
        100, GAME.worldWidth - 100,
      );
      const y = Phaser.Math.Clamp(
        player.y + Math.sin(angle) * dist,
        100, GAME.worldHeight - 100,
      );

      const chest = new Destructible(scene, x, y, chestConfig);
      ctx.destructibles.add(chest);
    }

    // Spawn 3 Machop guards
    const machopConfig = ENEMIES.machop;
    if (machopConfig) {
      const grid = getSpatialGrid();
      for (let i = 0; i < 3; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(100, 180);
        const ex = Phaser.Math.Clamp(
          player.x + Math.cos(angle) * dist,
          100, GAME.worldWidth - 100,
        );
        const ey = Phaser.Math.Clamp(
          player.y + Math.sin(angle) * dist,
          100, GAME.worldHeight - 100,
        );

        const enemy = new Enemy(scene, ex, ey, machopConfig);
        ctx.enemyGroup.add(enemy);
        grid.insert(enemy);
      }
    }

    scene.events.emit('event-banner', { name: 'Treasure Room!', color: '#ffdd44' });
  }

  // ── Active Effect Updates ────────────────────────────────────────────

  private updateHealingZones(gameTime: number): void {
    const player = this.ctx.player;

    for (let i = this.activeHealingZones.length - 1; i >= 0; i--) {
      const zone = this.activeHealingZones[i];
      const elapsed = gameTime - zone.createdAt;

      // Expired — fade out and destroy
      if (elapsed >= EventSystemImpl.HEAL_ZONE_DURATION_MS) {
        const scene = this.ctx.scene;
        scene.tweens.add({
          targets: [zone.circle, zone.cross],
          alpha: 0,
          duration: 500,
          ease: 'Sine.easeOut',
          onComplete: () => {
            zone.circle.destroy();
            zone.cross.destroy();
          },
        });
        this.activeHealingZones.splice(i, 1);
        continue;
      }

      // Heal tick — check player distance every HEAL_ZONE_TICK_MS
      if (gameTime - zone.lastHealTick >= EventSystemImpl.HEAL_ZONE_TICK_MS) {
        zone.lastHealTick = gameTime;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, zone.x, zone.y);
        if (dist <= zone.radius) {
          player.heal(EventSystemImpl.HEAL_ZONE_HP);
          // Green flash on player
          player.setTint(0x44ff44);
          setTimeout(() => {
            if (player.active) player.clearTint();
          }, 100);
        }
      }
    }
  }

  private updateEclipse(gameTime: number): void {
    if (!this.activeEclipse) return;

    const elapsed = gameTime - this.activeEclipse.createdAt;

    // Start fade out near end
    if (elapsed >= this.activeEclipse.duration && !this.activeEclipse.fadingOut) {
      this.activeEclipse.fadingOut = true;
      const overlay = this.activeEclipse.overlay;
      this.ctx.scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 2000,
        ease: 'Sine.easeOut',
        onComplete: () => {
          overlay.destroy();
        },
      });
      this.activeEclipse = null;
    }
  }

  private updateSwarm(): void {
    if (!this.activeSwarm) return;

    const swarm = this.activeSwarm;
    swarm.frameCounter++;

    // Spawn SWARM_PER_FRAME enemies every frame, for SWARM_FRAMES frames
    if (swarm.frameCounter <= EventSystemImpl.SWARM_FRAMES && swarm.spawned < swarm.total) {
      const scene = this.ctx.scene;
      const player = this.ctx.player;
      const grid = getSpatialGrid();
      const toSpawn = Math.min(
        EventSystemImpl.SWARM_PER_FRAME,
        swarm.total - swarm.spawned,
      );

      for (let i = 0; i < toSpawn; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(400, 600);
        const x = Phaser.Math.Clamp(
          player.x + Math.cos(angle) * dist,
          50, GAME.worldWidth - 50,
        );
        const y = Phaser.Math.Clamp(
          player.y + Math.sin(angle) * dist,
          50, GAME.worldHeight - 50,
        );

        const enemy = new Enemy(scene, x, y, swarm.enemyConfig);
        this.ctx.enemyGroup.add(enemy);
        grid.insert(enemy);
        swarm.spawned++;
      }
    }

    // Done spawning
    if (swarm.spawned >= swarm.total || swarm.frameCounter > EventSystemImpl.SWARM_FRAMES) {
      this.activeSwarm = null;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private spawnGachaBox(x: number, y: number): void {
    const scene = this.ctx.scene;
    const pickup = scene.physics.add.sprite(x, y, 'gacha-box');
    pickup.setDepth(5);
    pickup.setScale(1.2);
    pickup.setData('pickupType', 'gachaBox');

    // Bobbing animation
    scene.tweens.add({
      targets: pickup,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.ctx.pickups.add(pickup);
  }

  // ── Dev: force-trigger any event by id ──────────────────────────────

  /** Returns the list of registered event ids + names for dev UI. */
  getEventList(): ReadonlyArray<{ id: string; name: string }> {
    return this.events.map(e => ({ id: e.id, name: e.name }));
  }

  /** Force-trigger an event by id, ignoring cooldowns/timers/chance. */
  forceEvent(eventId: string): void {
    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return;
    evt.lastFiredAt = this.lastGameTime;
    evt.execute(this.ctx, this.lastGameTime);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────

  destroy(): void {
    for (const zone of this.activeHealingZones) {
      zone.circle.destroy();
      zone.cross.destroy();
    }
    this.activeHealingZones.length = 0;

    if (this.activeEclipse) {
      this.activeEclipse.overlay.destroy();
      this.activeEclipse = null;
    }

    this.activeSwarm = null;
    this.events.length = 0;
  }
}

// ── Singleton ──────────────────────────────────────────────────────────
let instance: EventSystemImpl | null = null;

export function initEventSystem(ctx: GameContext): EventSystemImpl {
  instance = new EventSystemImpl();
  instance.init(ctx);
  return instance;
}

export function getEventSystem(): EventSystemImpl {
  return instance!;
}
