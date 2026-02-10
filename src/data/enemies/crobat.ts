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
  behavior: 'dasher',
  contactEffect: { type: 'poison', durationMs: 3000, dps: 2 },
}
