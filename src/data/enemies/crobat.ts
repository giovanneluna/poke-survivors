import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const CROBAT: EnemyConfig = {
  key: "crobat",
  name: "Crobat",
  sprite: SPRITES.crobat,
  hp: 100,
  speed: 120,
  damage: 16,
  xpValue: 80,
  scale: 0.9,
  rangedAttack: {
    projectileKey: "atk-air-slash",
    damage: 12,
    speed: 160,
    cooldownMs: 2500,
    range: 320,
    homing: false,
    projectileScale: 3,
  },
}
