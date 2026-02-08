import Phaser from 'phaser';
import { GAME, STARTERS, SPAWN, XP_GEM, ENEMIES } from '../config';
import type { StarterConfig } from '../config';
import type { DevConfig, EnemyConfig } from '../types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { SoundManager } from '../audio/SoundManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import type { GameContext } from '../systems/GameContext';
import { WorldSystem } from '../systems/WorldSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { AttackFactory } from '../systems/AttackFactory';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { DebugSystem } from '../systems/DebugSystem';
import { PassiveSystem, getPassive } from '../systems/PassiveSystem';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemyGroup!: Phaser.Physics.Arcade.Group;
  xpGems!: Phaser.Physics.Arcade.Group;
  private destructibles!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;

  private isPaused = false;
  private gameTime = 0;
  private rerollLocked = false;
  private joystick: VirtualJoystick | null = null;
  private debugMode = false;
  private starterKey = 'charmander';
  private starterConfig!: StarterConfig;
  private devConfig?: DevConfig;

  private worldSystem!: WorldSystem;
  private pickupSystem!: PickupSystem;
  private spawnSystem!: SpawnSystem;
  private collisionSystem!: CollisionSystem;
  private attackFactory!: AttackFactory;
  private upgradeSystem!: UpgradeSystem;
  private debugSystem!: DebugSystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { debugMode?: boolean; starterKey?: string; devConfig?: DevConfig }): void {
    this.debugMode = data?.debugMode ?? false;
    this.devConfig = data?.devConfig;
    this.starterKey = this.devConfig?.starterKey ?? data?.starterKey ?? 'charmander';
  }

  create(): void {
    // ── Reset state ─────────────────────────────────────────────────
    this.isPaused = false;
    this.gameTime = 0;
    this.rerollLocked = false;
    this.joystick = null;

    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);

    // ── Starter config ──────────────────────────────────────────────
    this.starterConfig = STARTERS.find(s => s.key === this.starterKey) ?? STARTERS[0];

    // ── Player ──────────────────────────────────────────────────────
    this.player = new Player(this, GAME.worldWidth / 2, GAME.worldHeight / 2, this.starterConfig);

    // ── Joystick (touch devices) ────────────────────────────────────
    if (this.sys.game.device.input.touch) {
      this.joystick = new VirtualJoystick(this);
    }

    // ── Physics groups ──────────────────────────────────────────────
    this.enemyGroup = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.xpGems = this.physics.add.group({ defaultKey: 'xp-gem', maxSize: 1500 });
    this.destructibles = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({ defaultKey: 'atk-shadow-ball', maxSize: 60 });

    // ── GameContext ──────────────────────────────────────────────────
    const ctx: GameContext = {
      scene: this,
      player: this.player,
      enemyGroup: this.enemyGroup,
      xpGems: this.xpGems,
      destructibles: this.destructibles,
      pickups: this.pickups,
      enemyProjectiles: this.enemyProjectiles,
      starterConfig: this.starterConfig,
      debugMode: this.debugMode,
      devConfig: this.devConfig,
    };

    // ── Instantiate systems ─────────────────────────────────────────
    new PassiveSystem(this.starterKey); // self-registers as module singleton
    this.worldSystem = new WorldSystem(ctx);
    this.pickupSystem = new PickupSystem(ctx);
    this.spawnSystem = new SpawnSystem(ctx);
    this.collisionSystem = new CollisionSystem(ctx, this.pickupSystem);
    this.attackFactory = new AttackFactory(ctx, this.collisionSystem, this.pickupSystem);
    this.upgradeSystem = new UpgradeSystem(ctx, this.attackFactory, this.pickupSystem);
    this.debugSystem = new DebugSystem(ctx, this.attackFactory, this.upgradeSystem, this.spawnSystem, this.pickupSystem);

    // ── World generation ────────────────────────────────────────────
    this.worldSystem.generateWorld();

    // ── Dev Mode setup ──────────────────────────────────────────────
    if (this.devConfig) {
      this.applyDevConfig(this.devConfig);
    } else {
      // Normal initial attack
      const initialAttack = this.starterKey === 'squirtle' ? 'waterGun' : 'ember';
      this.attackFactory.createAttack(initialAttack);
    }

    // ── Camera ──────────────────────────────────────────────────────
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);

    // ── UIScene ─────────────────────────────────────────────────────
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    this.scene.launch('UIScene');

    // ── Spawn timers (normal mode only) ─────────────────────────────
    if (!this.debugMode && !this.devConfig) {
      this.spawnSystem.startSpawning();
      this.worldSystem.spawnDestructibles();
      this.time.addEvent({ delay: 60_000, loop: true, callback: () => this.worldSystem.spawnChest() });
    }

    // ── Collisions ──────────────────────────────────────────────────
    this.collisionSystem.setupBaseCollisions();

    // ── Event wiring ────────────────────────────────────────────────
    this.events.on('upgrade-selected', (upgradeId: string) => {
      this.upgradeSystem.applyUpgrade(upgradeId);
      this.upgradeSystem.resumeGame();
    });

    this.events.on('reroll-requested', () => {
      if (this.rerollLocked) return;
      const accepted = this.upgradeSystem.handleReroll(false);
      if (!accepted) return;
      this.rerollLocked = true;
      this.time.delayedCall(250, () => { this.rerollLocked = false; });
    });

    this.events.on('gacha-reward', (rewardType: string) => {
      this.upgradeSystem.applyGachaReward(rewardType);
      if (!this.isPaused) {
        this.upgradeSystem.resumeGame();
      }
    });

    this.events.on('cone-attack-kill', (x: number, y: number, xpValue: number) => {
      this.upgradeSystem.onConeAttackKill(x, y, xpValue);
    });

    this.events.on('request-level-up', () => {
      this.upgradeSystem.triggerLevelUp();
    });

    this.events.on('pause-game', () => {
      this.isPaused = true;
      this.physics.pause();
    });

    this.events.on('resume-game', () => {
      this.isPaused = false;
      this.physics.resume();
    });

    this.events.on('player-died', () => {
      this.gameOver();
    });

    this.events.on('stats-refresh', () => {
      this.emitStats();
    });

    this.events.on('pokeball-bomb', () => {
      this.enemyGroup.getChildren().forEach(child => {
        const enemy = child as Enemy;
        if (enemy.active) {
          const killed = enemy.takeDamage(999);
          if (killed) {
            this.player.stats.kills++;
            this.pickupSystem.spawnXpGem(enemy.x, enemy.y, enemy.xpValue);
          }
        }
      });
    });

    this.events.on('enemy-explosion', (data: { x: number; y: number; damage: number; radius: number }) => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, data.x, data.y);
      if (dist < data.radius) {
        this.player.takeDamage(data.damage, this.time.now);
        this.emitStats();
        if (this.player.isDead()) this.gameOver();
      }
    });

    // ── Passive on-kill effects (Blaze: fire AoE, Torrent: water splash) ──
    let passiveChainDepth = 0;
    this.events.on('passive-on-kill', (data: { type: string; x: number; y: number }) => {
      if (passiveChainDepth > 1) return;
      passiveChainDepth++;

      const ps = getPassive();
      if (!ps) { passiveChainDepth--; return; }

      if (data.type === 'blaze') {
        const radius = 50;
        const aoeDamage = 8;
        this.add.particles(data.x, data.y, 'fire-particle', {
          speed: { min: 40, max: 100 }, lifespan: 400, quantity: 8,
          scale: { start: 2, end: 0 }, emitting: false,
        }).explode();

        this.enemyGroup.getChildren().forEach(child => {
          const enemy = child as Enemy;
          if (!enemy.active) return;
          const d = Phaser.Math.Distance.Between(data.x, data.y, enemy.x, enemy.y);
          if (d < radius) {
            const killed = enemy.takeDamage(aoeDamage);
            if (killed) {
              this.player.stats.kills++;
              this.pickupSystem.spawnXpGem(enemy.x, enemy.y, enemy.xpValue);
            }
          }
        });
      } else if (data.type === 'torrent') {
        const radius = 60;
        this.add.particles(data.x, data.y, 'water-particle', {
          speed: { min: 30, max: 80 }, lifespan: 350, quantity: 6,
          scale: { start: 1.5, end: 0 }, tint: [0x3388ff, 0x44aaff],
          emitting: false,
        }).explode();

        const now = this.time.now;
        this.enemyGroup.getChildren().forEach(child => {
          const enemy = child as Enemy;
          if (!enemy.active) return;
          const d = Phaser.Math.Distance.Between(data.x, data.y, enemy.x, enemy.y);
          if (d < radius) {
            enemy.applyWet(ps.getWetSpeedMultiplier(), ps.getStatusDuration(), now);
          }
        });
      }

      passiveChainDepth--;
    });

    // ── Initial state ───────────────────────────────────────────────
    this.gameTime = 0;
    this.emitStats();

    // ── Debug mode: show scenario menu ──────────────────────────────
    if (this.debugMode && !this.devConfig) {
      this.isPaused = true;
      this.physics.pause();
      this.time.delayedCall(100, () => this.debugSystem.showMenu());
    }

    // ── Dev mode: spawn dummies + notify UIScene ──────────────────
    if (this.devConfig) {
      this.worldSystem.spawnDestructibles();
      // Spawn training dummies immediately + respawn loop
      this.spawnDevDummies();
      this.time.addEvent({
        delay: 3000,
        loop: true,
        callback: () => this.spawnDevDummies(),
      });
      // Notify UIScene to show dev panel (delayed to ensure UIScene is created)
      this.time.delayedCall(100, () => {
        this.events.emit('dev-mode-ready');
        this.emitStats();
      });
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    this.gameTime += delta;
    this.player.handleMovement(time, this.joystick?.direction);
    this.player.updateAttacks(time, delta);
    this.player.updatePoison(time, delta);
    if (this.player.isDead()) { this.gameOver(); return; }

    // Enemy movement + attacks
    this.spawnSystem.update(time);

    // XP magnetism (gems persist forever — disable body when far for perf)
    this.xpGems.getChildren().forEach(child => {
      const gem = child as Phaser.Physics.Arcade.Sprite;
      if (!gem.active) return;
      const body = gem.body as Phaser.Physics.Arcade.Body;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y);
      if (dist < this.player.stats.magnetRange) {
        if (!body.enable) body.enable = true;
        this.physics.moveToObject(gem, this.player, XP_GEM.magnetSpeed);
      } else if (dist < SPAWN.despawnDistance) {
        if (!body.enable) body.enable = true;
        if (body.velocity.lengthSq() > 0) body.setVelocity(0, 0);
      } else {
        if (body.enable) { body.setVelocity(0, 0); body.enable = false; }
      }
    });

    if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) this.emitStats();
  }

  private gameOver(): void {
    this.isPaused = true;
    this.physics.pause();
    SoundManager.playGameOver();
    this.events.emit('game-over', {
      level: this.player.stats.level,
      kills: this.player.stats.kills,
      time: Math.floor(this.gameTime / 1000),
    });
  }

  private applyDevConfig(config: DevConfig): void {
    const p = this.player;

    // Set form (force=true para pular validação de ordem)
    if (config.form !== 'base') {
      if (config.form === 'stage2') {
        p.evolve('stage1', true);
        p.evolve('stage2', true);
      } else {
        p.evolve(config.form, true);
      }
    }

    // Set level
    p.stats.level = config.level;
    p.stats.hp = p.stats.maxHp;

    // God mode
    p.godMode = config.godMode;

    // Initial attacks (se especificados)
    for (const atkType of config.attacks) {
      if (this.attackFactory.isRegistered(atkType) && !p.hasAttack(atkType)) {
        this.attackFactory.createAttack(atkType);
      }
    }

    // Se nenhum ataque especificado, dá o básico
    if (config.attacks.length === 0) {
      const initialAttack = this.starterKey === 'squirtle' ? 'waterGun' : 'ember';
      this.attackFactory.createAttack(initialAttack);
    }
  }

  // ── Dev mode: spawn training dummies ──────────────────────────
  private spawnDevDummies(): void {
    // Count active dummies
    const activeCount = this.enemyGroup.getChildren().filter(c => c.active).length;
    const desiredCount = 5;
    const toSpawn = desiredCount - activeCount;

    for (let i = 0; i < toSpawn; i++) {
      this.spawnSingleDummy();
    }
  }

  spawnSingleDummy(enemyKey = 'geodude'): void {
    const config = ENEMIES[enemyKey] as EnemyConfig | undefined;
    if (!config) return;

    // Spawn at random position around player (100-250px away)
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 150;
    const ex = this.player.x + Math.cos(angle) * dist;
    const ey = this.player.y + Math.sin(angle) * dist;

    const enemy = new Enemy(this, ex, ey, config);
    this.enemyGroup.add(enemy);
  }

  // Expose para o UIScene acessar via scene.get()
  getAttackFactory(): AttackFactory { return this.attackFactory; }
  getUpgradeSystem(): UpgradeSystem { return this.upgradeSystem; }
  getSpawnSystem(): SpawnSystem { return this.spawnSystem; }

  private emitStats(): void {
    this.events.emit('stats-update', {
      ...this.player.stats,
      time: Math.floor(this.gameTime / 1000),
      heldItems: this.player.getHeldItems(),
      attacks: this.player.getAllAttacks().map(a => ({ type: a.type, level: a.level })),
    });
  }
}
