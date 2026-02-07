import type { EnemyConfig, AttackConfig, WaveConfig, SpriteConfig, HeldItemConfig, EvolutionConfig, DestructibleConfig, PickupConfig } from './types';

// ── Configuração geral do jogo ─────────────────────────────────────
export const GAME = {
  width: 800,
  height: 600,
  worldWidth: 3000,
  worldHeight: 3000,
  tileSize: 24,
} as const;

// ── Sprites PMDCollab (Pokemon Mystery Dungeon style) ──────────────
export const SPRITES: Readonly<Record<string, SpriteConfig>> = {
  charmander: { key: 'charmander-walk', path: 'assets/pokemon/charmander-walk.png', frameWidth: 32, frameHeight: 32, frameCount: 4, directions: 8 },
  bulbasaur:  { key: 'bulbasaur-walk',  path: 'assets/pokemon/bulbasaur-walk.png',  frameWidth: 48, frameHeight: 40, frameCount: 5, directions: 8 },
  squirtle:   { key: 'squirtle-walk',   path: 'assets/pokemon/squirtle-walk.png',   frameWidth: 32, frameHeight: 32, frameCount: 4, directions: 8 },
  rattata:    { key: 'rattata-walk',    path: 'assets/pokemon/rattata-walk.png',    frameWidth: 48, frameHeight: 40, frameCount: 7, directions: 8 },
  pidgey:     { key: 'pidgey-walk',     path: 'assets/pokemon/pidgey-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 5, directions: 8 },
  zubat:      { key: 'zubat-walk',      path: 'assets/pokemon/zubat-walk.png',      frameWidth: 32, frameHeight: 56, frameCount: 8, directions: 8 },
  geodude:    { key: 'geodude-walk',    path: 'assets/pokemon/geodude-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4, directions: 8 },
  gastly:     { key: 'gastly-walk',     path: 'assets/pokemon/gastly-walk.png',     frameWidth: 48, frameHeight: 64, frameCount: 12, directions: 8 },
} as const;

// ── Starters (para tela de seleção) ────────────────────────────────
export interface StarterConfig {
  readonly key: string;
  readonly name: string;
  readonly sprite: SpriteConfig;
  readonly type: string;
  readonly description: string;
  readonly unlocked: boolean;
}

export const STARTERS: readonly StarterConfig[] = [
  { key: 'charmander', name: 'Charmander', sprite: SPRITES.charmander, type: 'Fogo', description: 'O lagarto de fogo. Ataques poderosos de chamas!', unlocked: true },
  { key: 'squirtle',   name: 'Squirtle',   sprite: SPRITES.squirtle,   type: 'Água', description: 'A tartaruga aquática. Jatos de água precisos!', unlocked: false },
  { key: 'bulbasaur',  name: 'Bulbasaur',  sprite: SPRITES.bulbasaur,  type: 'Planta', description: 'O dinossauro planta. Esporos e vinhas!', unlocked: false },
] as const;

// ── Configuração do jogador ────────────────────────────────────────
export const PLAYER = {
  startHp: 100,
  startSpeed: 160,
  startMagnetRange: 60,
  invincibilityMs: 500,
  baseXpToLevel: 20,
  xpScaleFactor: 1.35,
  sprite: SPRITES.charmander,
} as const;

// ── Definições dos inimigos ────────────────────────────────────────
export const ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  rattata:  { key: 'rattata',  name: 'Rattata',  sprite: SPRITES.rattata,  hp: 15, speed: 85,  damage: 5,  xpValue: 3,  scale: 1.0 },
  pidgey:   { key: 'pidgey',   name: 'Pidgey',   sprite: SPRITES.pidgey,   hp: 20, speed: 65,  damage: 8,  xpValue: 5,  scale: 1.0 },
  zubat:    { key: 'zubat',    name: 'Zubat',    sprite: SPRITES.zubat,    hp: 12, speed: 105, damage: 4,  xpValue: 4,  scale: 0.8,
    rangedAttack: { projectileKey: 'supersonic-wave', damage: 3, speed: 120, cooldownMs: 5000, range: 200, homing: false, effect: 'slow', effectDurationMs: 1500 },
  },
  geodude:  { key: 'geodude',  name: 'Geodude',  sprite: SPRITES.geodude,  hp: 50, speed: 38,  damage: 15, xpValue: 10, scale: 1.0,
    rangedAttack: { projectileKey: 'rock-throw', damage: 12, speed: 180, cooldownMs: 4000, range: 280, homing: false },
  },
  gastly:   { key: 'gastly',   name: 'Gastly',   sprite: SPRITES.gastly,   hp: 25, speed: 72,  damage: 10, xpValue: 8,  scale: 0.7,
    rangedAttack: { projectileKey: 'shadow-ball', damage: 8, speed: 100, cooldownMs: 3000, range: 350, homing: true },
  },
} as const;

// ── Definições dos ataques ─────────────────────────────────────────
export const ATTACKS: Readonly<Record<string, AttackConfig>> = {
  ember:        { key: 'ember',        name: 'Ember',        description: 'Bolas de fogo no inimigo mais próximo',       baseDamage: 10, baseCooldown: 1200 },
  fireSpin:     { key: 'fireSpin',     name: 'Fire Spin',    description: 'Orbes de fogo orbitam ao seu redor',          baseDamage: 7,  baseCooldown: 400  },
  flamethrower: { key: 'flamethrower', name: 'Flamethrower', description: 'Explosão de fogo na direção do movimento',   baseDamage: 22, baseCooldown: 2800 },
  inferno:      { key: 'inferno',      name: 'Inferno',      description: 'Bolas de fogo que explodem em AoE',          baseDamage: 18, baseCooldown: 900  },
  fireBlast:    { key: 'fireBlast',    name: 'Fire Blast',   description: 'Anel de fogo expansivo pulsante',            baseDamage: 12, baseCooldown: 300  },
  blastBurn:    { key: 'blastBurn',    name: 'Blast Burn',   description: 'Explosão nuclear devastadora',               baseDamage: 50, baseCooldown: 3500 },
} as const;

// ── Held Items (Passivos) ──────────────────────────────────────────
export const HELD_ITEMS: Readonly<Record<string, HeldItemConfig>> = {
  charcoal:    { key: 'charcoal',    name: 'Charcoal',     description: '+20% dano de fogo',        icon: '�ite', color: 0xff6600, effect: 'fireDmg' },
  wideLens:    { key: 'wideLens',    name: 'Wide Lens',    description: '+25% área de efeito',      icon: '🔍', color: 0x44aaff, effect: 'aoe' },
  choiceSpecs: { key: 'choiceSpecs', name: 'Choice Specs', description: '+30% ataque especial',     icon: '👓', color: 0xaa44ff, effect: 'spAtk' },
} as const;

// ── Evoluções de Ataques ───────────────────────────────────────────
export const EVOLUTIONS: readonly EvolutionConfig[] = [
  { baseAttack: 'ember',        requiredLevel: 5, requiredItem: 'charcoal',    evolvedAttack: 'inferno',   name: 'Inferno',    description: 'Ember evolui! Bolas de fogo explosivas', icon: '🌋', color: 0xff4400 },
  { baseAttack: 'fireSpin',     requiredLevel: 5, requiredItem: 'wideLens',    evolvedAttack: 'fireBlast', name: 'Fire Blast', description: 'Fire Spin evolui! Anel de fogo pulsante', icon: '💥', color: 0xff8800 },
  { baseAttack: 'flamethrower', requiredLevel: 5, requiredItem: 'choiceSpecs', evolvedAttack: 'blastBurn', name: 'Blast Burn', description: 'Flamethrower evolui! Explosão devastadora', icon: '☢️', color: 0xff0000 },
] as const;

// ── Configuração de waves ──────────────────────────────────────────
export const WAVES: readonly WaveConfig[] = [
  { enemies: [{ type: 'rattata', weight: 1 }],                                                              spawnRate: 1400, maxEnemies: 30  },
  { enemies: [{ type: 'rattata', weight: 3 }, { type: 'pidgey', weight: 1 }],                               spawnRate: 1200, maxEnemies: 40  },
  { enemies: [{ type: 'rattata', weight: 2 }, { type: 'pidgey', weight: 2 }, { type: 'zubat', weight: 1 }], spawnRate: 1000, maxEnemies: 50  },
  { enemies: [{ type: 'pidgey', weight: 2 }, { type: 'zubat', weight: 2 }, { type: 'geodude', weight: 1 }], spawnRate: 800,  maxEnemies: 60  },
  { enemies: [{ type: 'zubat', weight: 2 }, { type: 'geodude', weight: 2 }, { type: 'gastly', weight: 1 }], spawnRate: 600,  maxEnemies: 80  },
  { enemies: [{ type: 'geodude', weight: 2 }, { type: 'gastly', weight: 3 }],                               spawnRate: 400,  maxEnemies: 100 },
] as const;

// ── Spawn e XP gems ────────────────────────────────────────────────
export const SPAWN = {
  distanceFromPlayer: 500,
  despawnDistance: 900,
  difficultyIntervalMs: 30_000,
} as const;

export const XP_GEM = {
  magnetSpeed: 350,
  size: 5,
} as const;

// ── Objetos Destrutíveis ───────────────────────────────────────────
export const DESTRUCTIBLES: Readonly<Record<string, DestructibleConfig>> = {
  tallGrass: {
    key: 'tallGrass', name: 'Tall Grass', hp: 3, textureKey: 'dest-tall-grass', scale: 1.2,
    drops: [
      { type: 'xpGem', chance: 0.8, count: 3 },
      { type: 'oranBerry', chance: 0.2 },
    ],
  },
  berryBush: {
    key: 'berryBush', name: 'Berry Bush', hp: 8, textureKey: 'dest-berry-bush', scale: 1.3,
    drops: [
      { type: 'oranBerry', chance: 0.6 },
      { type: 'xpGem', chance: 0.3, count: 5 },
      { type: 'magnetBurst', chance: 0.1 },
    ],
  },
  rockSmash: {
    key: 'rockSmash', name: 'Rock Smash', hp: 15, textureKey: 'dest-rock', scale: 1.4,
    drops: [
      { type: 'xpGem', chance: 0.4, count: 8 },
      { type: 'oranBerry', chance: 0.35 },
      { type: 'rareCandy', chance: 0.15 },
      { type: 'pokeballBomb', chance: 0.1 },
    ],
  },
  treasureChest: {
    key: 'treasureChest', name: 'Treasure Chest', hp: 1, textureKey: 'dest-chest', scale: 1.5,
    drops: [],
  },
} as const;

// ── Pickups ────────────────────────────────────────────────────────
export const PICKUPS: Readonly<Record<string, PickupConfig>> = {
  oranBerry:    { key: 'oranBerry',    name: 'Oran Berry',    textureKey: 'pickup-oran',   description: 'Cura 25 HP' },
  magnetBurst:  { key: 'magnetBurst',  name: 'Magnet Burst',  textureKey: 'pickup-magnet', description: 'Puxa todos os XP' },
  rareCandy:    { key: 'rareCandy',    name: 'Rare Candy',    textureKey: 'pickup-candy',  description: '+1 Level!' },
  pokeballBomb: { key: 'pokeballBomb', name: 'Pokéball Bomb', textureKey: 'pickup-bomb',   description: 'Destrói todos na tela!' },
} as const;

// ── Upgrades disponíveis no level up ───────────────────────────────
export const UPGRADE_DEFS = {
  newFireSpin:     { id: 'newFireSpin',     name: 'Fire Spin',        description: '+Fire Spin: orbes orbitais',           icon: '🔥', color: 0xff6600 },
  newFlamethrower: { id: 'newFlamethrower', name: 'Flamethrower',     description: '+Flamethrower: explosão direcional',   icon: '🔥', color: 0xff2200 },
  upgradeEmber:    { id: 'upgradeEmber',    name: 'Ember+',           description: 'Mais dano e projéteis no Ember',       icon: '🔺', color: 0xff8800 },
  upgradeFireSpin: { id: 'upgradeFireSpin', name: 'Fire Spin+',      description: 'Mais orbes e dano no Fire Spin',       icon: '🔺', color: 0xff6600 },
  upgradeFlame:    { id: 'upgradeFlame',    name: 'Flamethrower+',    description: 'Mais dano e alcance no Flamethrower',  icon: '🔺', color: 0xff2200 },
  maxHpUp:         { id: 'maxHpUp',         name: 'Max HP+',          description: '+25 HP máximo',                        icon: '❤️', color: 0xff4444 },
  speedUp:         { id: 'speedUp',         name: 'Velocidade+',      description: '+15% velocidade de movimento',         icon: '⚡', color: 0x44aaff },
  magnetUp:        { id: 'magnetUp',        name: 'Magneto+',         description: '+40% alcance de coleta de XP',         icon: '🧲', color: 0xaa44ff },
  // Held Items como upgrades
  itemCharcoal:    { id: 'itemCharcoal',    name: 'Charcoal',         description: '+20% dano de fogo',                    icon: '�ite', color: 0xff6600 },
  itemWideLens:    { id: 'itemWideLens',    name: 'Wide Lens',        description: '+25% área de efeito',                  icon: '🔍', color: 0x44aaff },
  itemChoiceSpecs: { id: 'itemChoiceSpecs', name: 'Choice Specs',     description: '+30% ataque especial',                 icon: '👓', color: 0xaa44ff },
  // Evoluções
  evolveInferno:   { id: 'evolveInferno',   name: 'EVOLUÇÃO: Inferno',    description: 'Ember → Inferno! Bolas explosivas!',   icon: '🌋', color: 0xff4400 },
  evolveFireBlast: { id: 'evolveFireBlast', name: 'EVOLUÇÃO: Fire Blast', description: 'Fire Spin → Fire Blast! Anel pulsante!', icon: '💥', color: 0xff8800 },
  evolveBlastBurn: { id: 'evolveBlastBurn', name: 'EVOLUÇÃO: Blast Burn', description: 'Flamethrower → Blast Burn! Nuclear!',   icon: '☢️', color: 0xff0000 },
} as const;
