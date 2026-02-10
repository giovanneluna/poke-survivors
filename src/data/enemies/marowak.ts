import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const MAROWAK: EnemyConfig = {
  key: "marowak",
  name: "Marowak",
  sprite: SPRITES.marowak,
  hp: 300,      // +50% (era 200)
  speed: 23,    // 50% (era 45)
  damage: 28,
  xpValue: 80,
  scale: 1.4,
  behavior: 'tank',
  contactEffect: { type: 'stun', durationMs: 500 },
}
