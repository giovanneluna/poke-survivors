import type { EnemyConfig } from "../../types"
import { SPRITES } from "../sprites"

export const BUTTERFREE: EnemyConfig = {
  key: "butterfree",
  name: "Butterfree",
  sprite: SPRITES.butterfree,
  hp: 70,
  speed: 58,
  damage: 10,
  xpValue: 60,
  scale: 1.0,
  rangedAttack: {
    projectileKey: "atk-psybeam",
    damage: 10,
    speed: 67,
    cooldownMs: 3150,
    range: 300,
    homing: false,
    projectileScale: 0.5,
    effect: "confusion",
    effectDurationMs: 2500,
    beam: true,
    beamLength: 160,
  },
}
