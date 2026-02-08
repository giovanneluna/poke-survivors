import Phaser from "phaser"
import { ATTACKS, EVOLUTIONS, CHARMANDER_FORMS, SQUIRTLE_FORMS, BULBASAUR_FORMS } from "../config"
import { ATTACK_CATEGORIES } from "../data/attacks/categories"
import { SoundManager } from "../audio/SoundManager"
import type {
  AttackType,
  AttackCategory,
  PokemonForm,
  PokemonFormConfig,
} from "../types"

// ── Layout constants ─────────────────────────────────────────────────
const SECTION_GAP = 60
const ROW_HEIGHT = 100
const LABEL_X = 30
const POKEMON_X = 310
const DEMO_START_X = 360
const DEMO_END_X = 580
const STATS_X = 600
const BG_COLOR = 0x111122

// ── Escala por textura (ajustada para ~50-70px renderizado) ──────────
const ATTACK_SCALES: Readonly<Record<string, number>> = {
  "atk-ember": 2.5,
  "atk-fire-range": 1.8,
  "atk-flamethrower": 0.65,
  "atk-fire-blast": 0.8,
  "atk-blast-burn": 0.7,
  "atk-scratch": 1.0,
  "atk-slash": 2.0,
  "atk-fury-swipes": 2.0,
  "atk-night-slash": 1.0,
  "atk-fire-fang": 0.8,
  "atk-blaze-kick": 0.85,
  "atk-dragon-breath": 0.9,
  "atk-dragon-claw": 0.65,
  "atk-dragon-pulse": 2.0,
  "atk-dragon-rush": 1.0,
  "atk-draco-meteor": 1.5,
  "atk-smokescreen": 1.4,
  "atk-flame-charge-down": 0.7,
  "atk-flare-blitz": 0.7,
  "atk-air-slash": 1.4,
  "atk-aerial-ace": 2.0,
  "atk-hurricane": 0.8,
  "atk-heat-wave": 0.65,
  "atk-outrage": 0.9,
  "atk-shadow-ball": 1.0,
  "atk-rock-slide": 0.9,
  "atk-rock-throw": 0.9,
  "atk-wave-splash": 2.0,
  "atk-sparkling-aria": 1.0,
  "atk-water-melee": 1.0,
  "atk-origin-pulse": 1.0,
  "atk-frost-breath": 1.0,
  "atk-rapid-spin": 1.0,
  "atk-aqua-tail-right": 1.0,
  "atk-aqua-jet-right": 0.5,
  "atk-hydro-pump": 0.6,
  "atk-water-range": 4.0,
  "atk-whirlpool-rings": 2.0,
  "atk-liquidation": 0.6,
  "atk-surf": 1.0,
  "atk-ice-range": 1.0,
  // Grass
  "atk-vine-whip": 1.5,
  "atk-razor-leaf": 2.0,
  "atk-leech-seed": 1.5,
  "atk-cotton-spore": 1.2,
  "atk-stun-spore": 1.0,
  "atk-leaf-blade": 0.8,
  "atk-solar-beam": 0.6,
  "atk-petal-dance": 0.8,
  "atk-leech-life": 1.0,
  "atk-magical-leaf": 1.5,
  "atk-ingrain": 0.8,
  "atk-petal-blizzard": 1.0,
  "atk-power-whip": 1.0,
  "atk-seed-flare": 0.8,
  "atk-solar-blade": 0.8,
  "atk-grass-melee": 1.0,
  // Poison
  "atk-smog": 1.2,
  "atk-acid-spray": 0.7,
  "atk-sludge-wave": 2.0,
  "atk-poison-melee": 1.0,
}

// ── Sprite file info (path + source) ─────────────────────────────────
const SPRITE_FILE_INFO: Readonly<Record<string, { file: string; source: string }>> = {
  // Fire
  "atk-ember":              { file: "fire/ember-sheet.png",              source: "pokemonAutoChess" },
  "atk-fire-range":         { file: "fire/fire-range-sheet.png",         source: "pokemonAutoChess" },
  "atk-flamethrower":       { file: "fire/flamethrower-sheet.png",       source: "pokemonAutoChess" },
  "atk-fire-blast":         { file: "fire/fire-blast-sheet.png",         source: "pokemonAutoChess" },
  "atk-blast-burn":         { file: "fire/blast-burn-sheet.png",         source: "pokemonAutoChess" },
  "atk-fire-fang":          { file: "fire/fire-fang-sheet.png",          source: "pokemonAutoChess" },
  "atk-flame-charge-down":  { file: "fire/flame-charge-down-sheet.png",  source: "Tibia" },
  "atk-flame-charge-up":    { file: "fire/flame-charge-up-sheet.png",    source: "Tibia" },
  "atk-flare-blitz":        { file: "fire/flare-blitz-sheet.png",        source: "pokemonAutoChess" },
  "atk-heat-wave":          { file: "fire/heat-wave-sheet.png",          source: "pokemonAutoChess" },
  "atk-eruption":           { file: "fire/eruption-sheet.png",           source: "pokemonAutoChess" },
  // Normal
  "atk-scratch":            { file: "normal/scratch-sheet.png",          source: "pokemonAutoChess" },
  "atk-slash":              { file: "normal/slash-sheet.png",            source: "pokemonAutoChess" },
  "atk-fury-swipes":        { file: "normal/fury-swipes-sheet.png",      source: "pokemonAutoChess" },
  "atk-night-slash":        { file: "normal/night-slash-sheet.png",      source: "pokemonAutoChess" },
  "atk-blaze-kick":         { file: "normal/blaze-kick-sheet.png",       source: "pokemonAutoChess" },
  "atk-smokescreen":        { file: "normal/smokescreen-sheet.png",      source: "pokemonAutoChess" },
  // Dragon
  "atk-dragon-breath":      { file: "dragon/dragon-breath-sheet.png",    source: "pokemonAutoChess" },
  "atk-dragon-claw":        { file: "dragon/dragon-claw-sheet.png",      source: "pokemonAutoChess" },
  "atk-dragon-pulse":       { file: "dragon/dragon-pulse-sheet.png",     source: "pokemonAutoChess" },
  "atk-dragon-rush":        { file: "dragon/dragon-rush-sheet.png",      source: "pokemonAutoChess" },
  "atk-draco-meteor":       { file: "dragon/draco-meteor-sheet.png",     source: "pokemonAutoChess" },
  "atk-outrage":            { file: "dragon/outrage-sheet.png",          source: "pokemonAutoChess" },
  // Flying
  "atk-air-slash":          { file: "flying/air-slash-sheet.png",        source: "pokemonAutoChess" },
  "atk-aerial-ace":         { file: "flying/aerial-ace-sheet.png",       source: "pokemonAutoChess" },
  "atk-hurricane":          { file: "flying/hurricane-sheet.png",        source: "pokemonAutoChess" },
  // Water
  "atk-water-range":        { file: "water/water-range-sheet.png",       source: "pokemonAutoChess" },
  "atk-wave-splash":        { file: "water/wave-splash-sheet.png",       source: "pokemonAutoChess" },
  "atk-sparkling-aria":     { file: "water/sparkling-aria-sheet.png",    source: "pokemonAutoChess" },
  "atk-water-melee":        { file: "water/water-melee-sheet.png",       source: "pokemonAutoChess" },
  "atk-origin-pulse":       { file: "water/origin-pulse-sheet.png",      source: "pokemonAutoChess" },
  "atk-hydro-pump":         { file: "water/hydro-pump-sheet.png",        source: "pokemonAutoChess" },
  "atk-surf":               { file: "water/surf-sheet.png",              source: "pokemonAutoChess" },
  "atk-liquidation":        { file: "water/liquidation-sheet.png",       source: "pokemonAutoChess" },
  "atk-rapid-spin":         { file: "water/rapid-spin-sheet.png",        source: "pokemonAutoChess" },
  "atk-aqua-jet-right":     { file: "water/aqua-jet-left-sheet.png",     source: "Tibia" },
  "atk-aqua-tail-right":    { file: "water/aqua-tail-left-sheet.png",    source: "Tibia" },
  "atk-whirlpool-rings":    { file: "water/whirlpool-rings-sheet.png",   source: "pokemonAutoChess" },
  "atk-frost-breath":       { file: "ice/frost-breath-sheet.png",        source: "pokemonAutoChess" },
  // Ice
  "atk-ice-range":          { file: "ice/ice-range-sheet.png",           source: "pokemonAutoChess" },
  // Ghost
  "atk-shadow-ball":        { file: "ghost/shadow-ball-sheet.png",       source: "pokemonAutoChess" },
  // Grass
  "atk-vine-whip":          { file: "grass/vine-whip-sheet.png",        source: "pokemonAutoChess" },
  "atk-razor-leaf":         { file: "grass/razor-leaf-sheet.png",       source: "pokemonAutoChess" },
  "atk-leech-seed":         { file: "grass/leech-seed-sheet.png",       source: "pokemonAutoChess" },
  "atk-cotton-spore":       { file: "grass/cotton-spore-sheet.png",     source: "pokemonAutoChess" },
  "atk-stun-spore":         { file: "grass/stun-spore-sheet.png",       source: "pokemonAutoChess" },
  "atk-leaf-blade":         { file: "grass/leaf-blade-sheet.png",       source: "pokemonAutoChess" },
  "atk-solar-beam":         { file: "grass/solar-beam-sheet.png",       source: "pokemonAutoChess" },
  "atk-petal-dance":        { file: "grass/petal-dance-sheet.png",      source: "pokemonAutoChess" },
  "atk-leech-life":         { file: "grass/leech-life-sheet.png",       source: "pokemonAutoChess" },
  "atk-magical-leaf":       { file: "grass/magical-leaf-sheet.png",     source: "pokemonAutoChess" },
  "atk-ingrain":            { file: "grass/ingrain-sheet.png",          source: "pokemonAutoChess" },
  "atk-petal-blizzard":     { file: "grass/petal-blizzard-sheet.png",   source: "pokemonAutoChess" },
  "atk-power-whip":         { file: "grass/power-whip-sheet.png",       source: "pokemonAutoChess" },
  "atk-seed-flare":         { file: "grass/seed-flare-sheet.png",       source: "pokemonAutoChess" },
  "atk-solar-blade":        { file: "grass/solar-blade-sheet.png",      source: "pokemonAutoChess" },
  "atk-grass-melee":        { file: "grass/grass-melee-sheet.png",      source: "pokemonAutoChess" },
  // Poison
  "atk-smog":               { file: "poison/smog-sheet.png",            source: "pokemonAutoChess" },
  "atk-acid-spray":         { file: "poison/acid-spray-sheet.png",      source: "pokemonAutoChess" },
  "atk-sludge-wave":        { file: "poison/sludge-wave-sheet.png",     source: "pokemonAutoChess" },
  "atk-poison-melee":       { file: "poison/poison-melee-sheet.png",    source: "pokemonAutoChess" },
}

// ── Starter configs ──────────────────────────────────────────────────
interface StarterShowcaseConfig {
  readonly key: string
  readonly label: string
  readonly color: number
  readonly forms: readonly PokemonFormConfig[]
  readonly formNames: readonly string[]
  readonly formSprites: Readonly<Record<PokemonForm, string>>
}

const STARTER_CONFIGS: readonly StarterShowcaseConfig[] = [
  {
    key: "charmander",
    label: "CHARMANDER LINE",
    color: 0xff6600,
    forms: CHARMANDER_FORMS,
    formNames: ["Charmander", "Charmeleon", "Charizard"],
    formSprites: {
      base: "charmander-walk",
      stage1: "charmeleon-walk",
      stage2: "charizard-walk",
    },
  },
  {
    key: "squirtle",
    label: "SQUIRTLE LINE",
    color: 0x3388ff,
    forms: SQUIRTLE_FORMS,
    formNames: ["Squirtle", "Wartortle", "Blastoise"],
    formSprites: {
      base: "squirtle-walk",
      stage1: "wartortle-walk",
      stage2: "blastoise-walk",
    },
  },
  {
    key: "bulbasaur",
    label: "BULBASAUR LINE",
    color: 0x22cc44,
    forms: BULBASAUR_FORMS,
    formNames: ["Bulbasaur", "Ivysaur", "Venusaur"],
    formSprites: {
      base: "bulbasaur-walk",
      stage1: "ivysaur-walk",
      stage2: "venusaur-walk",
    },
  },
]

// ── Elementos com cores ──────────────────────────────────────────────
const ELEMENT_COLORS: Readonly<Record<string, { color: number; label: string }>> = {
  fire:    { color: 0xff6600, label: "FIRE" },
  water:   { color: 0x3388ff, label: "WATER" },
  ice:     { color: 0x88ddff, label: "ICE" },
  normal:  { color: 0xcccccc, label: "NORMAL" },
  dragon:  { color: 0x7744ff, label: "DRAGON" },
  flying:  { color: 0x88ccff, label: "FLYING" },
  grass:   { color: 0x22cc44, label: "GRASS" },
  poison:  { color: 0x9944cc, label: "POISON" },
}

// ── Attacks per starter ──────────────────────────────────────────────
const STARTER_ATTACKS: Readonly<Record<string, ReadonlySet<string>>> = {
  charmander: new Set([
    'ember', 'scratch', 'fireSpin', 'smokescreen', 'dragonBreath', 'fireFang', 'flameCharge',
    'slash', 'flamethrower', 'dragonClaw', 'airSlash', 'flareBlitz', 'hurricane', 'outrage',
    'heatWave', 'dracoMeteor',
    'inferno', 'fireBlast', 'blastBurn', 'furySwipes', 'blazeKick',
    'dragonPulse', 'nightSlash', 'aerialAce', 'flareRush', 'dragonRush',
  ]),
  squirtle: new Set([
    'waterGun', 'bubble', 'tackle', 'rapidSpin', 'withdraw', 'aquaJet',
    'waterPulse', 'hydroPump', 'aquaTail', 'whirlpool',
    'iceBeam', 'flashCannon', 'surf', 'liquidation', 'rainDance', 'hydroCannon',
    'scald', 'bubbleBeam', 'bodySlam', 'gyroBall', 'waterfall',
    'originPulse', 'muddyWater', 'crabhammer', 'waterSpout', 'blizzard',
  ]),
  bulbasaur: new Set([
    'vineWhip', 'razorLeaf', 'leechSeed', 'growl', 'poisonPowder2',
    'sleepPowder', 'stunSpore', 'leafBlade', 'sludgeBomb',
    'solarBeam', 'petalDance', 'gigaDrain', 'energyBall', 'frenzyPlant', 'petalBlizzard',
    'powerWhip', 'leafStorm', 'seedBomb', 'bodySlam2', 'toxic',
    'spore', 'solarBlade', 'sludgeWave2', 'hyperBeam2', 'floraBurst',
  ]),
}

export class ShowcaseScene extends Phaser.Scene {
  private contentHeight = 0
  private activeTimers: Phaser.Time.TimerEvent[] = []
  private activeStarter = 0
  private activeElements: Set<string> = new Set(Object.keys(ELEMENT_COLORS))

  constructor() {
    super({ key: "ShowcaseScene" })
  }

  create(): void {
    this.rebuild()
  }

  private rebuild(): void {
    this.cleanupTimers()
    this.children.removeAll(true)
    this.tweens.killAll()

    const { width } = this.cameras.main
    this.activeTimers = []

    // Background
    this.add.rectangle(width / 2, 5000, width, 10000, BG_COLOR).setDepth(0)

    let y = 30

    // ── Starter Tabs ─────────────────────────────────────────────────
    y = this.addStarterTabs(y)

    // ── Element Filters ──────────────────────────────────────────────
    y = this.addElementFilters(y)

    const starter = STARTER_CONFIGS[this.activeStarter]
    const starterAttacks = STARTER_ATTACKS[starter.key] ?? new Set()

    // ══ FORMAS ══════════════════════════════════════════════════════
    y = this.addSectionHeader(y, `FORMAS - ${starter.label}`)
    y = this.addFormsSection(y, starter)

    // ══ ATAQUES por forma ═══════════════════════════════════════════
    const formLabels: Record<PokemonForm, string> = {
      base: starter.formNames[0],
      stage1: starter.formNames[1],
      stage2: starter.formNames[2],
    }

    for (const form of ["base", "stage1", "stage2"] as PokemonForm[]) {
      const attacks = this.getAttacksForForm(form, starterAttacks)
      if (attacks.length === 0) continue

      y = this.addSectionHeader(y, `ATAQUES ${formLabels[form].toUpperCase()} (${form})`)
      for (const key of attacks) {
        y = this.addAttackRow(y, key as AttackType, form, starter)
      }
    }

    // ══ EVOLUÇÕES DE ARMA ═══════════════════════════════════════════
    const evoList = EVOLUTIONS.filter(e => starterAttacks.has(e.evolvedAttack))
    if (evoList.length > 0) {
      y = this.addSectionHeader(y, "EVOLUCOES DE ARMA")
      y = this.addEvolutionsSection(y, starter, evoList)
    }

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
  }

  // ── Starter Tabs ──────────────────────────────────────────────────────
  private addStarterTabs(y: number): number {
    const { width } = this.cameras.main
    const tabWidth = 180
    const gap = 20
    const totalWidth = STARTER_CONFIGS.length * tabWidth + (STARTER_CONFIGS.length - 1) * gap
    const startX = (width - totalWidth) / 2

    for (let i = 0; i < STARTER_CONFIGS.length; i++) {
      const cfg = STARTER_CONFIGS[i]
      const tx = startX + i * (tabWidth + gap)
      const isActive = i === this.activeStarter

      const bg = this.add.graphics()
      bg.fillStyle(cfg.color, isActive ? 0.3 : 0.08)
      bg.fillRoundedRect(tx, y, tabWidth, 30, 6)
      bg.lineStyle(2, cfg.color, isActive ? 0.8 : 0.3)
      bg.strokeRoundedRect(tx, y, tabWidth, 30, 6)

      const label = this.add
        .text(tx + tabWidth / 2, y + 15, cfg.label, {
          fontSize: "12px",
          color: isActive
            ? Phaser.Display.Color.IntegerToColor(cfg.color).rgba
            : "#555555",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5)

      // Hitbox interativa sobre a tab
      const hitzone = this.add.zone(tx + tabWidth / 2, y + 15, tabWidth, 30)
        .setInteractive({ useHandCursor: true })

      hitzone.on("pointerdown", () => {
        if (this.activeStarter === i) return
        this.activeStarter = i
        SoundManager.playClick()
        this.rebuild()
      })

      // Hover
      const idx = i
      hitzone.on("pointerover", () => {
        if (idx !== this.activeStarter) label.setColor("#aaaaaa")
      })
      hitzone.on("pointerout", () => {
        if (idx !== this.activeStarter) label.setColor("#555555")
      })
    }

    return y + 45
  }

  // ── Element Filters ───────────────────────────────────────────────────
  private addElementFilters(y: number): number {
    const { width } = this.cameras.main
    const elements = Object.keys(ELEMENT_COLORS)
    const btnWidth = 70
    const gap = 8
    const totalWidth = elements.length * btnWidth + (elements.length - 1) * gap
    const startX = (width - totalWidth) / 2

    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i]
      const cfg = ELEMENT_COLORS[elem]
      const bx = startX + i * (btnWidth + gap)
      const isActive = this.activeElements.has(elem)

      const bg = this.add.graphics()
      bg.fillStyle(cfg.color, isActive ? 0.25 : 0.05)
      bg.fillRoundedRect(bx, y, btnWidth, 22, 4)
      bg.lineStyle(1, cfg.color, isActive ? 0.7 : 0.2)
      bg.strokeRoundedRect(bx, y, btnWidth, 22, 4)

      this.add
        .text(bx + btnWidth / 2, y + 11, cfg.label, {
          fontSize: "9px",
          color: isActive
            ? Phaser.Display.Color.IntegerToColor(cfg.color).rgba
            : "#444444",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5)

      const hitzone = this.add.zone(bx + btnWidth / 2, y + 11, btnWidth, 22)
        .setInteractive({ useHandCursor: true })

      hitzone.on("pointerdown", () => {
        if (this.activeElements.has(elem)) {
          this.activeElements.delete(elem)
        } else {
          this.activeElements.add(elem)
        }
        SoundManager.playClick()
        this.rebuild()
      })
    }

    return y + 35
  }

  // ── Seções ────────────────────────────────────────────────────────────

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

  private addFormsSection(y: number, starter: StarterShowcaseConfig): number {
    const formSpacing = 200
    const { width } = this.cameras.main
    const startX = width / 2 - formSpacing

    for (let i = 0; i < starter.forms.length; i++) {
      const form = starter.forms[i]
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

      if (i < starter.forms.length - 1) {
        this.add
          .text(fx + formSpacing / 2, y + 30, "\u2192", {
            fontSize: "24px",
            color: "#ffcc00",
            fontFamily: "monospace",
          })
          .setOrigin(0.5)
      }
    }

    return y + 110
  }

  private getAttacksForForm(formFilter: PokemonForm, starterAttacks: ReadonlySet<string>): string[] {
    return Object.keys(ATTACKS).filter((k) => {
      const atk = ATTACKS[k]
      if (atk.minForm !== formFilter) return false
      if (!starterAttacks.has(k)) return false
      if (!this.activeElements.has(atk.element)) return false
      const isEvolved = EVOLUTIONS.some((e) => e.evolvedAttack === k)
      return !isEvolved
    })
  }

  private addAttackRow(
    y: number,
    attackKey: AttackType,
    form: PokemonForm,
    starter: StarterShowcaseConfig,
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

    const rowBg = this.add.graphics()
    rowBg.fillStyle(0xffffff, 0.02)
    rowBg.fillRect(
      0,
      y - ROW_HEIGHT / 2 + 5,
      this.cameras.main.width,
      ROW_HEIGHT - 10,
    )

    this.add
      .text(LABEL_X, y - 10, atk.name, {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)

    // Category badge
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

    this.add
      .text(LABEL_X + 85, y + 11, atk.description, {
        fontSize: "8px",
        color: "#666666",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5)

    // Pokemon sprite
    const pokeSpriteKey = starter.formSprites[form]
    const pokeAnimKey = `${pokeSpriteKey}-right`
    const poke = this.add.sprite(POKEMON_X, y, pokeSpriteKey)
    poke.setScale(1.8)
    if (this.anims.exists(pokeAnimKey)) {
      poke.play(pokeAnimKey)
    }

    // Demo
    this.addAttackDemo(DEMO_START_X, y, attackKey)

    // Stats
    const dmgText = `DMG ${atk.baseDamage}`
    const cdText = `CD ${(atk.baseCooldown / 1000).toFixed(1)}s`
    const elemText = atk.element.toUpperCase()

    const elemCfg = ELEMENT_COLORS[atk.element]
    const elemColorStr = elemCfg
      ? Phaser.Display.Color.IntegerToColor(elemCfg.color).rgba
      : "#888888"

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
        color: elemColorStr,
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
      // ── Charmander line ─────────────────────────────────────────────
      ember: { atkKey: "atk-ember", animKey: "anim-ember" },
      inferno: { atkKey: "atk-ember", animKey: "anim-ember" },
      fireSpin: { atkKey: "atk-fire-range", animKey: "anim-fire-range" },
      fireBlast: { atkKey: "atk-fire-blast", animKey: "anim-fire-blast" },
      flamethrower: { atkKey: "atk-flamethrower", animKey: "anim-flamethrower" },
      blastBurn: { atkKey: "atk-blast-burn", animKey: "anim-blast-burn" },
      dragonBreath: { atkKey: "atk-dragon-breath", animKey: "anim-dragon-breath" },
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
      flameCharge: { atkKey: "atk-flame-charge-down", animKey: "anim-flame-charge-down" },
      dragonClaw: { atkKey: "atk-dragon-claw", animKey: "anim-dragon-claw" },
      flareBlitz: { atkKey: "atk-flare-blitz", animKey: "anim-flare-blitz" },
      nightSlash: { atkKey: "atk-night-slash", animKey: "anim-night-slash" },
      furySwipes: { atkKey: "atk-fury-swipes", animKey: "anim-fury-swipes" },
      blazeKick: { atkKey: "atk-blaze-kick", animKey: "anim-blaze-kick" },
      flareRush: { atkKey: "atk-flame-charge-down", animKey: "anim-flame-charge-down" },
      dragonRush: { atkKey: "atk-dragon-rush", animKey: "anim-dragon-rush" },
      smokescreen: { atkKey: "atk-smokescreen", animKey: "anim-smokescreen" },
      // ── Squirtle line ───────────────────────────────────────────────
      waterGun: { atkKey: "atk-wave-splash", animKey: "anim-wave-splash" },
      bubble: { atkKey: "atk-bubble-shot", animKey: "anim-bubble-shot-full" },
      rapidSpin: { atkKey: "atk-rapid-spin", animKey: "anim-rapid-spin" },
      withdraw: { atkKey: "atk-whirlpool-rings", animKey: "anim-whirlpool-rings" },
      aquaJet: { atkKey: "atk-aqua-jet-right", animKey: "anim-aqua-jet-right" },
      waterPulse: { atkKey: "atk-water-pulse", animKey: "anim-water-pulse-full" },
      hydroPump: { atkKey: "atk-hydro-pump", animKey: "anim-hydro-pump" },
      aquaTail: { atkKey: "atk-aqua-tail-right", animKey: "anim-aqua-tail-right" },
      whirlpool: { atkKey: "atk-whirlpool-rings", animKey: "anim-whirlpool-rings" },
      scald: { atkKey: "atk-water-melee", animKey: "anim-water-melee" },
      bubbleBeam: { atkKey: "atk-sparkling-aria", animKey: "anim-sparkling-aria" },
      waterfall: { atkKey: "atk-aqua-jet-right", animKey: "anim-aqua-jet-right" },
      iceBeam: { atkKey: "atk-frost-breath", animKey: "anim-frost-breath" },
      flashCannon: { atkKey: "atk-water-range", animKey: "anim-water-range" },
      surf: { atkKey: "atk-surf", animKey: "anim-surf" },
      liquidation: { atkKey: "atk-liquidation", animKey: "anim-liquidation" },
      originPulse: { atkKey: "atk-origin-pulse", animKey: "anim-origin-pulse" },
      muddyWater: { atkKey: "atk-water-range", animKey: "anim-water-range" },
      crabhammer: { atkKey: "atk-aqua-tail-right", animKey: "anim-aqua-tail-right" },
      waterSpout: { atkKey: "atk-origin-pulse", animKey: "anim-origin-pulse" },
      blizzard: { atkKey: "atk-ice-range", animKey: "anim-ice-range" },
      rainDance: { atkKey: "atk-water-range", animKey: "anim-water-range" },
      hydroCannon: { atkKey: "atk-origin-pulse", animKey: "anim-origin-pulse" },
      // ── Bulbasaur line ────────────────────────────────────────────────
      vineWhip: { atkKey: "atk-vine-whip", animKey: "anim-vine-whip" },
      razorLeaf: { atkKey: "atk-razor-leaf", animKey: "anim-razor-leaf" },
      leechSeed: { atkKey: "atk-leech-seed", animKey: "anim-leech-seed" },
      growl: { atkKey: "atk-cotton-spore", animKey: "anim-cotton-spore" },
      poisonPowder2: { atkKey: "atk-smog", animKey: "anim-smog" },
      sleepPowder: { atkKey: "atk-cotton-spore", animKey: "anim-cotton-spore" },
      stunSpore: { atkKey: "atk-stun-spore", animKey: "anim-stun-spore" },
      leafBlade: { atkKey: "atk-leaf-blade", animKey: "anim-leaf-blade" },
      sludgeBomb: { atkKey: "atk-poison-melee", animKey: "anim-poison-melee" },
      solarBeam: { atkKey: "atk-solar-beam", animKey: "anim-solar-beam" },
      petalDance: { atkKey: "atk-petal-dance", animKey: "anim-petal-dance" },
      gigaDrain: { atkKey: "atk-leech-life", animKey: "anim-leech-life" },
      energyBall: { atkKey: "atk-magical-leaf", animKey: "anim-magical-leaf" },
      frenzyPlant: { atkKey: "atk-ingrain", animKey: "anim-ingrain" },
      petalBlizzard: { atkKey: "atk-petal-blizzard", animKey: "anim-petal-blizzard" },
      powerWhip: { atkKey: "atk-power-whip", animKey: "anim-power-whip" },
      leafStorm: { atkKey: "atk-razor-leaf", animKey: "anim-razor-leaf" },
      seedBomb: { atkKey: "atk-seed-flare", animKey: "anim-seed-flare" },
      bodySlam2: { atkKey: "atk-grass-melee", animKey: "anim-grass-melee" },
      toxic: { atkKey: "atk-acid-spray", animKey: "anim-acid-spray" },
      spore: { atkKey: "atk-cotton-spore", animKey: "anim-cotton-spore" },
      solarBlade: { atkKey: "atk-solar-blade", animKey: "anim-solar-blade" },
      sludgeWave2: { atkKey: "atk-sludge-wave", animKey: "anim-sludge-wave" },
      hyperBeam2: { atkKey: "atk-solar-beam", animKey: "anim-solar-beam" },
      floraBurst: { atkKey: "atk-seed-flare", animKey: "anim-seed-flare" },
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

    // Sprite fixo com animação looping in-place
    const demoCenterX = (DEMO_START_X + DEMO_END_X) / 2
    const spr = this.add.sprite(demoCenterX, y, mapping.atkKey)
    spr.setScale(scale)

    if (this.anims.exists(mapping.animKey)) {
      spr.play({ key: mapping.animKey, repeat: -1 })
    }

    // File info abaixo do sprite
    const fileInfo = SPRITE_FILE_INFO[mapping.atkKey]
    if (fileInfo) {
      this.add
        .text(demoCenterX, y + 28, fileInfo.file, {
          fontSize: "7px",
          color: "#444444",
          fontFamily: "monospace",
        })
        .setOrigin(0.5, 0)

      const srcColor = fileInfo.source === "Tibia" ? "#886644"
        : fileInfo.source === "procedural" ? "#448844"
        : "#445588"
      this.add
        .text(demoCenterX, y + 38, fileInfo.source, {
          fontSize: "7px",
          color: srcColor,
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
    }
  }

  private addEvolutionsSection(
    y: number,
    starter: StarterShowcaseConfig,
    evoList: readonly typeof EVOLUTIONS[number][],
  ): number {
    for (const evo of evoList) {
      const baseAtk = ATTACKS[evo.baseAttack]
      const evoAtk = ATTACKS[evo.evolvedAttack]
      if (!baseAtk || !evoAtk) continue
      if (!this.activeElements.has(evoAtk.element)) continue

      const rowBg = this.add.graphics()
      rowBg.fillStyle(0xffffff, 0.02)
      rowBg.fillRect(
        0,
        y - ROW_HEIGHT / 2 + 5,
        this.cameras.main.width,
        ROW_HEIGHT - 10,
      )

      this.add
        .text(LABEL_X, y - 10, `${baseAtk.name}  \u2192  ${evoAtk.name}`, {
          fontSize: "12px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)

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

      const pokeSpriteKey = starter.formSprites[evo.requiredForm]
      const pokeAnimKey = `${pokeSpriteKey}-right`
      const poke = this.add.sprite(POKEMON_X, y, pokeSpriteKey)
      poke.setScale(1.8)
      if (this.anims.exists(pokeAnimKey)) {
        poke.play(pokeAnimKey)
      }

      this.addAttackDemo(DEMO_START_X, y, evo.evolvedAttack)

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
