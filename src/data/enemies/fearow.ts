import type { BossConfig } from "../../types"
import { SPRITES } from "../sprites"

export const FEAROW: BossConfig = {
  key: "fearow",
  name: "Fearow",
  sprite: SPRITES.fearow,
  hp: 3000,
  speed: 80,
  damage: 30,
  xpValue: 180,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: "Air Slash",
    pattern: "fan",
    damage: 25,
    cooldownMs: 2500,
    projectileCount: 5,
    spriteKey: "atk-air-slash",
    animKey: "anim-air-slash",
    spriteScale: 1.8,
    tintColor: 0x88ddff,
  },
}
