import Phaser from "phaser"
import { GAME, STARTERS, SPAWN, XP_GEM, ENEMIES, DIFFICULTY } from "../config"
import type { StarterConfig } from "../config"
import type { DevConfig, Difficulty, EnemyConfig } from "../types"
import { Player } from "../entities/Player"
import { Enemy } from "../entities/Enemy"
import { SoundManager } from "../audio/SoundManager"
import { VirtualJoystick } from "../ui/VirtualJoystick"
import type { GameContext } from "../systems/GameContext"
import { WorldSystem } from "../systems/WorldSystem"
import { PickupSystem } from "../systems/PickupSystem"
import { SpawnSystem } from "../systems/SpawnSystem"
import { CollisionSystem } from "../systems/CollisionSystem"
import { AttackFactory } from "../systems/AttackFactory"
import { UpgradeSystem } from "../systems/UpgradeSystem"
import { DebugSystem } from "../systems/DebugSystem"
import { PassiveSystem, getPassive } from "../systems/PassiveSystem"
import { initSpatialGrid, getSpatialGrid } from "../systems/SpatialHashGrid"
import { clearSpores, clearDeathClouds } from "../systems/EnemyBehaviors"
import {
  resetDamageTotals,
  getDamageTotals,
  setDamageBuff,
  setRunRecordDamage,
} from "../systems/DamageTracker"
import { safeExplode } from "../utils/particles"
import { initStatsTracker, getStatsTracker } from "../systems/RunRecorder"
import { initComboSystem, getComboSystem } from "../systems/ComboSystem"
import { initEventSystem, getEventSystem } from "../systems/EventSystem"
import { /* initMegaSystem, */ getMegaSystem } from "../systems/MegaSystem"
import { initMusicManager, getMusicManager } from "../audio/MusicManager"
import { initCompanionSystem, getCompanionSystem } from "../systems/CompanionSystem"
import {
  initSaveSystem,
  addCoins,
  updateRecord,
  accumulateRunStats,
  saveLastRun,
  getPowerUpLevel,
} from "../systems/SaveSystem"
import { Boss } from "../entities/Boss"

export class GameScene extends Phaser.Scene {
  player!: Player
  enemyGroup!: Phaser.Physics.Arcade.Group
  xpGems!: Phaser.Physics.Arcade.Group
  private destructibles!: Phaser.Physics.Arcade.StaticGroup
  private pickups!: Phaser.Physics.Arcade.Group
  private enemyProjectiles!: Phaser.Physics.Arcade.Group

  private isPaused = false
  private statsDirty = false
  private gameTime = 0
  private rerollLocked = false
  private joystick: VirtualJoystick | null = null
  private debugMode = false
  private runSaved = false
  private onBeforeUnload: (() => void) | null = null
  private starterKey = "charmander"
  private difficulty: Difficulty = "hard"
  private tileThemeId = "emerald"
  private mapId: string | null = null
  private starterConfig!: StarterConfig
  private devConfig?: DevConfig

  private worldSystem!: WorldSystem
  private pickupSystem!: PickupSystem
  private spawnSystem!: SpawnSystem
  private collisionSystem!: CollisionSystem
  private attackFactory!: AttackFactory
  private upgradeSystem!: UpgradeSystem
  private debugSystem!: DebugSystem

  constructor() {
    super({ key: "GameScene" })
  }

  init(data?: {
    debugMode?: boolean
    starterKey?: string
    devConfig?: DevConfig
    difficulty?: Difficulty
    tileThemeId?: string
    mapId?: string | null
  }): void {
    this.debugMode = data?.debugMode ?? false
    this.devConfig = data?.devConfig
    this.difficulty = data?.difficulty ?? "hard"
    this.tileThemeId = data?.tileThemeId ?? "emerald"
    this.mapId = data?.mapId ?? null
    this.starterKey =
      this.devConfig?.starterKey ?? data?.starterKey ?? "charmander"
  }

  create(): void {
    // ── Reset state ─────────────────────────────────────────────────
    this.isPaused = false
    this.gameTime = 0
    this.rerollLocked = false
    this.joystick = null
    resetDamageTotals()

    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight)

    // ── Starter config ──────────────────────────────────────────────
    this.starterConfig =
      STARTERS.find((s) => s.key === this.starterKey) ?? STARTERS[0]

    // ── Player ──────────────────────────────────────────────────────
    this.player = new Player(
      this,
      GAME.worldWidth / 2,
      GAME.worldHeight / 2,
      this.starterConfig,
    )

    // ── Difficulty XP multiplier ──────────────────────────────────
    this.player.stats.xpMultiplier = DIFFICULTY[this.difficulty].xpMultiplier

    // ── Meta-progression bonuses ────────────────────────────────────
    this.player.stats.maxHp += getPowerUpLevel("maxHp") * 5
    this.player.stats.hp = this.player.stats.maxHp
    this.player.stats.hpRegen += getPowerUpLevel("hpRegen") * 0.5
    this.player.stats.speed *= 1 + getPowerUpLevel("speed") * 0.05
    this.player.stats.baseSpeed = this.player.stats.speed
    this.player.stats.xpMultiplier *= 1 + getPowerUpLevel("xpGain") * 0.1
    this.player.stats.magnetRange += getPowerUpLevel("magnetRange") * 5
    this.player.stats.revives += getPowerUpLevel("revival")
    this.player.stats.rerolls += getPowerUpLevel("reroll")

    // ── Berry damage buff bridge (Liechi Berry → Enemy.takeDamage) ──
    setDamageBuff(() => this.player.getBuff("damage", this.time.now))

    // ── Joystick (touch devices) ────────────────────────────────────
    if (this.sys.game.device.input.touch) {
      this.joystick = new VirtualJoystick(this)
    }

    // ── Physics groups ──────────────────────────────────────────────
    this.enemyGroup = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: false,
    })
    this.xpGems = this.physics.add.group({ defaultKey: "xp-gem", maxSize: 500 })
    this.destructibles = this.physics.add.staticGroup()
    this.pickups = this.physics.add.group()
    this.enemyProjectiles = this.physics.add.group({
      defaultKey: "atk-shadow-ball",
      maxSize: 60,
    })

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
      difficulty: this.difficulty,
      tileThemeId: this.tileThemeId,
      mapId: this.mapId,
    }

    // ── Persistent systems ───────────────────────────────────────────
    initSaveSystem()
    initStatsTracker()
    setRunRecordDamage((attackKey, amount) => getStatsTracker().recordDamage(attackKey, amount))
    initComboSystem()

    // ── Spatial hash grid (deve ser antes dos systems) ──────────────
    initSpatialGrid(128)

    // ── Phase 3: Event System ──────────────────────────────────────
    initEventSystem(ctx)

    // ── Phase 3: Mega System (desativado — reativar quando sprites completas)
    // initMegaSystem(ctx)

    // ── Phase 3: Music Manager ─────────────────────────────────────
    const music = initMusicManager()
    music.start()

    // ── Phase 4: Companion System ──────────────────────────────────
    initCompanionSystem(ctx)

    // ── Instantiate systems ─────────────────────────────────────────
    new PassiveSystem(this.starterKey) // self-registers as module singleton
    this.worldSystem = new WorldSystem(ctx)
    this.pickupSystem = new PickupSystem(ctx)
    this.spawnSystem = new SpawnSystem(ctx)
    this.collisionSystem = new CollisionSystem(ctx, this.pickupSystem)
    this.attackFactory = new AttackFactory(
      ctx,
      this.collisionSystem,
      this.pickupSystem,
    )
    this.upgradeSystem = new UpgradeSystem(
      ctx,
      this.attackFactory,
      this.pickupSystem,
    )
    this.debugSystem = new DebugSystem(
      ctx,
      this.attackFactory,
      this.upgradeSystem,
      this.spawnSystem,
      this.pickupSystem,
    )

    // ── World generation ────────────────────────────────────────────
    this.worldSystem.generateWorld()

    // ── Dev Mode setup ──────────────────────────────────────────────
    if (this.devConfig) {
      this.applyDevConfig(this.devConfig)
    } else {
      // Normal initial attack
      const initialAttack =
        this.starterKey === "squirtle"
          ? "waterGun"
          : this.starterKey === "bulbasaur"
            ? "vineWhip"
            : "ember"
      this.attackFactory.createAttack(initialAttack)
    }

    // ── Camera ──────────────────────────────────────────────────────
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight)

    // Zoom adaptativo: telas menores veem mais do mapa
    const applyZoom = (): void => {
      const baseWidth = 800
      const zoom = Math.max(0.6, Math.min(1, this.scale.width / baseWidth))
      this.cameras.main.setZoom(zoom)
    }
    applyZoom()
    this.scale.on("resize", applyZoom)

    // ── UIScene ─────────────────────────────────────────────────────
    if (this.scene.isActive("UIScene")) this.scene.stop("UIScene")
    this.scene.launch("UIScene")

    // ── Spawn timers (normal mode only) ─────────────────────────────
    if (!this.debugMode && !this.devConfig) {
      this.spawnSystem.startSpawning()
      this.worldSystem.spawnDestructibles()
      this.time.addEvent({
        delay: 90_000,
        loop: true,
        callback: () => this.worldSystem.spawnChest(),
      })
      // Magnet Burst floor spawn (como vacuum do VS) — a cada 150s, perto do player
      this.time.addEvent({
        delay: 150_000,
        loop: true,
        callback: () => {
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const dist = Phaser.Math.Between(200, 350);
          const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 100, GAME.worldWidth - 100);
          const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 100, GAME.worldHeight - 100);
          this.pickupSystem.spawnPickup(x, y, 'magnetBurst');
        },
      })
    }

    // ── Collisions ──────────────────────────────────────────────────
    this.collisionSystem.setupBaseCollisions()

    // ── Event wiring ────────────────────────────────────────────────
    this.events.on("upgrade-selected", (upgradeId: string) => {
      this.upgradeSystem.applyUpgrade(upgradeId)
      this.upgradeSystem.resumeGame()
    })

    this.events.on("reroll-requested", () => {
      if (this.rerollLocked) return
      const accepted = this.upgradeSystem.handleReroll(false)
      if (!accepted) return
      this.rerollLocked = true
      setTimeout(() => {
        this.rerollLocked = false
      }, 250)
    })

    this.events.on("gacha-reward", (rewardType: string) => {
      const triggeredLevelUp = this.upgradeSystem.applyGachaReward(rewardType)
      if (!triggeredLevelUp) {
        this.upgradeSystem.resumeGame()
      }
    })

    this.events.on(
      "cone-attack-kill",
      (x: number, y: number, xpValue: number, enemyKey?: string) => {
        this.upgradeSystem.onConeAttackKill(x, y, xpValue)
        getStatsTracker().recordKill(enemyKey ?? "unknown", xpValue)
        getComboSystem().recordKill()
      },
    )

    this.events.on("request-level-up", () => {
      this.upgradeSystem.triggerLevelUp()
    })

    this.events.on("pause-game", () => {
      this.isPaused = true
      this.physics.pause()
      this.time.paused = true
    })

    this.events.on("resume-game", () => {
      this.isPaused = false
      this.physics.resume()
      this.time.paused = false
    })

    this.events.on("player-died", () => {
      if (!this.tryRevive()) this.gameOver()
    })

    this.events.on("stats-refresh", () => {
      this.statsDirty = true
    })

    this.events.on("pokeball-bomb", () => {
      for (const enemy of getSpatialGrid().getActiveEnemies()) {
        const killed = enemy.takeDamage(400)
        if (killed) {
          this.player.stats.kills++
          this.pickupSystem.spawnXpGem(enemy.x, enemy.y, enemy.xpValue)
          getStatsTracker().recordKill(enemy.enemyKey, enemy.xpValue)
          getComboSystem().recordKill()
        }
      }
    })

    this.events.on(
      "enemy-explosion",
      (data: { x: number; y: number; damage: number; radius: number }) => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          data.x,
          data.y,
        )
        if (dist < data.radius) {
          this.player.takeDamage(data.damage, this.time.now)
          this.emitStats()
          if (this.player.isDead() && !this.tryRevive()) this.gameOver()
        }
      },
    )

    // ── Passive on-kill effects (Blaze: fire AoE, Torrent: water splash) ──
    let passiveChainDepth = 0
    this.events.on(
      "passive-on-kill",
      (data: { type: string; x: number; y: number }) => {
        if (passiveChainDepth > 1) return
        passiveChainDepth++

        const ps = getPassive()
        if (!ps) {
          passiveChainDepth--
          return
        }

        if (data.type === "blaze") {
          const radius = 50
          const aoeDamage = 8
          safeExplode(this, data.x, data.y, "fire-particle", {
            speed: { min: 40, max: 100 },
            lifespan: 400,
            quantity: 8,
            scale: { start: 2, end: 0 },
          })

          for (const enemy of getSpatialGrid().queryRadius(
            data.x,
            data.y,
            radius,
          )) {
            const killed = enemy.takeDamage(aoeDamage)
            if (killed) {
              this.player.stats.kills++
              this.pickupSystem.spawnXpGem(enemy.x, enemy.y, enemy.xpValue)
              getStatsTracker().recordKill(enemy.enemyKey, enemy.xpValue)
              getComboSystem().recordKill()
            }
          }
        } else if (data.type === "torrent") {
          const radius = 60
          safeExplode(this, data.x, data.y, "water-particle", {
            speed: { min: 30, max: 80 },
            lifespan: 350,
            quantity: 6,
            scale: { start: 1.5, end: 0 },
            tint: [0x3388ff, 0x44aaff],
          })

          const now = this.time.now
          for (const enemy of getSpatialGrid().queryRadius(
            data.x,
            data.y,
            radius,
          )) {
            enemy.applyWet(
              ps.getWetSpeedMultiplier(),
              ps.getStatusDuration(),
              now,
            )
          }
        } else if (data.type === "overgrow") {
          const radius = 55
          safeExplode(this, data.x, data.y, "poison-particle", {
            speed: { min: 30, max: 70 },
            lifespan: 400,
            quantity: 8,
            scale: { start: 1.5, end: 0 },
            tint: [0x9944cc, 0x22cc44],
          })

          const now = this.time.now
          for (const enemy of getSpatialGrid().queryRadius(
            data.x,
            data.y,
            radius,
          )) {
            enemy.applyPoison(ps.getPoisonDps(), ps.getStatusDuration(), now)
          }
        }

        passiveChainDepth--
      },
    )

    // ── Mega activation — Space bar (desktop) or double-tap (mobile) ──
    this.input.keyboard?.on("keydown-SPACE", () => {
      getMegaSystem()?.activate(this.gameTime)
    })

    // ── EventSystem wave change hook ──────────────────────────────────
    this.events.on("wave-changed", (waveIndex: number) => {
      getEventSystem().onWaveChanged(waveIndex, this.gameTime)
    })

    // ── Friend Ball collected → show companion selection ──────────────
    this.events.on("friend-ball-collected", () => {
      const choices = getCompanionSystem()?.getAvailableChoices() ?? []
      this.scene.get("UIScene").events.emit("show-companion-select", choices)
    })

    // ── Companion selected from UI ────────────────────────────────────
    this.scene.get("UIScene").events.on("companion-selected", (key: string) => {
      getCompanionSystem()?.addCompanion(key)
    })

    // ── Heal events (Leech Seed, Giga Drain) ─────────────────────────
    this.events.on("leech-seed-heal", (amount: number) => {
      this.player.stats.hp = Math.min(
        this.player.stats.hp + amount,
        this.player.stats.maxHp,
      )
    })
    this.events.on("player-heal", (amount: number) => {
      this.player.stats.hp = Math.min(
        this.player.stats.hp + amount,
        this.player.stats.maxHp,
      )
    })

    // ── F5 save guard — salva coins ao recarregar a página ─────────
    this.runSaved = false
    this.onBeforeUnload = (): void => {
      if (this.runSaved) return
      this.runSaved = true
      const collectedCoins = this.pickupSystem.getRunCoins()
      if (collectedCoins > 0) addCoins(collectedCoins)
    }
    window.addEventListener("beforeunload", this.onBeforeUnload)
    this.events.once("shutdown", () => {
      if (this.onBeforeUnload) {
        window.removeEventListener("beforeunload", this.onBeforeUnload)
        this.onBeforeUnload = null
      }
    })

    // ── Phase-complete: todos os bosses derrotados ────────────────
    this.events.on("phase-complete", () => {
      this.isPaused = true
      this.physics.pause()
      this.time.paused = true

      const tracker = getStatsTracker()
      tracker.setLevel(this.player.stats.level)
      tracker.setForm(this.player.stats.form)
      tracker.setAttacks(
        this.player
          .getAllAttacks()
          .map((a) => ({ type: a.type, level: a.level })),
      )
      tracker.setItems(this.player.getHeldItems())

      const runStats = tracker.getRunStats()
      const timeSeconds = Math.floor(this.gameTime / 1000)
      const collectedCoins = this.pickupSystem.getRunCoins()
      const bonusCoins = Math.floor(
        timeSeconds * 0.5 + runStats.levelReached * 5,
      )
      const diffConfig = DIFFICULTY[this.difficulty]
      const coinsEarned = Math.floor(
        (collectedCoins + bonusCoins) * diffConfig.coinMultiplier,
      )

      // Salvar coins imediatamente (stats serão salvos no game over ou menu)
      addCoins(coinsEarned)
      this.pickupSystem.resetRunCoins()

      const bestCombo = getComboSystem().getBestCombo()
      const formName =
        (this.starterConfig.forms ?? []).find(
          (f) => f.form === this.player.stats.form,
        )?.name ?? this.starterConfig.name

      this.scene.get("UIScene").events.emit("show-victory", {
        level: this.player.stats.level,
        kills: this.player.stats.kills,
        time: timeSeconds,
        runStats,
        coinsEarned,
        bestCombo,
        starterKey: this.starterKey,
        formName,
      })
    })

    // ── Victory quit: jogador sai pelo menu principal após vitória ──
    this.scene.get("UIScene").events.on("victory-quit", () => {
      // Salvar stats finais antes de sair
      const tracker = getStatsTracker()
      const runStats = tracker.getRunStats()
      const timeSeconds = Math.floor(this.gameTime / 1000)
      accumulateRunStats({
        kills: runStats.totalKills,
        bossesDefeated: runStats.bossesDefeated.length,
        damageDealt: runStats.totalDamageDealt,
        coinsEarned: 0,
        timePlayed: timeSeconds,
        distance: runStats.distanceTraveled,
        berries: runStats.berriesCollected,
        xp: runStats.xpCollected,
        combo: getComboSystem().getBestCombo(),
        starterKey: this.starterKey,
        formName:
          (this.starterConfig.forms ?? []).find(
            (f) => f.form === this.player.stats.form,
          )?.name ?? this.starterConfig.name,
        damageByAttack: runStats.damageByAttack,
      })
      const formName =
        (this.starterConfig.forms ?? []).find(
          (f) => f.form === this.player.stats.form,
        )?.name ?? this.starterConfig.name
      saveLastRun({
        starterKey: this.starterKey,
        formName,
        level: runStats.levelReached,
        kills: runStats.totalKills,
        time: timeSeconds,
        coinsEarned: 0,
        difficulty: this.difficulty,
        date: Date.now(),
      })
      getMusicManager()?.fadeOut(1000)
      getEventSystem().destroy()
      clearSpores()
      clearDeathClouds()
    })

    // ── Initial state ───────────────────────────────────────────────
    this.gameTime = 0
    this.emitStats()

    // ── Debug mode: show scenario menu ──────────────────────────────
    if (this.debugMode && !this.devConfig) {
      this.isPaused = true
      this.physics.pause()
      this.time.delayedCall(100, () => this.debugSystem.showMenu())
    }

    // ── Dev mode: spawn dummies + notify UIScene ──────────────────
    if (this.devConfig) {
      this.worldSystem.spawnDestructibles()
      // Spawn training dummies immediately + respawn loop
      this.spawnDevDummies()
      this.time.addEvent({
        delay: 3000,
        loop: true,
        callback: () => this.spawnDevDummies(),
      })
      // Notify UIScene to show dev panel (delayed to ensure UIScene is created)
      this.time.delayedCall(100, () => {
        this.events.emit("dev-mode-ready")
        this.emitStats()
      })
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return

    this.gameTime += delta
    getStatsTracker().addTime(delta)
    getComboSystem().update(delta)

    this.player.handleMovement(time, this.joystick?.direction)
    this.player.updateAttacks(time, delta)
    this.player.updatePoison(time, delta)

    // HP regen (Leftovers)
    if (
      this.player.stats.hpRegen > 0 &&
      this.player.stats.hp < this.player.stats.maxHp
    ) {
      this.player.stats.hp = Math.min(
        this.player.stats.maxHp,
        this.player.stats.hp + this.player.stats.hpRegen * (delta / 1000),
      )
    }

    if (this.player.isDead()) {
      if (!this.tryRevive()) {
        this.gameOver()
        return
      }
    }

    // Enemy movement + attacks
    this.spawnSystem.update(time, delta)

    // Phase 3: Event System
    getEventSystem().update(this.gameTime, delta)

    // Phase 3: Mega System
    getMegaSystem()?.update(this.gameTime, delta)

    // Phase 3: Music Manager
    getMusicManager()?.update(
      getSpatialGrid().getActiveCount(),
      this.isBossAlive(),
    )

    // Phase 4: Companion System
    getCompanionSystem()?.update(time, delta)

    // XP magnetism (gems persist forever — disable body when far for perf)
    const gemChildren = this.xpGems.getChildren()
    const px = this.player.x
    const py = this.player.y
    const magRange = this.player.stats.magnetRange
    for (let gi = 0, glen = gemChildren.length; gi < glen; gi++) {
      const gem = gemChildren[gi] as Phaser.Physics.Arcade.Sprite
      if (!gem.active) continue
      const body = gem.body as Phaser.Physics.Arcade.Body
      const dx = px - gem.x
      const dy = py - gem.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < magRange) {
        if (!body.enable) body.enable = true
        this.physics.moveToObject(gem, this.player, XP_GEM.magnetSpeed)
      } else if (dist < SPAWN.despawnDistance) {
        if (!body.enable) body.enable = true
        if (body.velocity.lengthSq() > 0) body.setVelocity(0, 0)
      } else {
        if (body.enable) {
          body.setVelocity(0, 0)
          body.enable = false
        }
      }
    }

    // Torrent aura: destroy enemy projectiles within radius
    const ps = getPassive()
    const auraRadius = ps?.getAuraRadius() ?? 0
    if (auraRadius > 0) {
      this.enemyProjectiles.getChildren().forEach((child) => {
        const proj = child as Phaser.Physics.Arcade.Sprite
        if (!proj.active) return
        const d = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          proj.x,
          proj.y,
        )
        if (d < auraRadius) {
          this.enemyProjectiles.killAndHide(proj)
          ;(proj.body as Phaser.Physics.Arcade.Body).enable = false
          this.pickupSystem.playHitEffect(proj.x, proj.y, "water")
        }
      })
    }

    if (
      this.statsDirty ||
      Math.floor(time / 500) !== Math.floor((time - delta) / 500)
    ) {
      this.statsDirty = false
      this.emitStats()
    }
  }

  private gameOver(): void {
    this.isPaused = true
    this.physics.pause()
    SoundManager.playGameOver()

    // Remove F5 save handler (coins serão salvos abaixo)
    if (this.onBeforeUnload) {
      window.removeEventListener("beforeunload", this.onBeforeUnload)
      this.onBeforeUnload = null
    }

    // ── Finalize run stats ─────────────────────────────────────────
    const tracker = getStatsTracker()
    tracker.setLevel(this.player.stats.level)
    tracker.setForm(this.player.stats.form)
    tracker.setAttacks(
      this.player
        .getAllAttacks()
        .map((a) => ({ type: a.type, level: a.level })),
    )
    tracker.setItems(this.player.getHeldItems())

    const runStats = tracker.getRunStats()
    const timeSeconds = Math.floor(this.gameTime / 1000)

    // ── PokéDollars = (collected coins + bonus) × difficulty multiplier
    const collectedCoins = this.pickupSystem.getRunCoins()
    const bonusCoins = Math.floor(timeSeconds * 0.5 + runStats.levelReached * 5)
    const diffConfig = DIFFICULTY[this.difficulty]
    const coinsEarned = Math.floor((collectedCoins + bonusCoins) * diffConfig.coinMultiplier)

    // ── Save to persistent storage ─────────────────────────────────
    addCoins(coinsEarned)
    accumulateRunStats({
      kills: runStats.totalKills,
      bossesDefeated: runStats.bossesDefeated.length,
      damageDealt: runStats.totalDamageDealt,
      coinsEarned,
      timePlayed: timeSeconds,
      distance: runStats.distanceTraveled,
      berries: runStats.berriesCollected,
      xp: runStats.xpCollected,
      combo: getComboSystem().getBestCombo(),
      starterKey: this.starterKey,
      formName: (this.starterConfig.forms ?? []).find((f) => f.form === this.player.stats.form)
        ?.name ?? this.starterConfig.name,
      damageByAttack: runStats.damageByAttack,
    })
    const formName = (this.starterConfig.forms ?? []).find((f) => f.form === this.player.stats.form)
      ?.name ?? this.starterConfig.name
    saveLastRun({
      starterKey: this.starterKey,
      formName,
      level: runStats.levelReached,
      kills: runStats.totalKills,
      time: timeSeconds,
      coinsEarned,
      difficulty: this.difficulty,
      date: Date.now(),
    })
    const newRecords = {
      time: updateRecord("bestTime", timeSeconds),
      kills: updateRecord("bestKills", runStats.totalKills),
      level: updateRecord("bestLevel", runStats.levelReached),
    }

    // ── Combo stats ────────────────────────────────────────────────
    const bestCombo = getComboSystem().getBestCombo()

    // ── Phase 3 cleanup ────────────────────────────────────────────
    getMusicManager()?.fadeOut(2000)
    getEventSystem().destroy()
    clearSpores()
    clearDeathClouds()

    this.events.emit("game-over", {
      level: this.player.stats.level,
      kills: this.player.stats.kills,
      time: timeSeconds,
      runStats,
      coinsEarned,
      newRecords,
      bestCombo,
      starterKey: this.starterKey,
      formName,
    })
  }

  private tryRevive(): boolean {
    if (this.player.stats.revives <= 0) return false
    this.player.stats.revives--
    const restoreRatio = this.player.stats.reviveIsMax ? 1 : 0.5
    this.player.stats.hp = Math.floor(this.player.stats.maxHp * restoreRatio)
    this.player.setAlpha(1)

    // Brief invincibility (3s)
    this.player.setInvincible(this.time.now + 3000)

    // Flash visual
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 200,
      repeat: 7,
      yoyo: true,
      onComplete: () => {
        this.player.setAlpha(1)
      },
    })

    // Shockwave — empurra inimigos
    const px = this.player.x
    const py = this.player.y
    for (const enemy of getSpatialGrid().queryRadius(px, py, 150)) {
      const angle = Math.atan2(enemy.y - py, enemy.x - px)
      enemy.setPosition(
        enemy.x + Math.cos(angle) * 80,
        enemy.y + Math.sin(angle) * 80,
      )
    }

    // Particles
    safeExplode(this, px, py, "fire-particle", {
      speed: { min: 50, max: 120 },
      lifespan: 500,
      quantity: 16,
      scale: { start: 2, end: 0 },
      tint: [0xffdd44, 0xffaa00, 0xffffff],
    })

    // Notification
    this.events.emit("revive-used", this.player.stats.revives)
    this.emitStats()
    return true
  }

  private applyDevConfig(config: DevConfig): void {
    const p = this.player

    // Set form (force=true para pular validação de ordem)
    if (config.form !== "base") {
      if (config.form === "stage2") {
        p.evolve("stage1", true)
        p.evolve("stage2", true)
      } else {
        p.evolve(config.form, true)
      }
    }

    // Set level
    p.stats.level = config.level
    p.stats.hp = p.stats.maxHp

    // God mode
    p.godMode = config.godMode

    // Initial attacks (se especificados)
    for (const atkType of config.attacks) {
      if (this.attackFactory.isRegistered(atkType) && !p.hasAttack(atkType)) {
        this.attackFactory.createAttack(atkType)
      }
    }

    // Se nenhum ataque especificado, dá o básico
    if (config.attacks.length === 0) {
      const initialAttack =
        this.starterKey === "squirtle"
          ? "waterGun"
          : this.starterKey === "bulbasaur"
            ? "vineWhip"
            : "ember"
      this.attackFactory.createAttack(initialAttack)
    }
  }

  // ── Dev mode: spawn training dummies ──────────────────────────
  private spawnDevDummies(): void {
    // Count active dummies
    const activeCount = getSpatialGrid().getActiveCount()
    const desiredCount = 5
    const toSpawn = desiredCount - activeCount

    for (let i = 0; i < toSpawn; i++) {
      this.spawnSingleDummy()
    }
  }

  spawnSingleDummy(enemyKey = "geodude"): void {
    const config = ENEMIES[enemyKey] as EnemyConfig | undefined
    if (!config) return

    // Spawn at random position around player (100-250px away)
    const angle = Math.random() * Math.PI * 2
    const dist = 100 + Math.random() * 150
    const ex = this.player.x + Math.cos(angle) * dist
    const ey = this.player.y + Math.sin(angle) * dist

    const enemy = new Enemy(this, ex, ey, config)
    this.enemyGroup.add(enemy)
    getSpatialGrid().insert(enemy)
  }

  // Expose para o UIScene acessar via scene.get()
  getAttackFactory(): AttackFactory {
    return this.attackFactory
  }
  getUpgradeSystem(): UpgradeSystem {
    return this.upgradeSystem
  }
  getSpawnSystem(): SpawnSystem {
    return this.spawnSystem
  }
  getGameTime(): number {
    return this.gameTime
  }
  advanceTime(ms: number): void {
    this.gameTime += ms
    this.emitStats()
  }

  private isBossAlive(): boolean {
    const children = this.enemyGroup.getChildren()
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Phaser.GameObjects.GameObject
      if (child.active && child instanceof Boss) return true
    }
    return false
  }

  private emitStats(): void {
    const currentForm = (this.starterConfig.forms ?? []).find(
      (f) => f.form === this.player.stats.form,
    )
    // Keep StatsTracker in sync
    const tracker = getStatsTracker()
    tracker.setLevel(this.player.stats.level)
    tracker.setForm(this.player.stats.form)

    this.events.emit("stats-update", {
      ...this.player.stats,
      starterKey: this.starterKey,
      formName: currentForm?.name ?? this.starterConfig.name,
      time: Math.floor(this.gameTime / 1000),
      heldItems: this.player.getHeldItems(),
      attacks: this.player
        .getAllAttacks()
        .map((a) => ({ type: a.type, level: a.level })),
      damageTotals: Object.fromEntries(getDamageTotals()),
      combo: getComboSystem().getCurrentCombo(),
      comboActive: getComboSystem().isActive(),
      megaGauge: getMegaSystem()?.getGaugeRatio() ?? 0,
      megaActive: getMegaSystem()?.isActive() ?? false,
      megaTimeRemaining: getMegaSystem()?.getMegaTimeRemaining(this.gameTime) ?? 0,
      companions: getCompanionSystem()?.getCompanions() ?? [],
    })
  }
}
