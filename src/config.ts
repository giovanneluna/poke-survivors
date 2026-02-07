import type {
  EnemyConfig, AttackConfig, WaveConfig, SpriteConfig, HeldItemConfig,
  EvolutionConfig, DestructibleConfig, PickupConfig, PokemonFormConfig,
} from './types';

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
  charmander:  { key: 'charmander-walk',  path: 'assets/pokemon/charmander-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  charmeleon:  { key: 'charmeleon-walk',  path: 'assets/pokemon/charmeleon-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 3,  directions: 8 },
  charizard:   { key: 'charizard-walk',   path: 'assets/pokemon/charizard-walk.png',   frameWidth: 40, frameHeight: 48, frameCount: 4,  directions: 8 },
  bulbasaur:   { key: 'bulbasaur-walk',   path: 'assets/pokemon/bulbasaur-walk.png',   frameWidth: 48, frameHeight: 40, frameCount: 5,  directions: 8 },
  squirtle:    { key: 'squirtle-walk',    path: 'assets/pokemon/squirtle-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  rattata:     { key: 'rattata-walk',     path: 'assets/pokemon/rattata-walk.png',     frameWidth: 48, frameHeight: 40, frameCount: 7,  directions: 8 },
  pidgey:      { key: 'pidgey-walk',      path: 'assets/pokemon/pidgey-walk.png',      frameWidth: 32, frameHeight: 32, frameCount: 5,  directions: 8 },
  zubat:       { key: 'zubat-walk',       path: 'assets/pokemon/zubat-walk.png',       frameWidth: 32, frameHeight: 56, frameCount: 8,  directions: 8 },
  geodude:     { key: 'geodude-walk',     path: 'assets/pokemon/geodude-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  gastly:      { key: 'gastly-walk',      path: 'assets/pokemon/gastly-walk.png',      frameWidth: 48, frameHeight: 64, frameCount: 12, directions: 8 },
} as const;

// ── Formas do Charmander Line ──────────────────────────────────────
export const CHARMANDER_FORMS = [
  { form: 'base' as const,   name: 'Charmander',  sprite: SPRITES.charmander,  level: 1,  maxAttackSlots: 4, maxPassiveSlots: 4, blazeTier: 1 as const },
  { form: 'stage1' as const, name: 'Charmeleon',  sprite: SPRITES.charmeleon,  level: 16, maxAttackSlots: 5, maxPassiveSlots: 5, blazeTier: 2 as const },
  { form: 'stage2' as const, name: 'Charizard',   sprite: SPRITES.charizard,   level: 36, maxAttackSlots: 6, maxPassiveSlots: 6, blazeTier: 3 as const },
] as const;

// ── Passiva Blaze por tier ─────────────────────────────────────────
export const BLAZE_TIERS = {
  1: { burnChance: 0.05, burnDps: 2,  burnDuration: 3000, bonusDmgOnBurned: 0,    explodeOnKill: false },
  2: { burnChance: 0.10, burnDps: 4,  burnDuration: 3000, bonusDmgOnBurned: 0.15, explodeOnKill: false },
  3: { burnChance: 0.15, burnDps: 6,  burnDuration: 4000, bonusDmgOnBurned: 0.25, explodeOnKill: true },
} as const;

// ── Starters (para tela de seleção) ────────────────────────────────
export interface StarterConfig {
  readonly key: string;
  readonly name: string;
  readonly sprite: SpriteConfig;
  readonly type: string;
  readonly description: string;
  readonly unlocked: boolean;
  readonly forms: readonly PokemonFormConfig[];
}

export const STARTERS: readonly StarterConfig[] = [
  { key: 'charmander', name: 'Charmander', sprite: SPRITES.charmander, type: 'Fogo', description: 'O lagarto de fogo. Ataques poderosos de chamas!', unlocked: true, forms: CHARMANDER_FORMS },
  { key: 'squirtle',   name: 'Squirtle',   sprite: SPRITES.squirtle,   type: 'Água', description: 'A tartaruga aquática. Jatos de água precisos!', unlocked: false, forms: [] },
  { key: 'bulbasaur',  name: 'Bulbasaur',  sprite: SPRITES.bulbasaur,  type: 'Planta', description: 'O dinossauro planta. Esporos e vinhas!', unlocked: false, forms: [] },
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
  rattata:  { key: 'rattata',  name: 'Rattata',  sprite: SPRITES.rattata,  hp: 15, speed: 60,  damage: 5,  xpValue: 3,  scale: 1.0 },
  pidgey:   { key: 'pidgey',   name: 'Pidgey',   sprite: SPRITES.pidgey,   hp: 20, speed: 50,  damage: 8,  xpValue: 5,  scale: 1.0 },
  zubat:    { key: 'zubat',    name: 'Zubat',    sprite: SPRITES.zubat,    hp: 12, speed: 70,  damage: 4,  xpValue: 4,  scale: 0.8,
    rangedAttack: { projectileKey: 'atk-hyper-voice', damage: 3, speed: 70, cooldownMs: 5000, range: 200, homing: false, effect: 'slow', effectDurationMs: 1500 },
  },
  geodude:  { key: 'geodude',  name: 'Geodude',  sprite: SPRITES.geodude,  hp: 50, speed: 35,  damage: 15, xpValue: 10, scale: 1.0,
    rangedAttack: { projectileKey: 'atk-rock-slide', damage: 12, speed: 100, cooldownMs: 4000, range: 280, homing: false },
  },
  gastly:   { key: 'gastly',   name: 'Gastly',   sprite: SPRITES.gastly,   hp: 25, speed: 50,  damage: 10, xpValue: 8,  scale: 0.7,
    rangedAttack: { projectileKey: 'atk-shadow-ball', damage: 8, speed: 55, cooldownMs: 3000, range: 350, homing: false },
  },
} as const;

// ── Definições dos ataques ─────────────────────────────────────────
export const ATTACKS: Readonly<Record<string, AttackConfig>> = {
  // Charmander base
  ember:        { key: 'ember',        name: 'Ember',         description: 'Bolas de fogo no inimigo mais próximo',      baseDamage: 10, baseCooldown: 1200, element: 'fire',   maxLevel: 8, minForm: 'base' },
  scratch:      { key: 'scratch',      name: 'Scratch',       description: 'Garrada rápida na direção do movimento',     baseDamage: 8,  baseCooldown: 600,  element: 'normal', maxLevel: 8, minForm: 'base' },
  fireSpin:     { key: 'fireSpin',     name: 'Fire Spin',     description: 'Orbes de fogo orbitam ao seu redor',         baseDamage: 7,  baseCooldown: 400,  element: 'fire',   maxLevel: 8, minForm: 'base' },
  smokescreen:  { key: 'smokescreen',  name: 'Smokescreen',   description: 'Nuvem de fumaça que causa slow nos inimigos', baseDamage: 0,  baseCooldown: 0,    element: 'normal', maxLevel: 8, minForm: 'base' },
  dragonBreath: { key: 'dragonBreath', name: 'Dragon Breath', description: 'Sopro frontal com chance de stun',           baseDamage: 15, baseCooldown: 1800, element: 'dragon', maxLevel: 8, minForm: 'base' },
  fireFang:     { key: 'fireFang',     name: 'Fire Fang',     description: 'Mordida flamejante com chance de queimação', baseDamage: 12, baseCooldown: 1000, element: 'fire',   maxLevel: 8, minForm: 'base' },
  flameCharge:  { key: 'flameCharge',  name: 'Flame Charge',  description: 'Dash em chamas, +speed temporário',          baseDamage: 14, baseCooldown: 3000, element: 'fire',   maxLevel: 8, minForm: 'base' },
  // Charmeleon
  slash:        { key: 'slash',        name: 'Slash',         description: 'Garrada ampla com alta chance de crítico',   baseDamage: 18, baseCooldown: 800,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
  flamethrower: { key: 'flamethrower', name: 'Flamethrower',  description: 'Coluna de fogo direcional devastadora',      baseDamage: 22, baseCooldown: 2800, element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  dragonClaw:   { key: 'dragonClaw',   name: 'Dragon Claw',   description: 'Garras dracônicas com multi-hit',           baseDamage: 16, baseCooldown: 1200, element: 'dragon', maxLevel: 8, minForm: 'stage1' },
  // Charizard
  airSlash:     { key: 'airSlash',     name: 'Air Slash',     description: 'Lâmina de ar que atravessa inimigos',        baseDamage: 20, baseCooldown: 1400, element: 'flying', maxLevel: 8, minForm: 'stage2' },
  flareBlitz:   { key: 'flareBlitz',   name: 'Flare Blitz',   description: 'Dash devastador em chamas (recoil!)',        baseDamage: 45, baseCooldown: 4000, element: 'fire',   maxLevel: 8, minForm: 'stage2' },
  hurricane:    { key: 'hurricane',    name: 'Hurricane',     description: 'Tornado que puxa inimigos para o centro',    baseDamage: 12, baseCooldown: 6000, element: 'flying', maxLevel: 8, minForm: 'stage2' },
  outrage:      { key: 'outrage',      name: 'Outrage',       description: 'Modo berserk 360°, confusão ao final',       baseDamage: 35, baseCooldown: 8000, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  // Evoluções de arma
  inferno:      { key: 'inferno',      name: 'Inferno',       description: 'Bolas de fogo que explodem em AoE',         baseDamage: 18, baseCooldown: 900,  element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  fireBlast:    { key: 'fireBlast',    name: 'Fire Blast',    description: 'Estrela de fogo pulsante expansiva',         baseDamage: 12, baseCooldown: 300,  element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  blastBurn:    { key: 'blastBurn',    name: 'Blast Burn',    description: 'Explosão nuclear devastadora',               baseDamage: 50, baseCooldown: 3500, element: 'fire',   maxLevel: 8, minForm: 'stage2' },
  furySwipes:   { key: 'furySwipes',   name: 'Fury Swipes',   description: 'Multi-slash 360° ultra rápido',              baseDamage: 12, baseCooldown: 500,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
  blazeKick:    { key: 'blazeKick',    name: 'Blaze Kick',    description: 'Chute flamejante com AoE de fogo',           baseDamage: 20, baseCooldown: 800,  element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  dragonPulse:  { key: 'dragonPulse',  name: 'Dragon Pulse',  description: 'Beam dracônico que perfura tudo',            baseDamage: 30, baseCooldown: 1500, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  nightSlash:   { key: 'nightSlash',   name: 'Night Slash',   description: 'Garrada sombria, 50% crit chance',           baseDamage: 25, baseCooldown: 700,  element: 'normal', maxLevel: 8, minForm: 'stage2' },
  aerialAce:    { key: 'aerialAce',    name: 'Aerial Ace',    description: 'Lâminas homing que nunca erram',             baseDamage: 25, baseCooldown: 1200, element: 'flying', maxLevel: 8, minForm: 'stage2' },
  flareRush:    { key: 'flareRush',    name: 'Flare Rush',    description: 'Dash longo com rastro de fogo',              baseDamage: 22, baseCooldown: 2000, element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  dragonRush:   { key: 'dragonRush',   name: 'Dragon Rush',   description: 'Carga dracônica com stun AoE',              baseDamage: 35, baseCooldown: 2500, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  // Prime
  heatWave:     { key: 'heatWave',     name: 'Heat Wave',     description: 'Onda de calor 360° devastadora',             baseDamage: 40, baseCooldown: 5000, element: 'fire',   maxLevel: 8, minForm: 'stage2' },
  dracoMeteor:  { key: 'dracoMeteor',  name: 'Draco Meteor',  description: 'Chuva de meteoros apocalíptica',             baseDamage: 60, baseCooldown: 10000, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
} as const;

// ── Held Items (Passivos) ──────────────────────────────────────────
export const HELD_ITEMS: Readonly<Record<string, HeldItemConfig>> = {
  charcoal:    { key: 'charcoal',    name: 'Charcoal',      description: '+10% dano de fogo por nível',    icon: 'item-charcoal',     color: 0xff6600, effect: 'fireDmg',    maxLevel: 5 },
  wideLens:    { key: 'wideLens',    name: 'Wide Lens',     description: '+10% área de efeito por nível',  icon: 'item-wide-lens',    color: 0x44aaff, effect: 'aoe',        maxLevel: 5 },
  choiceSpecs: { key: 'choiceSpecs', name: 'Choice Specs',  description: '+8% dano geral por nível',       icon: 'item-choice-specs', color: 0xaa44ff, effect: 'spAtk',      maxLevel: 5 },
  quickClaw:   { key: 'quickClaw',   name: 'Quick Claw',    description: '+8% velocidade por nível',       icon: 'item-quick-claw',   color: 0x44aaff, effect: 'speed',      maxLevel: 5 },
  leftovers:   { key: 'leftovers',   name: 'Leftovers',     description: '+0.5 HP/s por nível',            icon: 'item-leftovers',    color: 0xff4444, effect: 'hpRegen',    maxLevel: 5 },
  dragonFang:  { key: 'dragonFang',  name: 'Dragon Fang',   description: '+10% dano dragon por nível',     icon: 'item-dragon-fang',  color: 0x7744ff, effect: 'dragonDmg',  maxLevel: 5 },
  sharpBeak:   { key: 'sharpBeak',   name: 'Sharp Beak',    description: '+10% dano flying por nível',     icon: 'item-sharp-beak',   color: 0x88ccff, effect: 'flyingDmg',  maxLevel: 5 },
  scopeLens:   { key: 'scopeLens',   name: 'Scope Lens',    description: '+5% chance de crítico por nível', icon: 'item-scope-lens',  color: 0xff44aa, effect: 'crit',       maxLevel: 5 },
  razorClaw:   { key: 'razorClaw',   name: 'Razor Claw',    description: '+15% dano crítico por nível',    icon: 'item-razor-claw',   color: 0xcc4444, effect: 'critDmg',    maxLevel: 5 },
  shellBell:   { key: 'shellBell',   name: 'Shell Bell',    description: '+1.5% lifesteal por nível',      icon: 'item-shell-bell',   color: 0xffcc44, effect: 'lifesteal',  maxLevel: 5 },
  focusBand:   { key: 'focusBand',   name: 'Focus Band',    description: 'Sobrevive golpe fatal (CD -10s/nv)', icon: 'item-focus-band', color: 0xff8800, effect: 'endure',   maxLevel: 3 },
  magnet:      { key: 'magnet',      name: 'Magnet',        description: '+20% alcance de coleta de XP',   icon: 'item-magnet',       color: 0xaa44ff, effect: 'magnetRange', maxLevel: 5 },
} as const;

// ── Evoluções de Ataques ───────────────────────────────────────────
export const EVOLUTIONS: readonly EvolutionConfig[] = [
  // Charmeleon tier
  { baseAttack: 'ember',       requiredLevel: 8, requiredItem: 'charcoal',    requiredForm: 'stage1', evolvedAttack: 'inferno',    name: 'Inferno',     description: 'Ember evolui! Bolas explosivas!',     icon: 'item-fire-stone', color: 0xff4400 },
  { baseAttack: 'fireSpin',    requiredLevel: 8, requiredItem: 'wideLens',    requiredForm: 'stage1', evolvedAttack: 'fireBlast',  name: 'Fire Blast',  description: 'Fire Spin evolui! Estrela pulsante!', icon: 'item-fire-stone', color: 0xff8800 },
  { baseAttack: 'scratch',     requiredLevel: 8, requiredItem: 'razorClaw',   requiredForm: 'stage1', evolvedAttack: 'furySwipes', name: 'Fury Swipes', description: 'Scratch evolui! Multi-slash 360°!',   icon: 'item-fire-stone', color: 0xcccccc },
  { baseAttack: 'fireFang',    requiredLevel: 8, requiredItem: 'charcoal',    requiredForm: 'stage1', evolvedAttack: 'blazeKick',  name: 'Blaze Kick',  description: 'Fire Fang evolui! Chute flamejante!', icon: 'item-fire-stone', color: 0xff6600 },
  { baseAttack: 'flameCharge', requiredLevel: 8, requiredItem: 'quickClaw',   requiredForm: 'stage1', evolvedAttack: 'flareRush',  name: 'Flare Rush',  description: 'Flame Charge evolui! Dash de fogo!',  icon: 'item-fire-stone', color: 0xff4400 },
  // Charizard tier
  { baseAttack: 'flamethrower', requiredLevel: 8, requiredItem: 'choiceSpecs', requiredForm: 'stage2', evolvedAttack: 'blastBurn',   name: 'Blast Burn',   description: 'Flamethrower evolui! Nuclear!',     icon: 'item-fire-stone', color: 0xff0000 },
  { baseAttack: 'dragonBreath', requiredLevel: 8, requiredItem: 'dragonFang',  requiredForm: 'stage2', evolvedAttack: 'dragonPulse', name: 'Dragon Pulse', description: 'Dragon Breath evolui! Beam total!', icon: 'item-fire-stone', color: 0x7744ff },
  { baseAttack: 'slash',        requiredLevel: 8, requiredItem: 'scopeLens',   requiredForm: 'stage2', evolvedAttack: 'nightSlash',  name: 'Night Slash',  description: 'Slash evolui! 50% crítico!',        icon: 'item-fire-stone', color: 0x444466 },
  { baseAttack: 'dragonClaw',   requiredLevel: 8, requiredItem: 'dragonFang',  requiredForm: 'stage2', evolvedAttack: 'dragonRush',  name: 'Dragon Rush',  description: 'Dragon Claw evolui! Carga stun!',   icon: 'item-fire-stone', color: 0x7744ff },
  { baseAttack: 'airSlash',     requiredLevel: 8, requiredItem: 'sharpBeak',   requiredForm: 'stage2', evolvedAttack: 'aerialAce',   name: 'Aerial Ace',   description: 'Air Slash evolui! Homing total!',   icon: 'item-fire-stone', color: 0x88ccff },
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
    drops: [{ type: 'xpGem', chance: 0.8, count: 3 }, { type: 'oranBerry', chance: 0.2 }],
  },
  berryBush: {
    key: 'berryBush', name: 'Berry Bush', hp: 8, textureKey: 'dest-berry-bush', scale: 1.3,
    drops: [{ type: 'oranBerry', chance: 0.6 }, { type: 'xpGem', chance: 0.3, count: 5 }, { type: 'magnetBurst', chance: 0.1 }],
  },
  rockSmash: {
    key: 'rockSmash', name: 'Rock Smash', hp: 15, textureKey: 'dest-rock', scale: 1.4,
    drops: [{ type: 'xpGem', chance: 0.4, count: 8 }, { type: 'oranBerry', chance: 0.35 }, { type: 'rareCandy', chance: 0.15 }, { type: 'pokeballBomb', chance: 0.1 }],
  },
  treasureChest: { key: 'treasureChest', name: 'Treasure Chest', hp: 1, textureKey: 'dest-chest', scale: 1.5, drops: [] },
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
  // Novos ataques (aparecem se player não tem e forma é suficiente)
  newEmber:        { id: 'newEmber',        name: 'Ember',         description: '+Ember: bolas de fogo',              icon: 'item-flame-orb', color: 0xff8800 },
  newScratch:      { id: 'newScratch',      name: 'Scratch',       description: '+Scratch: garrada rápida',           icon: 'item-flame-orb', color: 0xcccccc },
  newFireSpin:     { id: 'newFireSpin',     name: 'Fire Spin',     description: '+Fire Spin: orbes orbitais',         icon: 'item-flame-orb', color: 0xff6600 },
  newSmokescreen:  { id: 'newSmokescreen',  name: 'Smokescreen',   description: '+Smokescreen: aura de slow',         icon: 'item-flame-orb', color: 0x888888 },
  newDragonBreath: { id: 'newDragonBreath', name: 'Dragon Breath', description: '+Dragon Breath: sopro com stun',     icon: 'item-flame-orb', color: 0x7744ff },
  newFireFang:     { id: 'newFireFang',     name: 'Fire Fang',     description: '+Fire Fang: mordida com queimação',  icon: 'item-flame-orb', color: 0xff4400 },
  newFlameCharge:  { id: 'newFlameCharge',  name: 'Flame Charge',  description: '+Flame Charge: dash em chamas',      icon: 'item-flame-orb', color: 0xff6600 },
  newSlash:        { id: 'newSlash',        name: 'Slash',         description: '+Slash: garrada ampla com crit',     icon: 'item-flame-orb', color: 0xcccccc },
  newFlamethrower: { id: 'newFlamethrower', name: 'Flamethrower',  description: '+Flamethrower: coluna de fogo',      icon: 'item-flame-orb', color: 0xff2200 },
  newDragonClaw:   { id: 'newDragonClaw',   name: 'Dragon Claw',   description: '+Dragon Claw: garras multi-hit',    icon: 'item-flame-orb', color: 0x7744ff },
  newAirSlash:     { id: 'newAirSlash',     name: 'Air Slash',     description: '+Air Slash: lâmina piercing',        icon: 'item-flame-orb', color: 0x88ccff },
  newFlareBlitz:   { id: 'newFlareBlitz',   name: 'Flare Blitz',   description: '+Flare Blitz: dash com recoil',      icon: 'item-flame-orb', color: 0xff0000 },
  newHurricane:    { id: 'newHurricane',    name: 'Hurricane',     description: '+Hurricane: tornado que puxa',        icon: 'item-flame-orb', color: 0x88ccff },
  newOutrage:      { id: 'newOutrage',      name: 'Outrage',       description: '+Outrage: berserk mode',             icon: 'item-flame-orb', color: 0x7744ff },
  newHeatWave:     { id: 'newHeatWave',    name: 'Heat Wave',     description: '+Heat Wave: onda de calor 360°',     icon: 'item-flame-orb', color: 0xff4400 },
  newDracoMeteor:  { id: 'newDracoMeteor', name: 'Draco Meteor',  description: '+Draco Meteor: chuva de meteoros!',  icon: 'item-flame-orb', color: 0x9966ff },
  // Upgrades de ataque existente
  upgradeEmber:        { id: 'upgradeEmber',        name: 'Ember+',          description: 'Mais dano e projéteis',          icon: 'item-pp-up', color: 0xff8800 },
  upgradeScratch:      { id: 'upgradeScratch',      name: 'Scratch+',        description: 'Mais dano e área',               icon: 'item-pp-up', color: 0xcccccc },
  upgradeFireSpin:     { id: 'upgradeFireSpin',     name: 'Fire Spin+',      description: 'Mais orbes e dano',              icon: 'item-pp-up', color: 0xff6600 },
  upgradeSmokescreen:  { id: 'upgradeSmokescreen',  name: 'Smokescreen+',    description: 'Mais área e slow',               icon: 'item-pp-up', color: 0x888888 },
  upgradeDragonBreath: { id: 'upgradeDragonBreath', name: 'Dragon Breath+',  description: 'Mais dano e stun',               icon: 'item-pp-up', color: 0x7744ff },
  upgradeFireFang:     { id: 'upgradeFireFang',     name: 'Fire Fang+',      description: 'Mais dano e burn%',              icon: 'item-pp-up', color: 0xff4400 },
  upgradeFlameCharge:  { id: 'upgradeFlameCharge',  name: 'Flame Charge+',   description: 'Mais dano e distância',          icon: 'item-pp-up', color: 0xff6600 },
  upgradeSlash:        { id: 'upgradeSlash',        name: 'Slash+',          description: 'Mais dano e crit%',              icon: 'item-pp-up', color: 0xcccccc },
  upgradeFlame:        { id: 'upgradeFlame',        name: 'Flamethrower+',   description: 'Mais dano e alcance',            icon: 'item-pp-up', color: 0xff2200 },
  upgradeDragonClaw:   { id: 'upgradeDragonClaw',   name: 'Dragon Claw+',    description: 'Mais golpes e dano',             icon: 'item-pp-up', color: 0x7744ff },
  upgradeAirSlash:     { id: 'upgradeAirSlash',     name: 'Air Slash+',      description: 'Mais lâminas e dano',            icon: 'item-pp-up', color: 0x88ccff },
  upgradeFlareBlitz:   { id: 'upgradeFlareBlitz',   name: 'Flare Blitz+',    description: 'Mais dano, menos recoil',        icon: 'item-pp-up', color: 0xff0000 },
  upgradeHurricane:    { id: 'upgradeHurricane',    name: 'Hurricane+',      description: 'Mais duração e dano',            icon: 'item-pp-up', color: 0x88ccff },
  upgradeOutrage:      { id: 'upgradeOutrage',      name: 'Outrage+',        description: 'Mais duração, menos confusão',   icon: 'item-pp-up', color: 0x7744ff },
  upgradeHeatWave:     { id: 'upgradeHeatWave',     name: 'Heat Wave+',      description: 'Mais raio e dano',               icon: 'item-pp-up', color: 0xff4400 },
  upgradeDracoMeteor:  { id: 'upgradeDracoMeteor',  name: 'Draco Meteor+',   description: 'Mais meteoros e explosão',        icon: 'item-pp-up', color: 0x9966ff },
  // Stats passivos
  maxHpUp:         { id: 'maxHpUp',         name: 'Leftovers',     description: '+25 HP máximo',                icon: 'item-leftovers',    color: 0xff4444 },
  speedUp:         { id: 'speedUp',         name: 'Quick Claw',    description: '+15% velocidade de movimento', icon: 'item-quick-claw',   color: 0x44aaff },
  magnetUp:        { id: 'magnetUp',        name: 'Magnet',        description: '+40% alcance de coleta de XP', icon: 'item-magnet',       color: 0xaa44ff },
  // Held Items como upgrades
  itemCharcoal:    { id: 'itemCharcoal',    name: 'Charcoal',      description: '+10% dano de fogo',            icon: 'item-charcoal',     color: 0xff6600 },
  itemWideLens:    { id: 'itemWideLens',    name: 'Wide Lens',     description: '+10% área de efeito',          icon: 'item-wide-lens',    color: 0x44aaff },
  itemChoiceSpecs: { id: 'itemChoiceSpecs', name: 'Choice Specs',  description: '+8% dano geral',               icon: 'item-choice-specs', color: 0xaa44ff },
  itemDragonFang:  { id: 'itemDragonFang',  name: 'Dragon Fang',   description: '+10% dano dragon',             icon: 'item-dragon-fang',  color: 0x7744ff },
  itemSharpBeak:   { id: 'itemSharpBeak',   name: 'Sharp Beak',    description: '+10% dano flying',             icon: 'item-sharp-beak',   color: 0x88ccff },
  itemScopeLens:   { id: 'itemScopeLens',   name: 'Scope Lens',    description: '+5% chance de crítico',        icon: 'item-scope-lens',   color: 0xff44aa },
  itemRazorClaw:   { id: 'itemRazorClaw',   name: 'Razor Claw',    description: '+15% dano crítico',            icon: 'item-razor-claw',   color: 0xcc4444 },
  itemShellBell:   { id: 'itemShellBell',   name: 'Shell Bell',    description: '+1.5% lifesteal',              icon: 'item-shell-bell',   color: 0xffcc44 },
  itemFocusBand:   { id: 'itemFocusBand',   name: 'Focus Band',    description: 'Sobrevive golpe fatal',        icon: 'item-focus-band',   color: 0xff8800 },
  // Evoluções
  evolveInferno:   { id: 'evolveInferno',   name: 'EVO: Inferno',      description: 'Ember evolui!',      icon: 'item-fire-stone', color: 0xff4400 },
  evolveFireBlast: { id: 'evolveFireBlast', name: 'EVO: Fire Blast',   description: 'Fire Spin evolui!',  icon: 'item-fire-stone', color: 0xff8800 },
  evolveBlastBurn: { id: 'evolveBlastBurn', name: 'EVO: Blast Burn',   description: 'Flamethrower evolui!', icon: 'item-fire-stone', color: 0xff0000 },
  evolveFurySwipes: { id: 'evolveFurySwipes', name: 'EVO: Fury Swipes', description: 'Scratch evolui!',    icon: 'item-fire-stone', color: 0xcccccc },
  evolveBlazeKick:  { id: 'evolveBlazeKick',  name: 'EVO: Blaze Kick',  description: 'Fire Fang evolui!',  icon: 'item-fire-stone', color: 0xff6600 },
  evolveFlareRush:  { id: 'evolveFlareRush',  name: 'EVO: Flare Rush',  description: 'Flame Charge evolui!', icon: 'item-fire-stone', color: 0xff4400 },
  evolveDragonPulse: { id: 'evolveDragonPulse', name: 'EVO: Dragon Pulse', description: 'Dragon Breath evolui!', icon: 'item-fire-stone', color: 0x7744ff },
  evolveNightSlash:  { id: 'evolveNightSlash',  name: 'EVO: Night Slash',  description: 'Slash evolui!',      icon: 'item-fire-stone', color: 0x444466 },
  evolveDragonRush:  { id: 'evolveDragonRush',  name: 'EVO: Dragon Rush',  description: 'Dragon Claw evolui!', icon: 'item-fire-stone', color: 0x7744ff },
  evolveAerialAce:   { id: 'evolveAerialAce',   name: 'EVO: Aerial Ace',   description: 'Air Slash evolui!',  icon: 'item-fire-stone', color: 0x88ccff },
} as const;
