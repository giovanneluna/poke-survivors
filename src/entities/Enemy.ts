import Phaser from "phaser"
import type {
  EnemyConfig,
  Direction,
  SpriteConfig,
  EnemyRangedConfig,
  EnemyContactEffect,
  EnemyHealAuraConfig,
  EnemyDeathExplosionConfig,
  EnemyTeleportConfig,
  EnemyBoomerangConfig,
  EnemySlowAuraConfig,
} from "../types"
import { getPassive } from "../systems/PassiveSystem"
import { getSpatialGrid } from "../systems/SpatialHashGrid"
import {
  recordDamage,
  getDamageBuff,
  getDamageSource,
} from "../systems/DamageTracker"
import { safeExplode } from "../utils/particles"
import { ATTACKS } from "../config"
import { ATTACK_CATEGORIES } from "../data/attacks/categories"
import { ENEMY_TYPES, getTypeEffectiveness } from "../data/type-chart"
import type { EnemyType } from "../types"

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private static nextUid = 1

  private hp: number
  private readonly maxHp: number
  private readonly speed: number
  readonly damage: number
  readonly xpValue: number
  readonly enemyKey: string
  private hpBar: Phaser.GameObjects.Graphics | null = null
  private shadow: Phaser.GameObjects.Image | null = null
  private readonly spriteConfig: SpriteConfig
  private currentDir: Direction = "down"
  readonly rangedAttack: EnemyRangedConfig | undefined
  readonly contactEffect: EnemyContactEffect | undefined
  readonly healAura: EnemyHealAuraConfig | undefined
  readonly deathExplosion: EnemyDeathExplosionConfig | undefined
  readonly teleportConfig: EnemyTeleportConfig | undefined
  readonly boomerang: EnemyBoomerangConfig | undefined
  readonly slowAura: EnemySlowAuraConfig | undefined
  private lastAttackTime = 0
  private lastTeleportTime = 0
  private lastBoomerangTime = 0
  lastHealTick = 0
  private isDead = false
  private speedMultiplier = 1
  private damageMultiplier = 1

  // ── Status effects (passiva do starter) ───────────────────────────
  private burnDps = 0
  private burnUntil = 0
  private wetSpeedMult = 1
  private wetUntil = 0
  private poisonDps = 0
  private poisonUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, config.sprite.key)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.hp = config.hp
    this.maxHp = config.hp
    this.speed = config.speed
    this.damage = config.damage
    this.xpValue = config.xpValue
    this.enemyKey = config.key
    this.spriteConfig = config.sprite
    this.rangedAttack = config.rangedAttack
    this.contactEffect = config.contactEffect
    this.healAura = config.healAura
    this.deathExplosion = config.deathExplosion
    this.teleportConfig = config.teleport
    this.boomerang = config.boomerang
    this.slowAura = config.slowAura

    this.setScale(config.scale)
    this.setDepth(5)
    this.setData('uid', Enemy.nextUid++)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(16, 16)
    body.setOffset(
      (config.sprite.frameWidth - 16) / 2,
      config.sprite.frameHeight - 18,
    )

    // Sombra
    this.shadow = scene.add
      .image(x, y + 8, "shadow")
      .setDepth(4)
      .setScale(config.scale)

    this.play(`${this.spriteConfig.key}-down`)
  }

  // ── Status effects: burn ──────────────────────────────────────────
  applyBurn(dps: number, durationMs: number, time: number): void {
    this.burnDps = dps
    this.burnUntil = time + durationMs
  }

  isBurning(time: number): boolean {
    return time < this.burnUntil
  }

  // ── Enrage (boss timer / overlap buff) ───────────────────────────
  applyEnrage(speedMult: number): void {
    this.speedMultiplier = speedMult
  }

  applyDamageBuff(dmgMult: number): void {
    this.damageMultiplier = dmgMult
  }

  getContactDamage(): number {
    return Math.floor(this.damage * this.damageMultiplier)
  }

  // ── Status effects: wet ───────────────────────────────────────────
  applyWet(speedMult: number, durationMs: number, time: number): void {
    this.wetSpeedMult = speedMult
    this.wetUntil = time + durationMs
  }

  isWet(time: number): boolean {
    return time < this.wetUntil
  }

  // ── Status effects: poison ──────────────────────────────────────
  applyPoison(dps: number, durationMs: number, time: number): void {
    this.poisonDps = dps
    this.poisonUntil = time + durationMs
  }

  isPoisoned(time: number): boolean {
    return time < this.poisonUntil
  }

  moveToward(target: Phaser.Math.Vector2): void {
    if (!this.active || !this.body || this.isDead) return

    // Speed: aplica multiplicadores (enrage, wet)
    let effectiveSpeed = this.speed * this.speedMultiplier
    if (this.isWet(this.scene.time.now)) {
      effectiveSpeed *= this.wetSpeedMult
    }

    this.scene.physics.moveToObject(this, target, effectiveSpeed)

    const vx = this.body.velocity.x
    const vy = this.body.velocity.y
    const newDir = this.velocityToDirection(vx, vy)

    if (newDir !== this.currentDir) {
      this.currentDir = newDir
      const animKey = `${this.spriteConfig.key}-${newDir}`
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey)
      }
    }

    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 8)
    }
  }

  tryRangedAttack(
    playerX: number,
    playerY: number,
    time: number,
  ): { shouldFire: boolean; config: EnemyRangedConfig } | null {
    if (!this.rangedAttack || !this.active) return null

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY)
    if (dist > this.rangedAttack.range) return null
    if (time - this.lastAttackTime < this.rangedAttack.cooldownMs) return null

    this.lastAttackTime = time
    return { shouldFire: true, config: this.rangedAttack }
  }

  private velocityToDirection(vx: number, vy: number): Direction {
    const absX = Math.abs(vx)
    const absY = Math.abs(vy)
    const threshold = 0.4

    if (absX > absY * (1 + threshold)) return vx > 0 ? "right" : "left"
    if (absY > absX * (1 + threshold)) return vy > 0 ? "down" : "up"

    if (vx > 0 && vy > 0) return "downRight"
    if (vx > 0 && vy < 0) return "upRight"
    if (vx < 0 && vy > 0) return "downLeft"
    return "upLeft"
  }

  shouldDespawn(): boolean {
    return true
  }

  getHp(): number {
    return this.hp
  }
  getMaxHp(): number {
    return this.maxHp
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount)
    if (this.hp < this.maxHp) this.drawHpBar()
  }

  /** Override in Boss to return resistance value (0-0.5) */
  getResistance(): number {
    return 0
  }

  /** Override in Boss to return category-specific resistance map */
  getCategoryResistance(): Partial<Record<string, number>> | undefined {
    return undefined
  }

  tryTeleport(playerX: number, playerY: number, time: number): boolean {
    if (!this.teleportConfig || !this.active) return false
    if (time - this.lastTeleportTime < this.teleportConfig.cooldownMs)
      return false
    this.lastTeleportTime = time

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
    const dist = Phaser.Math.FloatBetween(140, this.teleportConfig.range)
    const newX = playerX + Math.cos(angle) * dist
    const newY = playerY + Math.sin(angle) * dist

    this.setAlpha(0.3)
    this.scene.time.delayedCall(200, () => {
      if (!this.active) return
      this.setPosition(newX, newY)
      this.setAlpha(1)
      this.setTint(0xaa44ff)
      this.scene.time.delayedCall(150, () => {
        if (this.active) this.clearTint()
      })
    })
    return true
  }

  tryBoomerang(
    playerX: number,
    playerY: number,
    time: number,
  ): EnemyBoomerangConfig | null {
    if (!this.boomerang || !this.active) return null
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY)
    if (dist > this.boomerang.range) return null
    if (time - this.lastBoomerangTime < this.boomerang.cooldownMs) return null
    this.lastBoomerangTime = time
    return this.boomerang
  }

  /**
   * Apply damage. Passives (Blaze/Torrent) are automatically processed:
   * - Bonus damage if enemy has matching status (burn/wet)
   * - Chance to apply burn or wet on hit
   */
  takeDamage(amount: number): boolean {
    if (!this.scene || this.isDead) return false
    const passive = getPassive()
    let finalAmount = amount
    const now = this.scene.time.now

    // ── Resistance: reduce raw damage (status effects bypass) ─────
    const resist = this.getResistance()
    if (resist > 0) {
      finalAmount = Math.max(1, Math.floor(finalAmount * (1 - resist)))
    }

    // ── Category Resistance (orbital/aura — bosses) ─────
    const catResistMap = this.getCategoryResistance()
    if (catResistMap) {
      const src = getDamageSource()
      if (src && src in ATTACK_CATEGORIES) {
        const cat = ATTACK_CATEGORIES[src as keyof typeof ATTACK_CATEGORIES]
        const catResist = catResistMap[cat]
        if (catResist && catResist > 0) {
          finalAmount = Math.max(1, Math.floor(finalAmount * (1 - catResist)))
        }
      }
    }

    // ── Type Effectiveness ─────
    let typeMultiplier = 1
    const source = getDamageSource()
    if (source) {
      const atkConfig = ATTACKS[source]
      const defenderType = ENEMY_TYPES[this.enemyKey as EnemyType]
      if (atkConfig && defenderType) {
        typeMultiplier = getTypeEffectiveness(atkConfig.element, defenderType)
        if (typeMultiplier !== 1) {
          finalAmount = Math.max(
            typeMultiplier === 0 ? 0 : 1,
            Math.floor(finalAmount * typeMultiplier),
          )
        }
      }
    }

    // ── Berry damage buff (Liechi Berry) ─────
    const damageBuff = getDamageBuff()
    if (damageBuff > 1) {
      finalAmount = Math.floor(finalAmount * damageBuff)
    }

    if (passive && passive.type !== "none") {
      // Bonus damage on status-affected enemies (bypasses resistance)
      const bonusMult = passive.getBonusDamage()
      if (bonusMult > 0) {
        const hasStatus =
          (passive.type === "blaze" && this.isBurning(now)) ||
          (passive.type === "torrent" && this.isWet(now)) ||
          (passive.type === "overgrow" && this.isPoisoned(now))
        if (hasStatus) {
          finalAmount = Math.floor(finalAmount * (1 + bonusMult))
        }
      }

      // Roll for status application
      if (Math.random() < passive.getStatusChance()) {
        if (passive.type === "blaze") {
          this.applyBurn(passive.getBurnDps(), passive.getStatusDuration(), now)
        } else if (passive.type === "torrent") {
          this.applyWet(
            passive.getWetSpeedMultiplier(),
            passive.getStatusDuration(),
            now,
          )
        } else if (passive.type === "overgrow") {
          this.applyPoison(
            passive.getPoisonDps(),
            passive.getStatusDuration(),
            now,
          )
        }
      }
    }

    this.hp -= finalAmount
    recordDamage(finalAmount)

    // Floating damage number for bosses
    if (resist > 0) {
      this.scene.events.emit("boss-damage-number", {
        x: this.x,
        y: this.y - 20,
        amount: finalAmount,
        resisted: true,
      })
    }

    // Type effectiveness floating text
    if (typeMultiplier !== 1) {
      const label =
        typeMultiplier >= 1.5
          ? "Super Efetivo!"
          : typeMultiplier === 0
            ? "Sem Efeito!"
            : "Pouco Efetivo..."
      const color =
        typeMultiplier >= 1.5
          ? "#44ff44"
          : typeMultiplier === 0
            ? "#ff4444"
            : "#888888"
      this.scene.events.emit("type-effectiveness", {
        x: this.x,
        y: this.y - 30,
        label,
        color,
        multiplier: typeMultiplier,
      })
    }

    // Hit flash — tint by effectiveness
    const tint =
      typeMultiplier >= 1.5
        ? 0x44ff44
        : typeMultiplier <= 0.5
          ? 0x888888
          : 0xffffff
    this.setTint(tint)
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint()
    })

    this.drawHpBar()

    if (this.hp <= 0) {
      this.die()
      return true
    }
    return false
  }

  private drawHpBar(): void {
    if (!this.scene || this.isDead) return
    if (!this.hpBar) {
      this.hpBar = this.scene.add.graphics().setDepth(15)
    }

    this.hpBar.clear()
    const barWidth = 24
    const barHeight = 3
    const hpRatio = Math.max(0, this.hp / this.maxHp)

    this.hpBar.fillStyle(0x333333)
    this.hpBar.fillRect(this.x - barWidth / 2, this.y - 18, barWidth, barHeight)

    const color =
      hpRatio > 0.5 ? 0x00ff00 : hpRatio > 0.25 ? 0xffff00 : 0xff0000
    this.hpBar.fillStyle(color)
    this.hpBar.fillRect(
      this.x - barWidth / 2,
      this.y - 18,
      barWidth * hpRatio,
      barHeight,
    )
  }

  private die(): void {
    if (this.isDead) return
    this.isDead = true

    if (this.scene && this.scene.add) {
      // Death explosion (Electrode) — emit event before cleanup
      if (this.deathExplosion) {
        const cfg = this.deathExplosion
        // Use real explosion sprite if available, fallback to circle
        if (this.scene.anims.exists("anim-explosion")) {
          const explosionSprite = this.scene.add
            .sprite(this.x, this.y, "atk-explosion")
            .setDepth(12)
            .setScale(1.2)
          explosionSprite.play("anim-explosion")
          explosionSprite.once("animationcomplete", () =>
            explosionSprite.destroy(),
          )
        } else {
          const circle = this.scene.add
            .circle(this.x, this.y, 0, 0xff4400, 0.5)
            .setDepth(12)
          this.scene.tweens.add({
            targets: circle,
            radius: { from: 0, to: cfg.radius },
            alpha: { from: 0.5, to: 0 },
            duration: 400,
            onComplete: () => circle.destroy(),
          })
        }
        this.scene.cameras.main.shake(200, 0.006)
        this.scene.events.emit("enemy-explosion", {
          x: this.x,
          y: this.y,
          damage: cfg.damage,
          radius: cfg.radius,
        })
      }

      // Passive on-kill effect (Blaze: fire explosion, Torrent: water splash)
      const passive = getPassive()
      if (passive?.hasOnKillEffect()) {
        this.scene.events.emit("passive-on-kill", {
          type: passive.type,
          x: this.x,
          y: this.y,
        })
      }

      // Death particles (element-aware)
      const particleKey =
        passive?.type === "torrent"
          ? "water-particle"
          : passive?.type === "overgrow"
            ? "poison-particle"
            : "fire-particle"
      safeExplode(this.scene, this.x, this.y, particleKey, {
        speed: { min: 30, max: 80 },
        lifespan: 300,
        quantity: 6,
        scale: { start: 1.5, end: 0 },
      })
    }
    this.cleanup()
  }

  cleanup(): void {
    this.isDead = true
    getSpatialGrid().remove(this)
    if (this.hpBar) {
      this.hpBar.destroy()
      this.hpBar = null
    }
    if (this.shadow) {
      this.shadow.destroy()
      this.shadow = null
    }
    this.destroy()
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    if (!this.scene || this.isDead) return

    // ── Burn DoT (Blaze passive) ──────────────────────────────────
    if (this.isBurning(time)) {
      this.hp -= this.burnDps * (delta / 1000)
      // Visual: orange-red pulse
      if (Math.floor(time / 250) % 2 === 0) this.setTint(0xff6600)

      if (this.hp <= 0 && this.active) {
        // Burn kill: emit event for kill tracking
        this.scene.events.emit("cone-attack-kill", this.x, this.y, this.xpValue)
        this.die()
        return
      }
    } else if (this.burnUntil > 0 && time >= this.burnUntil) {
      this.burnUntil = 0
    }

    // ── Wet visual (Torrent passive) ──────────────────────────────
    if (this.isWet(time)) {
      // Blue tint when not being hit-flashed
      if (Math.floor(time / 400) % 3 !== 0) this.setTint(0x3388ff)
    } else if (this.wetUntil > 0 && time >= this.wetUntil) {
      this.wetUntil = 0
    }

    // ── Poison DoT (Overgrow passive) ──────────────────────────────
    if (this.isPoisoned(time)) {
      this.hp -= this.poisonDps * (delta / 1000)
      // Visual: green-purple pulse
      if (Math.floor(time / 300) % 2 === 0) this.setTint(0x9944cc)

      if (this.hp <= 0 && this.active) {
        this.scene.events.emit("cone-attack-kill", this.x, this.y, this.xpValue)
        this.die()
        return
      }
    } else if (this.poisonUntil > 0 && time >= this.poisonUntil) {
      this.poisonUntil = 0
    }

    // HP bar — show when damaged, hide when full HP (prevents ghost bars from heal aura)
    if (this.hpBar) {
      if (this.hp < this.maxHp) {
        this.drawHpBar()
      } else {
        this.hpBar.clear()
      }
    }
  }
}
