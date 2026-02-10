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
  rangedAttack: {
    projectileKey: "atk-psybeam",
    damage: 12,
    speed: 72,
    cooldownMs: 2940,
    range: 350,
    homing: false,
    projectileScale: 0.5,
    effect: "confusion",
    effectDurationMs: 3000,
    beam: true,
    beamLength: 200,
  },
}
