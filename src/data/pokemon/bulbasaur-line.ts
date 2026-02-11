import type { PokemonFormConfig, OvergrowConfig } from "../../types"
import { SPRITES } from "../sprites"

export const BULBASAUR_FORMS: readonly PokemonFormConfig[] = [
  {
    form: "base",
    name: "Bulbasaur",
    sprite: SPRITES.bulbasaur,
    level: 1,
    maxAttackSlots: 5,
    maxPassiveSlots: 5,
    passiveTier: 1,
    types: ['grass', 'poison', 'normal'] as const,
  },
  {
    form: "stage1",
    name: "Ivysaur",
    sprite: SPRITES.ivysaur,
    level: 16,
    maxAttackSlots: 7,
    maxPassiveSlots: 7,
    passiveTier: 2,
    types: ['grass', 'poison', 'normal'] as const,
  },
  {
    form: "stage2",
    name: "Venusaur",
    sprite: SPRITES.venusaur,
    level: 36,
    maxAttackSlots: 10,
    maxPassiveSlots: 10,
    passiveTier: 3,
    types: ['grass', 'poison', 'normal'] as const,
  },
] as const

export const OVERGROW_TIERS: Readonly<Record<1 | 2 | 3, OvergrowConfig>> = {
  1: {
    poisonChance: 0.08,
    poisonDps: 3,
    poisonDuration: 3000,
    bonusDmgOnPoisoned: 0,
    toxicCloudOnKill: false,
  },
  2: {
    poisonChance: 0.18,
    poisonDps: 5,
    poisonDuration: 4000,
    bonusDmgOnPoisoned: 0.15,
    toxicCloudOnKill: false,
  },
  3: {
    poisonChance: 0.30,
    poisonDps: 8,
    poisonDuration: 5000,
    bonusDmgOnPoisoned: 0.25,
    toxicCloudOnKill: true,
  },
} as const
