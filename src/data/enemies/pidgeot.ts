import type { BossConfig } from "../../types"
import { SPRITES } from "../sprites"

export const PIDGEOT: BossConfig = {
  key: "pidgeot",
  name: "Pidgeot",
  sprite: SPRITES.pidgeot,
  hp: 4500,
  speed: 75,
  damage: 35,
  xpValue: 250,
  scale: 1.7,
  isBoss: true,
  bossAttack: {
    name: "Hurricane",
    pattern: "aoe-land",
    damage: 45,
    cooldownMs: 3000,
    aoeRadius: 160,
    spriteKey: "atk-hurricane-boss",
    animKey: "anim-hurricane-boss",
    spriteScale: 2.5,
    tintColor: 0x88ccff,
    aoeColor: 0x66aaff,
  },
}
