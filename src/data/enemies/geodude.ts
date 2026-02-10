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
  behavior: 'charger',
  contactEffect: { type: 'knockback', durationMs: 0, force: 200 },
}
