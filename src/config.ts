// ── Barrel Export ────────────────────────────────────────────────────
// Todos os dados foram migrados para src/data/.
// Este arquivo re-exporta tudo para manter imports existentes intactos.

export { GAME, PLAYER, SPAWN, XP_GEM } from "./data/game-settings"
export { SPRITES, STARTER_SPRITES, ENEMY_SPRITES } from "./data/sprites/index"
export { CHARMANDER_FORMS, BLAZE_TIERS, SQUIRTLE_FORMS, TORRENT_TIERS, BULBASAUR_FORMS, OVERGROW_TIERS, STARTERS } from "./data/pokemon"
export type { StarterConfig } from "./data/pokemon"
export { ENEMIES, WAVES, BOSS_SCHEDULE } from "./data/enemies"
export { ATTACKS } from "./data/attacks/attack-registry"
export { EVOLUTIONS } from "./data/attacks/evolutions"
export { ATTACK_CATEGORIES } from "./data/attacks/categories"
export { HELD_ITEMS } from "./data/items/held-items"
export { UPGRADE_DEFS } from "./data/items/upgrade-defs"
export { DESTRUCTIBLES, PICKUPS } from "./data/destructibles"
