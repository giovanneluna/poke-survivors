import type { SpriteConfig } from "../../types"
import { STARTER_SPRITES } from "./starters"
import { ENEMY_SPRITES } from "./enemies"

export { STARTER_SPRITES, ENEMY_SPRITES }

/** Merge de todos os sprites — backward compatible com o antigo SPRITES flat */
export const SPRITES: Readonly<Record<string, SpriteConfig>> = {
  ...STARTER_SPRITES,
  ...ENEMY_SPRITES,
} as const
