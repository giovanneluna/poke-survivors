import Phaser from "phaser"
import { SoundManager } from "../audio/SoundManager"
import { getCoins, initSaveSystem } from "../systems/SaveSystem"
import { fontSize, scaled } from "../utils/ui-scale"

export class TitleScene extends Phaser.Scene {
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

    // ── Versão ───────────────────────────────────────────────────────
    const versionBadge = this.add.graphics().setDepth(10)
    const badgeW = scaled(90)
    const badgeH = scaled(20)
    const badgeX = width / 2 - badgeW / 2
    const badgeY = height - 38
    versionBadge.fillStyle(0xff6600, 0.25)
    versionBadge.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 5)
    versionBadge.lineStyle(1, 0xff6600, 0.6)
    versionBadge.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 5)

    const versionText = this.add
      .text(width / 2, badgeY + badgeH / 2, "BETA 0.30", {
        fontSize: fontSize(11),
        color: "#ff8844",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.tweens.add({
      targets: versionText,
      alpha: 0.6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
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
      window.open("https://github.com/giovanneluna", "_blank")
    })

    // ── Fade in ──────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0)
  }

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
