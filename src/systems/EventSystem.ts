import Phaser from 'phaser';
import type { GameContext } from './GameContext';
import { ENEMIES, STAGES, GAME } from '../config';
import type { EnemyConfig } from '../types';
import { Enemy } from '../entities/Enemy';
import { getSpatialGrid } from './SpatialHashGrid';
import { SoundManager } from '../audio/SoundManager';
import { Destructible } from '../entities/Destructible';
import { Pickup } from '../entities/Pickup';
import { DESTRUCTIBLES } from '../config';
import { startWeather, stopWeather } from './WeatherOverlay';
import { getCompanionSystem } from './CompanionSystem';
import { shouldShowVfx } from './GraphicsSettings';

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
  readonly fx: Phaser.FX.ColorMatrix;
  readonly createdAt: number;
  readonly duration: number;
}

interface ActiveSwarm {
  readonly enemyConfig: EnemyConfig;
  spawned: number;
  readonly total: number;
  frameCounter: number;
}

interface ActiveThunderstorm {
  readonly createdAt: number;
  readonly duration: number;
  nextStrikeAt: number;
}

interface ActiveTide {
  readonly createdAt: number;
  readonly duration: number;
  fx?: Phaser.FX.ColorMatrix;
}

interface ActiveSafariZone {
  readonly createdAt: number;
  readonly duration: number;
  indicator?: Phaser.GameObjects.Arc;
}

// ── EventSystem ────────────────────────────────────────────────────────

class EventSystemImpl {
  private ctx!: GameContext;
  private readonly events: MapEvent[] = [];

  // ── Active effects ──
  private readonly activeHealingZones: ActiveHealingZone[] = [];
  private activeEclipse: ActiveEclipse | null = null;
  private activeSwarm: ActiveSwarm | null = null;
  private activeThunderstorm: ActiveThunderstorm | null = null;
  private activeTide: ActiveTide | null = null;
  private activeSafariZone: ActiveSafariZone | null = null;
  private currentWaveIndex = 0;
  private lastGameTime = 0;

  /** Returns true if any visual event is active (prevents overlap) */
  private isEventActive(): boolean {
    return this.activeEclipse != null || this.activeSwarm != null
      || this.activeThunderstorm != null || this.activeTide != null;
  }

  // ── Constants ──
  private static readonly HEAL_ZONE_RADIUS = 80;
  private static readonly HEAL_ZONE_TICK_MS = 500;
  private static readonly HEAL_ZONE_DURATION_MS = 15_000;
  private static readonly HEAL_ZONE_HP = 5;
  private static readonly ECLIPSE_DURATION_MS = 30_000;
  private static readonly SWARM_TOTAL = 40;
  private static readonly SWARM_PER_FRAME = 2;
  private static readonly SWARM_FRAMES = 20;

  // Phase 2 constants
  private static readonly SAFARI_ZONE_DURATION_MS = 30_000;
  private static readonly THUNDERSTORM_DURATION_MS = 25_000;
  private static readonly THUNDERSTORM_STRIKE_INTERVAL_MS = 2000;
  private static readonly THUNDERSTORM_STRIKE_RADIUS = 60;
  private static readonly THUNDERSTORM_STRIKE_DAMAGE = 15;
  private static readonly TIDE_DURATION_MS = 30_000;
  private static readonly TEAM_ROCKET_MEOWTH_COUNT = 3;
  private static readonly BERRY_GARDEN_COUNT = 8;

  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.events.length = 0;
    this.activeHealingZones.length = 0;
    this.activeEclipse = null;
    this.activeSwarm = null;
    this.activeThunderstorm = null;
    this.activeTide = null;
    this.activeSafariZone = null;
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

    // 2. Swarm — wave-triggered, 5% chance, min 2 min, cooldown 60s (shared, all stages)
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

    // 3. Treasure Room — wave-triggered, 5% chance, min 3 min, cooldown 120s (shared)
    this.events.push({
      id: 'treasureRoom',
      name: 'Treasure Room',
      trigger: 'wave',
      triggerTimeMs: 0,
      chance: 0.05,
      minTimeMs: 180_000,
      cooldownMs: 120_000,
      fired: false,
      lastFiredAt: -Infinity,
      execute: (ctx, gameTime) => this.executeTreasureRoom(ctx, gameTime),
    });

    // ── Phase 1 only events ──────────────────────────────────────────
    if (this.ctx.stageId !== 'phase2') {
      // 4. Professor Oak's Lab — timed, one-shot at 4 min
      this.events.push({
        id: 'professorOak',
        name: "Professor Oak's Lab",
        trigger: 'timed',
        triggerTimeMs: 240_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, _gameTime) => this.executeProfessorOak(ctx),
      });

      // 5. Eclipse — timed, one-shot at 6 min
      this.events.push({
        id: 'eclipse',
        name: 'Eclipse',
        trigger: 'timed',
        triggerTimeMs: 360_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeEclipse(ctx, gameTime),
      });

      // 6. Legendary Sighting — timed, one-shot at 8 min
      this.events.push({
        id: 'legendarySighting',
        name: 'Legendary Sighting',
        trigger: 'timed',
        triggerTimeMs: 480_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, _gameTime) => this.executeLegendarySighting(ctx),
      });
    }

    // ── Phase 2 only events ──────────────────────────────────────────
    if (this.ctx.stageId === 'phase2') {
      // 7. Safari Zone — timed, one-shot at 5 min
      this.events.push({
        id: 'safariZone',
        name: 'Safari Zone',
        trigger: 'timed',
        triggerTimeMs: 300_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeSafariZone(ctx, gameTime),
      });

      // 8. Tempestade — timed, one-shot at 7 min
      this.events.push({
        id: 'tempestade',
        name: 'Tempestade!',
        trigger: 'timed',
        triggerTimeMs: 420_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeThunderstorm(ctx, gameTime),
      });

      // 9. Team Rocket — wave-triggered, 6% chance, min 2 min, cooldown 90s
      this.events.push({
        id: 'teamRocket',
        name: 'Team Rocket',
        trigger: 'wave',
        triggerTimeMs: 0,
        chance: 0.06,
        minTimeMs: 120_000,
        cooldownMs: 90_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeTeamRocket(ctx, gameTime),
      });

      // 10. Day Care — timed, repeating every 4 min (offset from PokémonCenter)
      this.events.push({
        id: 'dayCare',
        name: 'Day Care',
        trigger: 'timed',
        triggerTimeMs: 240_000,
        repeat: 240_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeDayCare(ctx, gameTime),
      });

      // 11. Maré Alta — timed, one-shot at 10 min
      this.events.push({
        id: 'mareAlta',
        name: 'Maré Alta!',
        trigger: 'timed',
        triggerTimeMs: 600_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeHighTide(ctx, gameTime),
      });

      // 12. Berry Garden — wave-triggered, 5% chance, min 3 min, cooldown 120s
      this.events.push({
        id: 'berryGarden',
        name: 'Berry Garden',
        trigger: 'wave',
        triggerTimeMs: 0,
        chance: 0.05,
        minTimeMs: 180_000,
        cooldownMs: 120_000,
        fired: false,
        lastFiredAt: -Infinity,
        execute: (ctx, gameTime) => this.executeBerryGarden(ctx, gameTime),
      });
    }
  }

  // ── Update (chamado todo frame) ──────────────────────────────────────

  update(gameTime: number, _delta: number): void {
    this.lastGameTime = gameTime;

    // Check timed events (skip if another event is active)
    for (const evt of this.events) {
      if (evt.trigger !== 'timed') continue;

      if (evt.repeat != null) {
        // Repeating event
        if (gameTime >= evt.triggerTimeMs && gameTime - evt.lastFiredAt >= evt.repeat) {
          if (this.isEventActive() && evt.id !== 'pokemonCenter') continue;
          evt.lastFiredAt = gameTime;
          evt.execute(this.ctx, gameTime);
        }
      } else {
        // One-shot event — defer if another event is active
        if (!evt.fired && gameTime >= evt.triggerTimeMs) {
          if (this.isEventActive()) continue;
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

    // Update Phase 2 active effects
    this.updateThunderstorm(gameTime);
    this.updateHighTide(gameTime);
    this.updateSafariZone(gameTime);
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

    const stage = STAGES[this.ctx.stageId] ?? STAGES['phase1'];
    const waves = stage.waves;
    const wave = waves[Math.min(this.currentWaveIndex, waves.length - 1)];
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

    // Camera postFX ColorMatrix — darkens everything the camera renders
    const fx = cam.postFX.addColorMatrix();
    fx.brightness(1); // starts normal

    this.activeEclipse = {
      fx,
      createdAt: gameTime,
      duration: EventSystemImpl.ECLIPSE_DURATION_MS,
    };

    startWeather(scene, 'fog');
    scene.events.emit('event-banner', { name: 'Eclipse!', color: '#6644aa' });
  }

  private executeLegendarySighting(ctx: GameContext): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const spawnX = Phaser.Math.Clamp(
      player.x + Math.cos(angle) * 300,
      100, GAME.worldWidth - 100,
    );
    const spawnY = Phaser.Math.Clamp(
      player.y + Math.sin(angle) * 300,
      100, GAME.worldHeight - 100,
    );

    // Spawn special gacha box at Mew's initial position
    this.spawnGachaBox(spawnX, spawnY);

    // Sparkle ring de entrada
    const sparkle = scene.add.circle(spawnX, spawnY, 40, 0xff44ff, 0.2);
    sparkle.setDepth(1);
    scene.tweens.add({
      targets: sparkle, scaleX: 2, scaleY: 2, alpha: 0,
      duration: 1500, ease: 'Sine.easeOut',
      onComplete: () => sparkle.destroy(),
    });

    scene.events.emit('event-banner', { name: 'Legendary Sighting!', color: '#ff44ff' });

    // Mew com IA de fuga
    if (!scene.textures.exists('mew-walk')) return;

    const mew = scene.add.sprite(spawnX, spawnY, 'mew-walk');
    mew.setScale(1.2).setDepth(10);
    mew.play('mew-walk-down');

    const MEW_SPEED = 120;
    const MEW_DURATION = 15_000;
    const SPARKLE_INTERVAL = 800;
    let lastDir = '';
    let sparkleTimer = 0;

    // Loop de fuga: Mew corre para longe do jogador
    const fleeEvent = scene.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        if (!mew.active || !player.active) return;

        const dx = mew.x - player.x;
        const dy = mew.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Direção de fuga (oposta ao jogador)
        let fleeX: number, fleeY: number;
        if (dist < 10) {
          fleeX = Math.random() - 0.5;
          fleeY = Math.random() - 0.5;
        } else {
          fleeX = dx / dist;
          fleeY = dy / dist;
        }

        // Bounce nas bordas do mundo
        const margin = 80;
        if (mew.x < margin) fleeX = Math.abs(fleeX);
        if (mew.x > GAME.worldWidth - margin) fleeX = -Math.abs(fleeX);
        if (mew.y < margin) fleeY = Math.abs(fleeY);
        if (mew.y > GAME.worldHeight - margin) fleeY = -Math.abs(fleeY);

        // Mover
        const step = MEW_SPEED * 0.05;
        mew.x += fleeX * step;
        mew.y += fleeY * step;

        // Animação direcional
        const fleeAngle = Math.atan2(fleeY, fleeX);
        const dir = EventSystemImpl.angleToDir(fleeAngle);
        if (dir !== lastDir) {
          lastDir = dir;
          const animKey = `mew-walk-${dir}`;
          if (mew.anims.currentAnim?.key !== animKey) {
            mew.play(animKey);
          }
        }

        // Trail de sparkles rosa
        sparkleTimer += 50;
        if (sparkleTimer >= SPARKLE_INTERVAL) {
          sparkleTimer = 0;
          const trail = scene.add.circle(mew.x, mew.y + 10, 6, 0xff88ff, 0.6);
          trail.setDepth(5);
          scene.tweens.add({
            targets: trail, alpha: 0, scaleX: 0.3, scaleY: 0.3,
            duration: 600, onComplete: () => trail.destroy(),
          });
        }
      },
    });

    // Teleport de saída após duração
    scene.time.delayedCall(MEW_DURATION, () => {
      fleeEvent.destroy();
      if (!mew.active) return;

      // Flash de teleporte
      const flash = scene.add.circle(mew.x, mew.y, 30, 0xff44ff, 0.8);
      flash.setDepth(15);
      scene.tweens.add({
        targets: flash, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 500, onComplete: () => flash.destroy(),
      });
      mew.destroy();
    });
  }

  /** Converte ângulo em direção de walk animation (8 dirs) */
  private static angleToDir(angle: number): string {
    const deg = Phaser.Math.RadToDeg(angle);
    const norm = ((deg % 360) + 360) % 360;
    if (norm < 22.5 || norm >= 337.5) return 'right';
    if (norm < 67.5) return 'downRight';
    if (norm < 112.5) return 'down';
    if (norm < 157.5) return 'downLeft';
    if (norm < 202.5) return 'left';
    if (norm < 247.5) return 'upLeft';
    if (norm < 292.5) return 'up';
    return 'upRight';
  }

  private executeTreasureRoom(ctx: GameContext, _gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const chestCount = Phaser.Math.Between(2, 3);
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

  // ── Phase 2 Events ─────────────────────────────────────────────────

  private executeSafariZone(ctx: GameContext, gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    this.activeSafariZone = {
      createdAt: gameTime,
      duration: EventSystemImpl.SAFARI_ZONE_DURATION_MS,
    };

    // Spawn 6 rare Pokemon in a ring around the player, each worth 3x XP
    const rarePool = ['ponyta', 'vulpix', 'growlithe', 'staryu', 'pikachu', 'jigglypuff'] as const;
    const grid = getSpatialGrid();
    const count = 6;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
      const dist = Phaser.Math.Between(150, 250);
      const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 100, GAME.worldWidth - 100);
      const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 100, GAME.worldHeight - 100);

      const key = rarePool[i % rarePool.length];
      const config = ENEMIES[key];
      if (!config) continue;

      // Triple XP for Safari Zone catches
      const boostedConfig = { ...config, xpValue: config.xpValue * 3 };
      const enemy = new Enemy(scene, x, y, boostedConfig);
      ctx.enemyGroup.add(enemy);
      grid.insert(enemy);
    }

    // Visual indicator: green zone circle
    if (shouldShowVfx()) {
      const indicator = scene.add.circle(player.x, player.y, 260, 0x44cc44, 0.08);
      indicator.setDepth(1);
      scene.tweens.add({
        targets: indicator,
        scaleX: 1.1, scaleY: 1.1, alpha: 0,
        duration: EventSystemImpl.SAFARI_ZONE_DURATION_MS,
        ease: 'Sine.easeIn',
        onComplete: () => indicator.destroy(),
      });
      this.activeSafariZone!.indicator = indicator;
    }

    scene.events.emit('event-banner', { name: 'Safari Zone!', color: '#44cc44' });
  }

  private executeThunderstorm(ctx: GameContext, gameTime: number): void {
    if (this.activeThunderstorm) return;

    const scene = ctx.scene;
    SoundManager.playEventWarning();

    startWeather(scene, 'rain');

    this.activeThunderstorm = {
      createdAt: gameTime,
      duration: EventSystemImpl.THUNDERSTORM_DURATION_MS,
      nextStrikeAt: gameTime + 1000,
    };

    scene.events.emit('event-banner', { name: 'Tempestade!', color: '#ffff44' });
  }

  private executeTeamRocket(ctx: GameContext, _gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const meowthConfig = ENEMIES['meowth'];
    if (!meowthConfig) return;

    const grid = getSpatialGrid();

    for (let i = 0; i < EventSystemImpl.TEAM_ROCKET_MEOWTH_COUNT; i++) {
      const angle = (i / EventSystemImpl.TEAM_ROCKET_MEOWTH_COUNT) * Math.PI * 2;
      const dist = Phaser.Math.Between(200, 350);
      const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 100, GAME.worldWidth - 100);
      const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 100, GAME.worldHeight - 100);

      // Elite Meowth: 3× HP, 2× XP, purple tint (Team Rocket vibe)
      const boostedConfig = { ...meowthConfig, hp: meowthConfig.hp * 3, xpValue: meowthConfig.xpValue * 2 };
      const enemy = new Enemy(scene, x, y, boostedConfig);
      enemy.setTint(0x9944cc);

      ctx.enemyGroup.add(enemy);
      grid.insert(enemy);

      // Spawn coin bait near each Meowth (Pay Day!)
      const coinX = x + Phaser.Math.Between(-20, 20);
      const coinY = y + Phaser.Math.Between(-20, 20);
      const coin = new Pickup(scene, coinX, coinY, 'coinSmall', 'coin-small');
      coin.setScale(0.8).setDepth(4);
      coin.setData('coinValue', 5);
      coin.setData('isCoin', true);
      ctx.pickups.add(coin);
    }

    scene.events.emit('event-banner', { name: 'Team Rocket!', color: '#9944cc' });
  }

  private executeDayCare(ctx: GameContext, _gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    // Full heal
    player.heal(9999);

    // Green flash
    player.setTint(0x44ff44);
    scene.time.delayedCall(300, () => {
      if (player.active) player.clearTint();
    });

    // Buff companions: +50% damage for 30s
    const companionSystem = getCompanionSystem();
    if (companionSystem) {
      scene.events.emit('companion-buff', { damageMult: 1.5, durationMs: 30_000 });
    }

    scene.events.emit('event-banner', { name: 'Day Care!', color: '#ff88cc' });
  }

  private executeHighTide(ctx: GameContext, gameTime: number): void {
    if (this.activeTide) return;

    const scene = ctx.scene;
    SoundManager.playEventWarning();

    startWeather(scene, 'rain');

    this.activeTide = {
      createdAt: gameTime,
      duration: EventSystemImpl.TIDE_DURATION_MS,
    };

    // Tint camera slightly blue
    const cam = scene.cameras.main;
    const fx = cam.postFX.addColorMatrix();
    fx.brightness(0.85);

    // Store fx ref for cleanup
    this.activeTide.fx = fx;

    scene.events.emit('event-banner', { name: 'Mare Alta!', color: '#4488ff' });
  }

  private executeBerryGarden(ctx: GameContext, _gameTime: number): void {
    const scene = ctx.scene;
    const player = ctx.player;
    SoundManager.playEventWarning();

    const bushConfig = DESTRUCTIBLES.berryBush;
    const count = EventSystemImpl.BERRY_GARDEN_COUNT;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = Phaser.Math.Between(80, 180);
      const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 100, GAME.worldWidth - 100);
      const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 100, GAME.worldHeight - 100);

      const bush = new Destructible(scene, x, y, bushConfig);
      ctx.destructibles.add(bush);
    }

    scene.events.emit('event-banner', { name: 'Berry Garden!', color: '#88dd44' });
  }

  // ── Phase 2 Active Effect Updates ──────────────────────────────────

  private updateThunderstorm(gameTime: number): void {
    if (!this.activeThunderstorm) return;

    const storm = this.activeThunderstorm;
    const elapsed = gameTime - storm.createdAt;

    // Expired
    if (elapsed >= storm.duration) {
      this.activeThunderstorm = null;
      stopWeather();
      return;
    }

    // Lightning strike
    if (gameTime >= storm.nextStrikeAt) {
      storm.nextStrikeAt = gameTime + EventSystemImpl.THUNDERSTORM_STRIKE_INTERVAL_MS;
      this.spawnLightningStrike(gameTime);
    }
  }

  private spawnLightningStrike(gameTime: number): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;

    // Random position near player
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(50, 300);
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    // Visual: yellow circle flash
    if (shouldShowVfx()) {
      const flash = scene.add.circle(x, y, EventSystemImpl.THUNDERSTORM_STRIKE_RADIUS, 0xffff44, 0.6);
      flash.setDepth(10);
      scene.tweens.add({
        targets: flash,
        alpha: 0, scaleX: 1.5, scaleY: 1.5,
        duration: 400,
        ease: 'Sine.easeOut',
        onComplete: () => flash.destroy(),
      });
    }

    // Damage enemies in radius using SpatialHashGrid
    const grid = getSpatialGrid();
    const radius = EventSystemImpl.THUNDERSTORM_STRIKE_RADIUS;
    const nearby = grid.queryRadius(x, y, radius);
    for (const obj of nearby) {
      if (obj instanceof Enemy && obj.active) {
        obj.takeDamage(EventSystemImpl.THUNDERSTORM_STRIKE_DAMAGE);
      }
    }

    // Small chance to also stun player if too close
    const playerDist = Phaser.Math.Distance.Between(player.x, player.y, x, y);
    if (playerDist < radius * 0.5) {
      player.applyStun(500, gameTime);
    }
  }

  private updateHighTide(gameTime: number): void {
    if (!this.activeTide) return;

    const elapsed = gameTime - this.activeTide.createdAt;

    if (elapsed >= this.activeTide.duration) {
      // Cleanup
      if (this.activeTide.fx) this.activeTide.fx.reset();
      this.activeTide = null;
      stopWeather();
      return;
    }
  }

  private updateSafariZone(gameTime: number): void {
    if (!this.activeSafariZone) return;

    const elapsed = gameTime - this.activeSafariZone.createdAt;
    if (elapsed >= this.activeSafariZone.duration) {
      if (this.activeSafariZone.indicator) {
        this.ctx.scene.tweens.killTweensOf(this.activeSafariZone.indicator);
        this.activeSafariZone.indicator.destroy();
      }
      this.activeSafariZone = null;
    }
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

    const eclipse = this.activeEclipse;
    const elapsed = gameTime - eclipse.createdAt;

    const FADE_IN_MS = 2000;
    const FADE_OUT_MS = 2000;
    const MIN_BRIGHTNESS = 0.35; // 0=black, 1=normal

    if (elapsed >= eclipse.duration + FADE_OUT_MS) {
      // Done — reset to normal and clear
      eclipse.fx.reset();
      this.activeEclipse = null;
      stopWeather();
      return;
    }

    // Calculate brightness: 1.0 (normal) → MIN_BRIGHTNESS (dark) → 1.0 (normal)
    let brightness = 1;
    if (elapsed >= eclipse.duration) {
      const fadeProgress = (elapsed - eclipse.duration) / FADE_OUT_MS;
      brightness = MIN_BRIGHTNESS + (1 - MIN_BRIGHTNESS) * fadeProgress;
    } else if (elapsed < FADE_IN_MS) {
      brightness = 1 - (1 - MIN_BRIGHTNESS) * (elapsed / FADE_IN_MS);
    } else {
      brightness = MIN_BRIGHTNESS;
    }

    // CRITICAL: reset() before brightness() — brightness() MULTIPLIES the matrix,
    // so without reset it compounds each frame (0.99^60 ≈ 0.54 per second)
    eclipse.fx.reset();
    eclipse.fx.brightness(Phaser.Math.Clamp(brightness, 0, 1));
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
    const pickup = new Pickup(this.ctx.scene, x, y, 'gachaBox', 'gacha-box');
    pickup.setDepth(5).setScale(1.2);
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
    const scene = this.ctx.scene;

    for (const zone of this.activeHealingZones) {
      scene.tweens.killTweensOf([zone.circle, zone.cross]);
      zone.circle.destroy();
      zone.cross.destroy();
    }
    this.activeHealingZones.length = 0;

    if (this.activeEclipse) {
      this.activeEclipse.fx.reset();
      this.activeEclipse = null;
      stopWeather();
    }

    this.activeSwarm = null;

    if (this.activeThunderstorm) {
      this.activeThunderstorm = null;
      stopWeather();
    }

    if (this.activeTide) {
      if (this.activeTide.fx) this.activeTide.fx.reset();
      this.activeTide = null;
      stopWeather();
    }

    if (this.activeSafariZone) {
      if (this.activeSafariZone.indicator) {
        scene.tweens.killTweensOf(this.activeSafariZone.indicator);
        this.activeSafariZone.indicator.destroy();
      }
      this.activeSafariZone = null;
    }

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
