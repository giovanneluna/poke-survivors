import type { BossConfig } from "../../types"
import { SPRITES } from "../sprites"

export const RATICATE: BossConfig = {
  key: "raticate",
  name: "Raticate",
  sprite: SPRITES.raticate,
  hp: 1500,
  speed: 70,
  damage: 50,
  xpValue: 160,
  scale: 1.9,
  isBoss: true,
  resistance: 0,
  hpRegenPerSec: 0,
  archetype: 'skirmisher',
  categoryResistance: { orbital: 0.3 },
  bossAttacks: [{
    name: "Hyper Fang",
    pattern: "charge",
    damage: 70,
    cooldownMs: 3500,
    range: 450,
  }, {
    name: 'Quick Attack',
    pattern: 'charge',
    damage: 30,
    cooldownMs: 2000,
    range: 250,
    spriteKey: 'atk-slash',
    animKey: 'anim-slash',
    spriteScale: 1.5,
    tintColor: 0xffffff,
  }],
}
