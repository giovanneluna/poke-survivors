import type { BossConfig } from "../../types"
import { SPRITES } from "../sprites"

export const RATICATE: BossConfig = {
  key: "raticate",
  name: "Raticate",
  sprite: SPRITES.raticate,
  hp: 1500,
  speed: 70,
  damage: 50,
  xpValue: 160,
  scale: 1.9,
  isBoss: true,
  bossAttack: {
    name: "Hyper Fang",
    pattern: "charge",
    damage: 70,
    cooldownMs: 3500,
    range: 450,
  },
}
