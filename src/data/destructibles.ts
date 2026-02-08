import type { DestructibleConfig, PickupConfig } from "../types"

export const DESTRUCTIBLES: Readonly<Record<string, DestructibleConfig>> = {
  tallGrass: {
    key: "tallGrass",
    name: "Tall Grass",
    hp: 3,
    textureKey: "dest-tall-grass",
    scale: 1.2,
    drops: [
      { type: "xpGem", chance: 0.8, count: 3 },
      { type: "oranBerry", chance: 0.2 },
    ],
  },
  berryBush: {
    key: "berryBush",
    name: "Berry Bush",
    hp: 8,
    textureKey: "dest-berry-bush",
    scale: 1.3,
    drops: [
      { type: "oranBerry", chance: 0.6 },
      { type: "xpGem", chance: 0.3, count: 5 },
      { type: "magnetBurst", chance: 0.1 },
    ],
  },
  rockSmash: {
    key: "rockSmash",
    name: "Rock Smash",
    hp: 15,
    textureKey: "dest-rock",
    scale: 1.4,
    drops: [
      { type: "xpGem", chance: 0.3, count: 8 },
      { type: "oranBerry", chance: 0.25 },
      { type: "rareCandy", chance: 0.15 },
      { type: "pokeballBomb", chance: 0.001 },
      { type: "xpShare", chance: 0.1 },
      { type: "duplicator", chance: 0.1 },
    ],
  },
  treasureChest: {
    key: "treasureChest",
    name: "Treasure Chest",
    hp: 1,
    textureKey: "dest-chest",
    scale: 1.5,
    drops: [
      { type: "xpShare", chance: 0.15 },
      { type: "duplicator", chance: 0.15 },
      { type: "rareCandy", chance: 0.3 },
      { type: "pokeballBomb", chance: 0.0001 },
      { type: "oranBerry", chance: 0.2 },
    ],
  },
} as const

export const PICKUPS: Readonly<Record<string, PickupConfig>> = {
  oranBerry: {
    key: "oranBerry",
    name: "Oran Berry",
    textureKey: "pickup-oran",
    description: "Cura 25 HP",
  },
  magnetBurst: {
    key: "magnetBurst",
    name: "Magnet Burst",
    textureKey: "pickup-magnet",
    description: "Puxa todos os XP",
  },
  rareCandy: {
    key: "rareCandy",
    name: "Rare Candy",
    textureKey: "pickup-candy",
    description: "+1 Level!",
  },
  pokeballBomb: {
    key: "pokeballBomb",
    name: "Pokéball Bomb",
    textureKey: "pickup-bomb",
    description: "Destrói todos na tela!",
  },
  xpShare: {
    key: "xpShare",
    name: "XP Share",
    textureKey: "pickup-xp-share",
    description: "XP x2 pelo resto da partida!",
  },
  duplicator: {
    key: "duplicator",
    name: "Duplicator",
    textureKey: "pickup-duplicator",
    description: "+1 projétil em todos os ataques!",
  },
} as const
