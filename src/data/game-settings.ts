import { SPRITES } from './sprites';

export const GAME = {
  width: 800,
  height: 600,
  worldWidth: 3000,
  worldHeight: 3000,
  tileSize: 24,
} as const;

export const PLAYER = {
  startHp: 100,
  startSpeed: 160,
  startMagnetRange: 60,
  invincibilityMs: 500,
  baseXpToLevel: 20,
  xpScaleFactor: 1.35,
  sprite: SPRITES.charmander,
} as const;

export const SPAWN = {
  distanceFromPlayer: 500,
  despawnDistance: 900,
  difficultyIntervalMs: 30_000,
} as const;

export const XP_GEM = {
  magnetSpeed: 350,
  size: 5,
} as const;
