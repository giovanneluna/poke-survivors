import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const MAROWAK: EnemyConfig = {
  key: "marowak",
  name: "Marowak",
  sprite: SPRITES.marowak,
  hp: 200,
  speed: 45,
  damage: 28,
  xpValue: 80,
  scale: 1.4,
  boomerang: {
    projectileKey: "atk-bonemerang-tibia",
    damage: 22,
    speed: 280,
    cooldownMs: 3500,
    range: 350,
    projectileScale: 2.5,
  },
}
