import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const GEODUDE: EnemyConfig = {
  key: "geodude",
  name: "Geodude",
  sprite: SPRITES.geodude,
  hp: 50,
  speed: 35,
  damage: 15,
  xpValue: 10,
  scale: 1.0,
  rangedAttack: {
    projectileKey: "atk-rock-throw",
    damage: 12,
    speed: 100,
    cooldownMs: 5000,
    range: 280,
    homing: false,
    projectileScale: 1, // 16x16 * 3.5 = 56x56 visível
  },
}
