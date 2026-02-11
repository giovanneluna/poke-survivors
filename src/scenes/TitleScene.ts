import Phaser from "phaser"
import { SoundManager } from "../audio/SoundManager"
import { getCoins, initSaveSystem } from "../systems/SaveSystem"
import { fontSize, scaled } from "../utils/ui-scale"
import { CHANGELOG, CURRENT_VERSION } from "../data/changelog"
import type { ChangeTag } from "../data/changelog"

const CL_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${parseInt(d, 10)} ${CL_MONTHS[parseInt(m, 10) - 1]} ${y}`
}

const TAG_COLORS: Record<ChangeTag, string> = {
  NEW: "#44ff88",
  FIX: "#44aaff",
  BALANCE: "#ffaa44",
  REMOVE: "#ff4444",
}

export class TitleScene extends Phaser.Scene {
  private clOverlay: Phaser.GameObjects.GameObject[] = []
  private clContainer: Phaser.GameObjects.Container | undefined
  private clContentTop = 0
  private clScrollOffset = 0
  private clMaxScroll = 0

  constructor() {
    super({ key: "TitleScene" })
  }

  create(): void {
    const { width, height } = this.cameras.main

    // ── Background gradiente escuro ──────────────────────────────────
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e)
    bg.fillRect(0, 0, width, height)
    bg.fillStyle(0x16213e, 0.8)
    bg.fillRect(0, height * 0.6, width, height * 0.4)
    bg.lineStyle(2, 0xff6600, 0.3)
    bg.lineBetween(0, height * 0.6, width, height * 0.6)

    // ── Estrelas no fundo ────────────────────────────────────────────
    const starGraphics = this.add.graphics()
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, width)
      const sy = Phaser.Math.Between(0, height * 0.6)
      const size = Phaser.Math.FloatBetween(0.5, 1.5)
      const alpha = Phaser.Math.FloatBetween(0.2, 0.7)
      starGraphics.fillStyle(0xffffff, alpha)
      starGraphics.fillCircle(sx, sy, size)
    }
    this.tweens.add({
      targets: starGraphics,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    })

    // ── Pokéball decorativa no fundo ─────────────────────────────────
    this.drawPokeball(width / 2, height * 0.45, 130, 0.05)

    // ── Partículas de fogo flutuantes ────────────────────────────────
    this.add
      .particles(0, 0, "fire-particle", {
        x: { min: 0, max: width },
        y: height + 10,
        speedY: { min: -40, max: -80 },
        speedX: { min: -15, max: 15 },
        lifespan: { min: 3000, max: 6000 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0xff6600, 0xff4400, 0xffaa00, 0xff8800],
        quantity: 1,
        frequency: 300,
      })
      .setDepth(1)

    // ── Título: "POKÉ WORLD" ─────────────────────────────────────────
    const titleLine1 = this.add
      .text(width / 2, 55, "POKÉ WORLD", {
        fontSize: fontSize(42),
        color: "#ffcc00",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#8B6914",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.tweens.add({
      targets: titleLine1,
      alpha: 0.85,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    })

    // ── Subtítulo: "SURVIVORS" ────────────────────────────────────────
    const titleLine2 = this.add
      .text(width / 2, 100, "SURVIVORS", {
        fontSize: fontSize(52),
        color: "#ff6600",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.tweens.add({
      targets: titleLine2,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    })

    // ── Artwork dos 3 Starters ───────────────────────────────────────
    const artY = height * 0.42
    const artScale = 0.22 * (scaled(100) / 100)

    // Bulbasaur (esquerda, trás)
    const bulba = this.add.image(
      width / 2 - scaled(120),
      artY + 10,
      "art-bulbasaur",
    )
    bulba
      .setScale(artScale * 0.85)
      .setDepth(8)
      .setAlpha(0.9)
    this.tweens.add({
      targets: bulba,
      y: bulba.y - 4,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    })

    // Squirtle (direita, trás)
    const squirtle = this.add.image(
      width / 2 + scaled(120),
      artY + 10,
      "art-squirtle",
    )
    squirtle
      .setScale(artScale * 0.85)
      .setDepth(8)
      .setAlpha(0.9)
    this.tweens.add({
      targets: squirtle,
      y: squirtle.y - 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
      delay: 200,
    })

    // Charmander (centro, frente - destaque)
    const charArt = this.add.image(width / 2, artY - 10, "art-charmander")
    charArt.setScale(artScale).setDepth(9)
    this.tweens.add({
      targets: charArt,
      y: charArt.y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    })

    // ── Shards flutuantes abaixo da arte ─────────────────────────────
    const shardTextures = [
      "shard-fire",
      "shard-water",
      "shard-grass",
      "shard-gold",
    ]
    const shardY = artY + scaled(65)

    for (let i = 0; i < 12; i++) {
      const tex = shardTextures[i % shardTextures.length]
      const sx = width / 2 + Phaser.Math.Between(-scaled(180), scaled(180))
      const sy = shardY + Phaser.Math.Between(-10, 20)
      const shard = this.add
        .image(sx, sy, tex)
        .setScale(Phaser.Math.FloatBetween(1.0, 2.0) * (scaled(100) / 100))
        .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7))
        .setAngle(Phaser.Math.Between(-30, 30))
        .setDepth(7)

      this.tweens.add({
        targets: shard,
        y: shard.y - Phaser.Math.Between(5, 15),
        alpha: shard.alpha * 0.5,
        angle: shard.angle + Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
        delay: Phaser.Math.Between(0, 1000),
      })
    }

    // ── Tipo badge ───────────────────────────────────────────────────
    this.add
      .text(width / 2, 133, "🔥 FIRE RED EDITION 🔥", {
        fontSize: fontSize(11),
        color: "#ff8844",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(10)

    // ── Botão "ENTRAR AGORA" ─────────────────────────────────────────
    const btnY = height * 0.78
    const btnWidth = scaled(220)
    const btnHeight = scaled(50)

    const btnBg = this.add.graphics().setDepth(10)
    this.drawButton(
      btnBg,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      0xff6600,
      false,
    )

    const btnText = this.add
      .text(width / 2, btnY, "▶  ENTRAR AGORA", {
        fontSize: fontSize(18),
        color: "#ffffff",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(11)

    this.tweens.add({
      targets: [btnText],
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    })

    const btnHitbox = this.add
      .rectangle(width / 2, btnY, btnWidth, btnHeight, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12)

    btnHitbox.on("pointerover", () => {
      this.drawButton(
        btnBg,
        width / 2,
        btnY,
        btnWidth,
        btnHeight,
        0xff8800,
        true,
      )
      btnText.setColor("#ffcc00")
      SoundManager.playHover()
    })
    btnHitbox.on("pointerout", () => {
      this.drawButton(
        btnBg,
        width / 2,
        btnY,
        btnWidth,
        btnHeight,
        0xff6600,
        false,
      )
      btnText.setColor("#ffffff")
    })
    btnHitbox.on("pointerdown", () => {
      SoundManager.playStart()
      this.cameras.main.fade(
        400,
        0,
        0,
        0,
        false,
        (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
          if (progress >= 1) {
            this.scene.start("SelectScene")
          }
        },
      )
    })

    // ── Botões MELHORIAS + POKÉDEX + ESTATÍSTICAS ──────────────────
    const secBtnW = scaled(120)
    const secBtnH = scaled(32)
    const secBtnY = btnY + scaled(50)
    const secGap = scaled(8)

    const createSecBtn = (
      x: number,
      label: string,
      color: number,
      hoverColor: number,
      textColor: string,
      targetScene: string,
    ): void => {
      const gfx = this.add.graphics().setDepth(10)
      const draw = (hover: boolean): void => {
        gfx.clear()
        gfx.fillStyle(0x000000, 0.4)
        gfx.fillRoundedRect(
          x - secBtnW / 2 + 2,
          secBtnY - secBtnH / 2 + 3,
          secBtnW,
          secBtnH,
          8,
        )
        gfx.fillStyle(hover ? hoverColor : color, 0.95)
        gfx.fillRoundedRect(
          x - secBtnW / 2,
          secBtnY - secBtnH / 2,
          secBtnW,
          secBtnH,
          8,
        )
        gfx.lineStyle(2, hover ? 0x8888aa : 0x555577)
        gfx.strokeRoundedRect(
          x - secBtnW / 2,
          secBtnY - secBtnH / 2,
          secBtnW,
          secBtnH,
          8,
        )
      }
      draw(false)
      const txt = this.add
        .text(x, secBtnY, label, {
          fontSize: fontSize(10),
          color: textColor,
          fontFamily: "monospace",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(11)
      const hit = this.add
        .rectangle(x, secBtnY, secBtnW, secBtnH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(12)
      hit.on("pointerover", () => {
        draw(true)
        txt.setColor("#ffcc00")
        SoundManager.playHover()
      })
      hit.on("pointerout", () => {
        draw(false)
        txt.setColor(textColor)
      })
      hit.on("pointerdown", () => {
        SoundManager.playClick()
        this.scene.start(targetScene)
      })
    }

    const secCount = 4
    const secTotalW = secCount * secBtnW + (secCount - 1) * secGap
    const secStartX = width / 2 - secTotalW / 2 + secBtnW / 2
    createSecBtn(
      secStartX,
      "MELHORIAS",
      0x1a1a44,
      0x2a2a55,
      "#aaaaff",
      "PowerUpScene",
    )
    createSecBtn(
      secStartX + secBtnW + secGap,
      "POKÉDEX",
      0x2a1122,
      0x442244,
      "#ff6688",
      "PokedexScene",
    )
    createSecBtn(
      secStartX + 2 * (secBtnW + secGap),
      "ESTATÍSTICAS",
      0x112233,
      0x223344,
      "#66aaff",
      "StatsScene",
    )
    createSecBtn(
      secStartX + 3 * (secBtnW + secGap),
      "SAVE DATA",
      0x1a2a1a,
      0x2a3a2a,
      "#88cc88",
      "SaveScene",
    )

    // ── Coin counter ────────────────────────────────────────────────
    initSaveSystem()
    const coins = getCoins()
    if (coins > 0) {
      this.add
        .text(width - 15, 15, `₽ ${coins}`, {
          fontSize: fontSize(14),
          color: "#ffd700",
          fontFamily: "monospace",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(1, 0.5)
        .setDepth(10)
    }

    // ── Botão Download (só na versão web) ────────────────────────────
    const isTauri = "__TAURI_INTERNALS__" in window
    if (!isTauri) {
      const dlBtnW = scaled(140)
      const dlBtnH = scaled(30)
      const dlX = width - dlBtnW / 2 - scaled(10)
      const dlY = coins > 0 ? scaled(40) : scaled(18)

      const dlGfx = this.add.graphics().setDepth(10)
      const drawDl = (hover: boolean): void => {
        dlGfx.clear()
        dlGfx.fillStyle(0x000000, 0.4)
        dlGfx.fillRoundedRect(
          dlX - dlBtnW / 2 + 2,
          dlY - dlBtnH / 2 + 2,
          dlBtnW,
          dlBtnH,
          6,
        )
        dlGfx.fillStyle(hover ? 0x335533 : 0x223322, 0.95)
        dlGfx.fillRoundedRect(
          dlX - dlBtnW / 2,
          dlY - dlBtnH / 2,
          dlBtnW,
          dlBtnH,
          6,
        )
        dlGfx.lineStyle(1, hover ? 0x66dd66 : 0x44aa44, 0.8)
        dlGfx.strokeRoundedRect(
          dlX - dlBtnW / 2,
          dlY - dlBtnH / 2,
          dlBtnW,
          dlBtnH,
          6,
        )
      }
      drawDl(false)

      const dlText = this.add
        .text(dlX, dlY, "DOWNLOAD", {
          fontSize: fontSize(11),
          color: "#66dd66",
          fontFamily: "monospace",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(11)

      const dlHit = this.add
        .rectangle(dlX, dlY, dlBtnW, dlBtnH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(12)

      dlHit.on("pointerover", () => {
        drawDl(true)
        dlText.setColor("#aaffaa")
        SoundManager.playHover()
      })
      dlHit.on("pointerout", () => {
        drawDl(false)
        dlText.setColor("#66dd66")
      })
      dlHit.on("pointerdown", () => {
        SoundManager.playClick()
        window.open(
          "https://github.com/giovanneluna/poke-survivors/releases/latest",
          "_blank",
        )
      })
    }

    // ── Versão (clicável → abre changelog) ────────────────────────
    const badgeW = scaled(110)
    const badgeH = scaled(22)
    const badgeX = width / 2 - badgeW / 2
    const badgeY = height - 55

    const versionBadge = this.add.graphics().setDepth(10)
    const drawBadge = (hover: boolean): void => {
      versionBadge.clear()
      versionBadge.fillStyle(hover ? 0xff8800 : 0xff6600, hover ? 0.4 : 0.25)
      versionBadge.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 5)
      versionBadge.lineStyle(1, hover ? 0xffaa44 : 0xff6600, hover ? 0.9 : 0.6)
      versionBadge.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 5)
    }
    drawBadge(false)

    const versionText = this.add
      .text(width / 2, badgeY + badgeH / 2, `BETA ${CURRENT_VERSION} ▸`, {
        fontSize: fontSize(11),
        color: "#ff8844",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(10)

    const badgeHit = this.add
      .rectangle(width / 2, badgeY + badgeH / 2, badgeW, badgeH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12)

    badgeHit.on("pointerover", () => {
      drawBadge(true)
      versionText.setColor("#ffcc00")
      SoundManager.playHover()
    })
    badgeHit.on("pointerout", () => {
      drawBadge(false)
      versionText.setColor("#ff8844")
    })
    badgeHit.on("pointerdown", () => {
      SoundManager.playClick()
      this.showChangelog()
    })

    // ── Créditos ─────────────────────────────────────────────────────
    const credits = this.add
      .text(
        width / 2,
        height - 12,
        "Desenvolvido por Giovanne  •  github.com/giovanneluna",
        {
          fontSize: fontSize(10),
          color: "#666666",
          fontFamily: "monospace",
        },
      )
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })

    credits.on("pointerover", () => credits.setColor("#aaaaaa"))
    credits.on("pointerout", () => credits.setColor("#666666"))
    credits.on("pointerdown", () => {
      const url = "https://github.com/giovanneluna"
      import("@tauri-apps/plugin-shell")
        .then(({ open }) => open(url))
        .catch(() => window.open(url, "_blank"))
    })

    // ── Fade in ──────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0)
  }

  // ── Changelog Overlay ───────────────────────────────────────────

  private showChangelog(): void {
    if (this.clOverlay.length > 0) return
    const { width, height } = this.cameras.main

    // Backdrop
    const backdrop = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
      .setDepth(50)
      .setInteractive()
    backdrop.on("pointerdown", () => this.hideChangelog())
    this.clOverlay.push(backdrop)

    // Panel dimensions
    const pw = Math.min(width * 0.85, scaled(500))
    const ph = height * 0.8
    const px = (width - pw) / 2
    const py = (height - ph) / 2

    // Panel background
    const panel = this.add.graphics().setDepth(51)
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.fillRoundedRect(px, py, pw, ph, 12)
    panel.lineStyle(2, 0xff8844, 0.8)
    panel.strokeRoundedRect(px, py, pw, ph, 12)
    // Inner glow line
    panel.lineStyle(1, 0xff6600, 0.15)
    panel.strokeRoundedRect(px + 3, py + 3, pw - 6, ph - 6, 10)
    this.clOverlay.push(panel)

    // Panel hitbox (absorbs clicks so backdrop doesn't close)
    const panelHit = this.add
      .rectangle(width / 2, height / 2, pw, ph, 0xffffff, 0)
      .setDepth(51)
      .setInteractive()
    this.clOverlay.push(panelHit)

    // Header
    const header = this.add
      .text(width / 2, py + scaled(18), "WHAT'S NEW", {
        fontSize: fontSize(18),
        color: "#ff8844",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(52)
    this.clOverlay.push(header)

    // Separator below header
    const sepGfx = this.add.graphics().setDepth(52)
    sepGfx.lineStyle(1, 0xff6600, 0.3)
    sepGfx.lineBetween(px + scaled(15), py + scaled(40), px + pw - scaled(15), py + scaled(40))
    this.clOverlay.push(sepGfx)

    // Close button
    const closeBtn = this.add
      .text(px + pw - scaled(12), py + scaled(8), "[X]", {
        fontSize: fontSize(11),
        color: "#ff4444",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(1, 0)
      .setDepth(53)
      .setInteractive({ useHandCursor: true })
    closeBtn.on("pointerover", () => closeBtn.setColor("#ff8888"))
    closeBtn.on("pointerout", () => closeBtn.setColor("#ff4444"))
    closeBtn.on("pointerdown", () => this.hideChangelog())
    this.clOverlay.push(closeBtn)

    // Content area
    const contentTop = py + scaled(48)
    const contentH = ph - scaled(60)
    const contentW = pw - scaled(30)
    const contentX = px + scaled(15)
    this.clContentTop = contentTop

    // Container for scrollable content
    const container = this.add.container(contentX, contentTop).setDepth(52)
    this.clContainer = container

    // Build changelog entries
    let cy = 0
    for (const ver of CHANGELOG) {
      // Version header
      const verHead = this.add.text(0, cy, `▸ v${ver.version} — ${fmtDate(ver.date)}`, {
        fontSize: fontSize(12),
        color: "#ffcc00",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      container.add(verHead)
      cy += scaled(18)

      // Thin separator
      const dashCount = Math.floor(contentW / (scaled(6.5)))
      const sep = this.add.text(0, cy, "─".repeat(Math.min(dashCount, 60)), {
        fontSize: fontSize(7),
        color: "#333344",
        fontFamily: "monospace",
      })
      container.add(sep)
      cy += scaled(10)

      // Entries
      for (const entry of ver.entries) {
        const tagColor = TAG_COLORS[entry.tag]

        const tagTxt = this.add.text(scaled(2), cy, `[${entry.tag}]`, {
          fontSize: fontSize(9),
          color: tagColor,
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        container.add(tagTxt)

        const entryTxt = this.add.text(scaled(68), cy, entry.text, {
          fontSize: fontSize(9),
          color: "#cccccc",
          fontFamily: "monospace",
          wordWrap: { width: contentW - scaled(72) },
        })
        container.add(entryTxt)
        cy += Math.max(scaled(15), entryTxt.height + scaled(3))
      }

      cy += scaled(12)
    }

    // Geometry mask
    const maskShape = this.make.graphics({ x: 0, y: 0 })
    maskShape.fillRect(contentX - 2, contentTop, contentW + 4, contentH)
    const mask = maskShape.createGeometryMask()
    container.setMask(mask)
    this.clOverlay.push(container, maskShape)

    // Scroll state
    this.clScrollOffset = 0
    this.clMaxScroll = Math.max(0, cy - contentH)

    // Scroll hint if content overflows
    if (this.clMaxScroll > 0) {
      const hint = this.add
        .text(width / 2, py + ph - scaled(12), "▼ scroll ▼", {
          fontSize: fontSize(8),
          color: "#666666",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setDepth(52)
      this.clOverlay.push(hint)
    }

    // Mouse wheel handler
    this.input.on("wheel", this.onClWheel, this)

    // Keyboard: ESC to close, UP/DOWN to scroll
    this.input.keyboard?.on("keydown-ESC", this.onClEsc, this)
    this.input.keyboard?.on("keydown-UP", this.onClUp, this)
    this.input.keyboard?.on("keydown-DOWN", this.onClDown, this)
  }

  private hideChangelog(): void {
    for (const obj of this.clOverlay) {
      obj.destroy()
    }
    this.clOverlay = []
    this.clContainer = undefined
    this.clScrollOffset = 0

    this.input.off("wheel", this.onClWheel, this)
    this.input.keyboard?.off("keydown-ESC", this.onClEsc, this)
    this.input.keyboard?.off("keydown-UP", this.onClUp, this)
    this.input.keyboard?.off("keydown-DOWN", this.onClDown, this)
  }

  private onClWheel = (
    _p: Phaser.Input.Pointer,
    _g: Phaser.GameObjects.GameObject[],
    _dx: number,
    dy: number,
  ): void => {
    this.clScrollTo(this.clScrollOffset + dy * 0.5)
  }

  private onClEsc = (): void => {
    this.hideChangelog()
  }

  private onClUp = (): void => {
    this.clScrollTo(this.clScrollOffset - scaled(30))
  }

  private onClDown = (): void => {
    this.clScrollTo(this.clScrollOffset + scaled(30))
  }

  private clScrollTo(offset: number): void {
    this.clScrollOffset = Phaser.Math.Clamp(offset, 0, this.clMaxScroll)
    if (this.clContainer) {
      this.clContainer.y = this.clContentTop - this.clScrollOffset
    }
  }

  // ── Helper methods ────────────────────────────────────────────────

  private drawPokeball(
    x: number,
    y: number,
    radius: number,
    alpha: number,
  ): void {
    const g = this.add.graphics().setDepth(0)
    g.fillStyle(0xff0000, alpha)
    g.fillCircle(x, y, radius)
    g.fillStyle(0xffffff, alpha)
    g.fillRect(x - radius, y, radius * 2, radius)
    g.fillStyle(0xffffff, alpha)
    g.fillCircle(x, y + 1, radius - 1)
    g.fillStyle(0xff0000, alpha)
    g.fillCircle(x, y - 1, radius - 1)
    g.fillStyle(0x333333, alpha * 1.5)
    g.fillRect(x - radius, y - 2, radius * 2, 4)
    g.fillStyle(0xffffff, alpha * 2)
    g.fillCircle(x, y, radius * 0.18)
    g.fillStyle(0x333333, alpha * 2)
    g.fillCircle(x, y, radius * 0.1)
  }

  private drawButton(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    hover: boolean,
  ): void {
    g.clear()
    g.fillStyle(0x000000, 0.4)
    g.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 3, w, h, 12)
    g.fillStyle(color, hover ? 1 : 0.9)
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12)
    g.lineStyle(2, hover ? 0xffcc00 : 0xcc5500)
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12)
    g.fillStyle(0xffffff, hover ? 0.2 : 0.1)
    g.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 2, w - 8, h * 0.4, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    })
  }
}
