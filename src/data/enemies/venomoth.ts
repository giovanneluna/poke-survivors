import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const VENOMOTH: EnemyConfig = {
  key: "venomoth",
  name: "Venomoth",
  sprite: SPRITES.venomoth,
  hp: 80,
  speed: 72,
  damage: 12,
  xpValue: 60,
  scale: 1.0,
  behavior: 'confuser',
  contactEffect: { type: 'confusion', durationMs: 2000 },
}
