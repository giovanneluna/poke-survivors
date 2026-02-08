import Phaser from "phaser"
import { ATTACKS, ENEMIES, EVOLUTIONS, CHARMANDER_FORMS } from "../config"
import { ATTACK_CATEGORIES } from "../data/attacks/categories"
import { SoundManager } from "../audio/SoundManager"
import type {
  AttackType,
  EnemyConfig,
  BossConfig,
  AttackCategory,
  PokemonForm,
} from "../types"

// ── Layout constants ─────────────────────────────────────────────────
const SECTION_GAP = 60
const ROW_HEIGHT = 90
const LABEL_X = 30
const POKEMON_X = 310
const DEMO_START_X = 360
const DEMO_END_X = 580
const STATS_X = 600
const BG_COLOR = 0x111122

// ── Escala por textura (ajustada para ~50-70px renderizado) ──────────
const ATTACK_SCALES: Readonly<Record<string, number>> = {
  "atk-ember": 2.5, // 26x26 → 65x65
  "atk-fire-range": 1.8, // 40x40 → 72x72
  "atk-flamethrower": 0.65, // 80x96 → 52x62
  "atk-fire-blast": 0.8, // 72x73 → 58x58
  "atk-blast-burn": 0.7, // 80x80 → 56x56
  "atk-scratch": 1.0, // 64x56 → 64x56
  "atk-slash": 2.0, // 32x32 → 64x64
  "atk-fury-swipes": 2.0, // 32x32 → 64x64
  "atk-night-slash": 1.0, // 56x64 → 56x64
  "atk-fire-fang": 0.8, // 80x64 → 64x51
  "atk-blaze-kick": 0.85, // 64x72 → 54x61
  "atk-dragon-breath": 0.9, // 32x74 → 29x67
  "atk-dragon-claw": 0.65, // 96x78 → 62x51
  "atk-dragon-pulse": 2.0, // 32x32 → 64x64
  "atk-dragon-rush": 1.0, // 65x64 → 65x64
  "atk-draco-meteor": 1.5, // 96x58 → 67x41
  "atk-smokescreen": 1.4, // 45x45 → 63x63
  "atk-flame-charge": 0.8, // 20x96 → 16x77
  "atk-flare-blitz": 0.7, // 96x83 → 67x58
  "atk-air-slash": 1.4, // 48x48 → 67x67
  "atk-aerial-ace": 2.0, // 32x32 → 64x64
  "atk-hurricane": 0.8, // 56x80 → 45x64
  "atk-heat-wave": 0.65, // 96x82 → 62x53
  "atk-outrage": 0.9, // 48x72 → 43x65
  "atk-shadow-ball": 1.0, // 64x64
  "atk-rock-slide": 0.9, // 48x96 → 43x86
  "atk-rock-throw": 0.9, // 16x16 → 64x64
}

// ── Sprite key do Pokémon por forma ──────────────────────────────────
const FORM_SPRITE: Readonly<Record<PokemonForm, string>> = {
  base: "charmander-walk",
  stage1: "charmeleon-walk",
  stage2: "charizard-walk",
}

export class ShowcaseScene extends Phaser.Scene {
  private contentHeight = 0
  private activeTimers: Phaser.Time.TimerEvent[] = []

  constructor() {
    super({ key: "ShowcaseScene" })
  }

  create(): void {
    const { width } = this.cameras.main
    this.activeTimers = []

    // Background
    this.add.rectangle(width / 2, 5000, width, 10000, BG_COLOR).setDepth(0)

    let y = 40

    // ── Título ─────────────────────────────────────────────────────
    this.add
      .text(width / 2, y, "MODO TESTE - CHARMANDER LINE", {
        fontSize: "20px",
        color: "#ffcc00",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
    y += 50

    // ══ FORMAS ══════════════════════════════════════════════════════
    y = this.addSectionHeader(y, "FORMAS DO POKEMON")
    y = this.addFormsSection(y)

    // ══ ATAQUES por forma ═══════════════════════════════════════════
    y = this.addSectionHeader(y, "ATAQUES BASE (Charmander)")
    y = this.addAttacksForForm(y, "base")

    y = this.addSectionHeader(y, "ATAQUES CHARMELEON (stage1)")
    y = this.addAttacksForForm(y, "stage1")

    y = this.addSectionHeader(y, "ATAQUES CHARIZARD (stage2)")
    y = this.addAttacksForForm(y, "stage2")

    // ══ EVOLUÇÕES DE ARMA ═══════════════════════════════════════════
    y = this.addSectionHeader(y, "EVOLUCOES DE ARMA")
    y = this.addEvolutionsSection(y)

    // ══ INIMIGOS ════════════════════════════════════════════════════
    y = this.addSectionHeader(y, "INIMIGOS")
    y = this.addEnemiesSection(y)

    // ══ BOSSES ═══════════════════════════════════════════════════════
    y = this.addSectionHeader(y, "BOSSES")
    y = this.addBossesSection(y)

    // ── Botão Voltar ────────────────────────────────────────────────
    y += 30
    const backBtn = this.add
      .text(width / 2, y, "[ VOLTAR ]", {
        fontSize: "16px",
        color: "#ffcc00",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    backBtn.on("pointerover", () => backBtn.setColor("#ffffff"))
    backBtn.on("pointerout", () => backBtn.setColor("#ffcc00"))
    backBtn.on("pointerdown", () => {
      SoundManager.playClick()
      this.cleanupTimers()
      this.scene.start("SelectScene")
    })

    y += 60
    this.contentHeight = y

    // ── Câmera scroll ───────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, width, this.contentHeight)
    this.cameras.main.setScroll(0, 0)

    this.input.on(
      "wheel",
      (
        _p: Phaser.Input.Pointer,
        _gos: Phaser.GameObjects.GameObject[],
        _dx: number,
        dy: number,
      ) => {
        const cam = this.cameras.main
        cam.scrollY = Phaser.Math.Clamp(
          cam.scrollY + dy * 0.5,
          0,
          this.contentHeight - cam.height,
        )
      },
    )

    // Drag scroll
    let dragStartY = 0
    let camStartY = 0
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      dragStartY = p.y
      camStartY = this.cameras.main.scrollY
    })
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return
      const dy = dragStartY - p.y
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        camStartY + dy,
        0,
        this.contentHeight - this.cameras.main.height,
      )
    })

    this.cameras.main.fadeIn(300, 0, 0, 0)
  }

  // ── Seções ──────────────────────────────────────────────────────────

  private addSectionHeader(y: number, title: string): number {
    y += SECTION_GAP / 2
    const { width } = this.cameras.main

    const line = this.add.graphics()
    line.lineStyle(1, 0xffcc00, 0.3)
    line.lineBetween(20, y, width - 20, y)

    y += 8
    this.add
      .text(width / 2, y, title, {
        fontSize: "14px",
        color: "#ffcc00",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)

    return y + 30
  }

  private addFormsSection(y: number): number {
    const formSpacing = 200
    const { width } = this.cameras.main
    const startX = width / 2 - formSpacing

    for (let i = 0; i < CHARMANDER_FORMS.length; i++) {
      const form = CHARMANDER_FORMS[i]
      const fx = startX + i * formSpacing

      const sprKey = form.sprite.key
      const animKey = `${sprKey}-right`
      const sprite = this.add.sprite(fx, y + 30, sprKey)
      sprite.setScale(2.5)
      if (this.anims.exists(animKey)) {
        sprite.play(animKey)
      }

      this.add
        .text(fx, y + 70, form.name, {
          fontSize: "12px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)

      this.add
        .text(
          fx,
          y + 88,
          `Lv.${form.level} | ${form.maxAttackSlots}atk ${form.maxPassiveSlots}pas`,
          {
            fontSize: "9px",
            color: "#888888",
            fontFamily: "monospace",
          },
        )
        .setOrigin(0.5, 0)

      if (i < CHARMANDER_FORMS.length - 1) {
        this.add
          .text(fx + formSpacing / 2, y + 30, "→", {
            fontSize: "24px",
            color: "#ffcc00",
            fontFamily: "monospace",
          })
          .setOrigin(0.5)
      }
    }

    return y + 110
  }

  private addAttacksForForm(y: number, formFilter: PokemonForm): number {
    const attackKeys = Object.keys(ATTACKS).filter((k) => {
      const atk = ATTACKS[k]
      if (atk.minForm !== formFilter) return false
      const isEvolved = EVOLUTIONS.some((e) => e.evolvedAttack === k)
      return !isEvolved
    })

    for (const key of attackKeys) {
      y = this.addAttackRow(y, key as AttackType, formFilter)
    }
    return y
  }

  private addAttackRow(
    y: number,
    attackKey: AttackType,
    form: PokemonForm,
  ): number {
    const atk = ATTACKS[attackKey]
    if (!atk) return y

    const category: AttackCategory = ATTACK_CATEGORIES[attackKey]
    const categoryColors: Record<AttackCategory, number> = {
      projectile: 0xff8800,
      orbital: 0x44aaff,
      cone: 0xcccccc,
      dash: 0x44ff44,
      area: 0xff44aa,
      aura: 0x888888,
    }
    const catColor = categoryColors[category] ?? 0x888888

    // ── Faixa de fundo alternada para separar rows ──────────────────
    const rowBg = this.add.graphics()
    rowBg.fillStyle(0xffffff, 0.02)
    rowBg.fillRect(
      0,
      y - ROW_HEIGHT / 2 + 5,
      this.cameras.main.width,
      ROW_HEIGHT - 10,
    )

    // ── Nome do ataque ──────────────────────────────────────────────
    this.add
      .text(LABEL_X, y - 10, atk.name, {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)

    // ── Category badge ──────────────────────────────────────────────
    const badgeX = LABEL_X
    const badgeGfx = this.add.graphics()
    badgeGfx.fillStyle(catColor, 0.25)
    badgeGfx.fillRoundedRect(badgeX, y + 2, 75, 18, 4)
    badgeGfx.lineStyle(1, catColor, 0.5)
    badgeGfx.strokeRoundedRect(badgeX, y + 2, 75, 18, 4)

    this.add
      .text(badgeX + 37, y + 11, category.toUpperCase(), {
        fontSize: "8px",
        color: Phaser.Display.Color.IntegerToColor(catColor).rgba,
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // ── Descrição curta ─────────────────────────────────────────────
    this.add
      .text(LABEL_X + 85, y + 11, atk.description, {
        fontSize: "8px",
        color: "#666666",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5)

    // ── Pokémon sprite (forma correspondente) ───────────────────────
    const pokeSpriteKey = FORM_SPRITE[form]
    const pokeAnimKey = `${pokeSpriteKey}-right`
    const poke = this.add.sprite(POKEMON_X, y, pokeSpriteKey)
    poke.setScale(1.8)
    if (this.anims.exists(pokeAnimKey)) {
      poke.play(pokeAnimKey)
    }

    // ── Demo do ataque saindo do Pokémon ────────────────────────────
    this.addAttackDemo(DEMO_START_X, y, attackKey)

    // ── Stats à direita ─────────────────────────────────────────────
    const dmgText = `DMG ${atk.baseDamage}`
    const cdText = `CD ${(atk.baseCooldown / 1000).toFixed(1)}s`
    const elemText = atk.element.toUpperCase()

    const elemColors: Record<string, string> = {
      fire: "#ff6600",
      normal: "#cccccc",
      dragon: "#7744ff",
      flying: "#88ccff",
    }

    this.add
      .text(STATS_X, y - 12, dmgText, {
        fontSize: "10px",
        color: "#ff6666",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)

    this.add
      .text(STATS_X + 65, y - 12, cdText, {
        fontSize: "10px",
        color: "#66aaff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5)

    this.add
      .text(STATS_X, y + 8, elemText, {
        fontSize: "9px",
        color: elemColors[atk.element] ?? "#888888",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)

    this.add
      .text(STATS_X + 65, y + 8, `Lv max: ${atk.maxLevel}`, {
        fontSize: "9px",
        color: "#555555",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5)

    return y + ROW_HEIGHT
  }

  private addAttackDemo(x: number, y: number, attackKey: AttackType): void {
    const spriteMap: Partial<
      Record<AttackType, { atkKey: string; animKey: string }>
    > = {
      ember: { atkKey: "atk-ember", animKey: "anim-ember" },
      inferno: { atkKey: "atk-ember", animKey: "anim-ember" },
      fireSpin: { atkKey: "atk-fire-range", animKey: "anim-fire-range" },
      fireBlast: { atkKey: "atk-fire-blast", animKey: "anim-fire-blast" },
      flamethrower: {
        atkKey: "atk-flamethrower",
        animKey: "anim-flamethrower",
      },
      blastBurn: { atkKey: "atk-blast-burn", animKey: "anim-blast-burn" },
      dragonBreath: {
        atkKey: "atk-dragon-breath",
        animKey: "anim-dragon-breath",
      },
      dragonPulse: { atkKey: "atk-dragon-pulse", animKey: "anim-dragon-pulse" },
      airSlash: { atkKey: "atk-air-slash", animKey: "anim-air-slash" },
      aerialAce: { atkKey: "atk-aerial-ace", animKey: "anim-aerial-ace" },
      hurricane: { atkKey: "atk-hurricane", animKey: "anim-hurricane" },
      outrage: { atkKey: "atk-outrage", animKey: "anim-outrage" },
      heatWave: { atkKey: "atk-heat-wave", animKey: "anim-heat-wave" },
      dracoMeteor: { atkKey: "atk-draco-meteor", animKey: "anim-draco-meteor" },
      scratch: { atkKey: "atk-scratch", animKey: "anim-scratch" },
      slash: { atkKey: "atk-slash", animKey: "anim-slash" },
      fireFang: { atkKey: "atk-fire-fang", animKey: "anim-fire-fang" },
      flameCharge: { atkKey: "atk-flame-charge", animKey: "anim-flame-charge" },
      dragonClaw: { atkKey: "atk-dragon-claw", animKey: "anim-dragon-claw" },
      flareBlitz: { atkKey: "atk-flare-blitz", animKey: "anim-flare-blitz" },
      nightSlash: { atkKey: "atk-night-slash", animKey: "anim-night-slash" },
      furySwipes: { atkKey: "atk-fury-swipes", animKey: "anim-fury-swipes" },
      blazeKick: { atkKey: "atk-blaze-kick", animKey: "anim-blaze-kick" },
      flareRush: { atkKey: "atk-flame-charge", animKey: "anim-flame-charge" },
      dragonRush: { atkKey: "atk-dragon-rush", animKey: "anim-dragon-rush" },
      smokescreen: { atkKey: "atk-smokescreen", animKey: "anim-smokescreen" },
    }

    const mapping = spriteMap[attackKey]
    if (!mapping) {
      this.add
        .text(x + 20, y, "[no sprite]", {
          fontSize: "9px",
          color: "#555555",
          fontFamily: "monospace",
        })
        .setOrigin(0, 0.5)
      return
    }

    if (!this.textures.exists(mapping.atkKey)) {
      this.add
        .text(x + 20, y, "[missing]", {
          fontSize: "9px",
          color: "#553333",
          fontFamily: "monospace",
        })
        .setOrigin(0, 0.5)
      return
    }

    const scale = ATTACK_SCALES[mapping.atkKey] ?? 1.0

    // Spawn contínuo: ataque sai do Pokémon e viaja para a direita
    const spawnDemo = (): void => {
      const spr = this.add.sprite(x, y, mapping.atkKey)
      spr.setScale(scale)

      if (this.anims.exists(mapping.animKey)) {
        spr.play({ key: mapping.animKey, repeat: 0 })
      }

      this.tweens.add({
        targets: spr,
        x: DEMO_END_X,
        duration: 1500,
        onUpdate: () => {
          // Destruir se saiu da área de demo
          if (spr.x > DEMO_END_X) spr.destroy()
        },
        onComplete: () => {
          if (spr.active) spr.destroy()
        },
      })
    }

    spawnDemo()
    const timer = this.time.addEvent({
      delay: 2200,
      callback: spawnDemo,
      loop: true,
    })
    this.activeTimers.push(timer)
  }

  private addEvolutionsSection(y: number): number {
    for (const evo of EVOLUTIONS) {
      const baseAtk = ATTACKS[evo.baseAttack]
      const evoAtk = ATTACKS[evo.evolvedAttack]
      if (!baseAtk || !evoAtk) continue

      // Faixa de fundo
      const rowBg = this.add.graphics()
      rowBg.fillStyle(0xffffff, 0.02)
      rowBg.fillRect(
        0,
        y - ROW_HEIGHT / 2 + 5,
        this.cameras.main.width,
        ROW_HEIGHT - 10,
      )

      // Base → Evolved
      this.add
        .text(LABEL_X, y - 10, `${baseAtk.name}  →  ${evoAtk.name}`, {
          fontSize: "12px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)

      // Requisitos
      this.add
        .text(
          LABEL_X,
          y + 10,
          `Lv${evo.requiredLevel} + ${evo.requiredItem} (${evo.requiredForm})`,
          {
            fontSize: "9px",
            color: "#888888",
            fontFamily: "monospace",
          },
        )
        .setOrigin(0, 0.5)

      // Pokémon da forma requerida
      const pokeSpriteKey = FORM_SPRITE[evo.requiredForm]
      const pokeAnimKey = `${pokeSpriteKey}-right`
      const poke = this.add.sprite(POKEMON_X, y, pokeSpriteKey)
      poke.setScale(1.8)
      if (this.anims.exists(pokeAnimKey)) {
        poke.play(pokeAnimKey)
      }

      // Demo do ataque evoluído
      this.addAttackDemo(DEMO_START_X, y, evo.evolvedAttack)

      // Descrição
      this.add
        .text(STATS_X, y, evo.description, {
          fontSize: "9px",
          color: "#aaaaaa",
          fontFamily: "monospace",
        })
        .setOrigin(0, 0.5)

      y += ROW_HEIGHT
    }
    return y
  }

  private isBoss(config: EnemyConfig | BossConfig): config is BossConfig {
    return "isBoss" in config && (config as BossConfig).isBoss === true
  }

  private addEnemiesSection(y: number): number {
    const enemyKeys = Object.keys(ENEMIES).filter(
      (k) => !this.isBoss(ENEMIES[k]),
    )

    for (const key of enemyKeys) {
      const enemy = ENEMIES[key]

      // Faixa de fundo
      const rowBg = this.add.graphics()
      rowBg.fillStyle(0xffffff, 0.02)
      rowBg.fillRect(
        0,
        y - ROW_HEIGHT / 2 + 5,
        this.cameras.main.width,
        ROW_HEIGHT - 10,
      )

      // Walk sprite animado
      const sprKey = enemy.sprite.key
      const animKey = `${sprKey}-right`
      const sprite = this.add.sprite(LABEL_X + 30, y, sprKey)
      sprite.setScale(2.5)
      if (this.anims.exists(animKey)) {
        sprite.play(animKey)
      }

      // Nome
      this.add
        .text(LABEL_X + 70, y - 12, enemy.name.toUpperCase(), {
          fontSize: "12px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)

      // Stats
      const statsText = `HP:${enemy.hp}  SPD:${enemy.speed}  DMG:${enemy.damage}  XP:${enemy.xpValue}`
      this.add
        .text(LABEL_X + 70, y + 8, statsText, {
          fontSize: "9px",
          color: "#aaaaaa",
          fontFamily: "monospace",
        })
        .setOrigin(0, 0.5)

      // Tipo (melee ou ranged)
      const isRanged = !!enemy.rangedAttack
      const typeText = isRanged ? "RANGED" : "MELEE"
      const typeColor = isRanged ? "#ff8844" : "#44ff88"

      const typeBadge = this.add.graphics()
      const badgeColor = isRanged ? 0xff8844 : 0x44ff88
      typeBadge.fillStyle(badgeColor, 0.2)
      typeBadge.fillRoundedRect(280, y - 10, 65, 20, 4)
      typeBadge.lineStyle(1, badgeColor, 0.5)
      typeBadge.strokeRoundedRect(280, y - 10, 65, 20, 4)

      this.add
        .text(312, y, typeText, {
          fontSize: "10px",
          color: typeColor,
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5)

      // Projétil de inimigo
      if (enemy.rangedAttack) {
        const projKey = enemy.rangedAttack.projectileKey
        const projAnimKey = projKey.replace("atk-", "anim-")
        const projScale = ATTACK_SCALES[projKey] ?? 1.0

        if (this.textures.exists(projKey)) {
          // Projétil disparado continuamente do inimigo
          const spawnProj = (): void => {
            const projSprite = this.add.sprite(DEMO_START_X, y, projKey)
            projSprite.setScale(projScale)
            if (this.anims.exists(projAnimKey)) {
              projSprite.play({ key: projAnimKey, repeat: -1 })
            }
            this.tweens.add({
              targets: projSprite,
              x: DEMO_END_X,
              duration: 1500,
              onComplete: () => {
                if (projSprite.active) projSprite.destroy()
              },
            })
          }

          spawnProj()
          const timer = this.time.addEvent({
            delay: 2500,
            callback: spawnProj,
            loop: true,
          })
          this.activeTimers.push(timer)

          // Stats do projétil
          const ra = enemy.rangedAttack
          this.add
            .text(
              STATS_X,
              y,
              `Proj: DMG ${ra.damage} | SPD ${ra.speed} | CD ${(ra.cooldownMs / 1000).toFixed(1)}s`,
              {
                fontSize: "8px",
                color: "#777777",
                fontFamily: "monospace",
              },
            )
            .setOrigin(0, 0.5)
        }
      }

      y += ROW_HEIGHT
    }
    return y
  }

  private addBossesSection(y: number): number {
    const bossKeys = Object.keys(ENEMIES).filter((k) => this.isBoss(ENEMIES[k]))

    // Map boss attack pattern to sprite/anim keys
    const bossAttackSprites: Record<
      string,
      { atkKey: string; animKey: string; scale: number }
    > = {
      charge: { atkKey: "atk-bite", animKey: "anim-bite", scale: 2.0 },
      fan: { atkKey: "atk-gunk-shot", animKey: "anim-gunk-shot", scale: 1.5 },
      "aoe-tremor": {
        atkKey: "atk-thrash",
        animKey: "anim-thrash",
        scale: 2.5,
      },
      "aoe-land": { atkKey: "atk-stomp", animKey: "anim-stomp", scale: 4.0 },
    }

    for (const key of bossKeys) {
      const boss = ENEMIES[key] as BossConfig

      // Faixa de fundo dourada
      const rowBg = this.add.graphics()
      rowBg.fillStyle(0xffd700, 0.05)
      rowBg.fillRect(
        0,
        y - ROW_HEIGHT / 2 + 5,
        this.cameras.main.width,
        ROW_HEIGHT - 10,
      )
      rowBg.lineStyle(1, 0xffd700, 0.2)
      rowBg.strokeRect(
        0,
        y - ROW_HEIGHT / 2 + 5,
        this.cameras.main.width,
        ROW_HEIGHT - 10,
      )

      // Walk sprite animado (maior que inimigos normais)
      const sprKey = boss.sprite.key
      const animKey = `${sprKey}-right`
      const sprite = this.add.sprite(LABEL_X + 30, y, sprKey)
      sprite.setScale(3.5)
      if (this.anims.exists(animKey)) {
        sprite.play(animKey)
      }

      // Badge BOSS
      const badgeBg = this.add.graphics()
      badgeBg.fillStyle(0xff0000, 0.3)
      badgeBg.fillRoundedRect(LABEL_X + 60, y - 28, 45, 16, 4)
      badgeBg.lineStyle(1, 0xff0000, 0.6)
      badgeBg.strokeRoundedRect(LABEL_X + 60, y - 28, 45, 16, 4)

      this.add
        .text(LABEL_X + 82, y - 20, "BOSS", {
          fontSize: "10px",
          color: "#ff4444",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5)

      // Nome
      this.add
        .text(LABEL_X + 70, y - 6, boss.name.toUpperCase(), {
          fontSize: "14px",
          color: "#FFD700",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)

      // Stats
      const statsText = `HP:${boss.hp}  SPD:${boss.speed}  DMG:${boss.damage}  XP:${boss.xpValue}`
      this.add
        .text(LABEL_X + 70, y + 12, statsText, {
          fontSize: "9px",
          color: "#aaaaaa",
          fontFamily: "monospace",
        })
        .setOrigin(0, 0.5)

      // Ataque especial info
      const atkInfo = `${boss.bossAttack.name} (${boss.bossAttack.pattern}) — DMG:${boss.bossAttack.damage}`
      this.add
        .text(LABEL_X + 70, y + 26, atkInfo, {
          fontSize: "8px",
          color: "#ff8844",
          fontFamily: "monospace",
        })
        .setOrigin(0, 0.5)

      // Boss attack sprite demo
      const atkMapping = bossAttackSprites[boss.bossAttack.pattern]
      if (atkMapping && this.textures.exists(atkMapping.atkKey)) {
        const spawnBossAtk = (): void => {
          const atkSprite = this.add.sprite(DEMO_START_X, y, atkMapping.atkKey)
          atkSprite.setScale(atkMapping.scale)
          if (this.anims.exists(atkMapping.animKey)) {
            atkSprite.play({ key: atkMapping.animKey, repeat: 0 })
          }
          this.tweens.add({
            targets: atkSprite,
            x: DEMO_END_X,
            duration: 1500,
            onComplete: () => {
              if (atkSprite.active) atkSprite.destroy()
            },
          })
        }
        spawnBossAtk()
        const timer = this.time.addEvent({
          delay: 2500,
          callback: spawnBossAtk,
          loop: true,
        })
        this.activeTimers.push(timer)
      }

      y += ROW_HEIGHT + 10
    }
    return y
  }

  private cleanupTimers(): void {
    for (const timer of this.activeTimers) {
      timer.destroy()
    }
    this.activeTimers = []
  }

  shutdown(): void {
    this.cleanupTimers()
  }
}
