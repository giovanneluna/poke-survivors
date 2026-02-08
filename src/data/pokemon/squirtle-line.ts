import type { PokemonFormConfig, TorrentConfig } from "../../types"
import { SPRITES } from "../sprites"

export const SQUIRTLE_FORMS: readonly PokemonFormConfig[] = [
  {
    form: "base",
    name: "Squirtle",
    sprite: SPRITES.squirtle,
    level: 1,
    maxAttackSlots: 5,
    maxPassiveSlots: 5,
    passiveTier: 1,
  },
  {
    form: "stage1",
    name: "Wartortle",
    sprite: SPRITES.wartortle,
    level: 16,
    maxAttackSlots: 7,
    maxPassiveSlots: 7,
    passiveTier: 2,
  },
  {
    form: "stage2",
    name: "Blastoise",
    sprite: SPRITES.blastoise,
    level: 36,
    maxAttackSlots: 10,
    maxPassiveSlots: 10,
    passiveTier: 3,
  },
] as const

export const TORRENT_TIERS: Readonly<Record<1 | 2 | 3, TorrentConfig>> = {
  1: {
    wetChance: 0.05,
    slowMultiplier: 0.2,
    wetDuration: 3000,
    bonusDmgOnWet: 0,
    splashOnKill: false,
    auraRadius: 60,
  },
  2: {
    wetChance: 0.1,
    slowMultiplier: 0.3,
    wetDuration: 3000,
    bonusDmgOnWet: 0.15,
    splashOnKill: false,
    auraRadius: 80,
  },
  3: {
    wetChance: 0.15,
    slowMultiplier: 0.4,
    wetDuration: 4000,
    bonusDmgOnWet: 0.25,
    splashOnKill: true,
    auraRadius: 100,
  },
} as const
