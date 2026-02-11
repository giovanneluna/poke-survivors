import { SPRITES } from './sprites';
import type { Difficulty, DifficultyConfig } from '../types';

export const GAME = {
  width: 800,
  height: 600,
  worldWidth: 3000,
  worldHeight: 3000,
  tileSize: 24,
} as const;

export const PLAYER = {
  startHp: 130,
  startSpeed: 160,
  startMagnetRange: 60,
  invincibilityMs: 500,
  baseXpToLevel: 25,
  xpScaleFactor: 1.25,
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

export const DIFFICULTY: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: {
    label: 'FÁCIL',
    description: 'Menos inimigos\nMais XP · ₽ ×0.3',
    color: 0x44bb44,
    spawnRateMultiplier: 1.5,
    maxEnemiesMultiplier: 0.5,
    xpMultiplier: 2.0,
    coinMultiplier: 0.3,
  },
  medium: {
    label: 'MÉDIO',
    description: 'Inimigos moderados\nXP alto · ₽ ×0.5',
    color: 0xffaa00,
    spawnRateMultiplier: 1.25,
    maxEnemiesMultiplier: 0.75,
    xpMultiplier: 1.5,
    coinMultiplier: 0.5,
  },
  hard: {
    label: 'DIFÍCIL',
    description: 'Máximo de inimigos\nXP e ₽ padrão',
    color: 0xff4444,
    spawnRateMultiplier: 1.0,
    maxEnemiesMultiplier: 1.0,
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
  },
} as const;
