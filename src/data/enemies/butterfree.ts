import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const BUTTERFREE: EnemyConfig = {
  key: "butterfree",
  name: "Butterfree",
  sprite: SPRITES.butterfree,
  hp: 70,
  speed: 35,    // Lenta (era 58)
  damage: 10,
  xpValue: 60,
  scale: 1.0,
  behavior: 'healer',
  contactEffect: { type: 'slow', durationMs: 2000, multiplier: 0.6 },
}
