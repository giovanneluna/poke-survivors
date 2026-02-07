import type { EnemyConfig, AttackConfig, WaveConfig, SpriteConfig } from './types';

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
  rattata:    { key: 'rattata-walk',    path: 'assets/pokemon/rattata-walk.png',    frameWidth: 48, frameHeight: 40, frameCount: 7, directions: 8 },
  pidgey:     { key: 'pidgey-walk',     path: 'assets/pokemon/pidgey-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 5, directions: 8 },
  zubat:      { key: 'zubat-walk',      path: 'assets/pokemon/zubat-walk.png',      frameWidth: 32, frameHeight: 56, frameCount: 8, directions: 8 },
  geodude:    { key: 'geodude-walk',    path: 'assets/pokemon/geodude-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4, directions: 8 },
  gastly:     { key: 'gastly-walk',     path: 'assets/pokemon/gastly-walk.png',     frameWidth: 48, frameHeight: 64, frameCount: 12, directions: 8 },
} as const;

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
  zubat:    { key: 'zubat',    name: 'Zubat',    sprite: SPRITES.zubat,    hp: 12, speed: 105, damage: 4,  xpValue: 4,  scale: 0.8 },
  geodude:  { key: 'geodude',  name: 'Geodude',  sprite: SPRITES.geodude,  hp: 50, speed: 38,  damage: 15, xpValue: 10, scale: 1.0 },
  gastly:   { key: 'gastly',   name: 'Gastly',   sprite: SPRITES.gastly,   hp: 25, speed: 72,  damage: 10, xpValue: 8,  scale: 0.7 },
} as const;

// ── Definições dos ataques ─────────────────────────────────────────
export const ATTACKS: Readonly<Record<string, AttackConfig>> = {
  ember:        { key: 'ember',        name: 'Ember',        description: 'Bolas de fogo no inimigo mais próximo',       baseDamage: 10, baseCooldown: 1200 },
  fireSpin:     { key: 'fireSpin',     name: 'Fire Spin',    description: 'Orbes de fogo orbitam ao seu redor',          baseDamage: 7,  baseCooldown: 400  },
  flamethrower: { key: 'flamethrower', name: 'Flamethrower', description: 'Explosão de fogo na direção do movimento',   baseDamage: 22, baseCooldown: 2800 },
} as const;

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
} as const;
