import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const ELECTRODE: EnemyConfig = {
  key: "electrode",
  name: "Electrode",
  sprite: SPRITES.electrode,
  hp: 60,
  speed: 80,
  damage: 15,
  xpValue: 90,
  scale: 1.0,
  deathExplosion: {
    damage: 20,
    radius: 80,
  },
}
