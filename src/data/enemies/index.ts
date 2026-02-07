import type { EnemyConfig, WaveConfig } from '../../types';
import { RATTATA } from './rattata';
import { PIDGEY } from './pidgey';
import { ZUBAT } from './zubat';
import { GEODUDE } from './geodude';
import { GASTLY } from './gastly';
import { CATERPIE } from './caterpie';
import { WEEDLE } from './weedle';

export const ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  rattata: RATTATA,
  pidgey: PIDGEY,
  zubat: ZUBAT,
  geodude: GEODUDE,
  gastly: GASTLY,
  caterpie: CATERPIE,
  weedle: WEEDLE,
} as const;

// Waves: 8 ondas, 30s cada (difficultyIntervalMs = 30_000)
// Gastly só aparece a partir da Wave 6 (~3 min)
// Caterpie/Weedle nas primeiras waves para variedade + slow
export const WAVES: readonly WaveConfig[] = [
  // Wave 0 (0:00): Intro fácil
  { enemies: [{ type: 'rattata', weight: 2 }, { type: 'caterpie', weight: 1 }],
    spawnRate: 1400, maxEnemies: 25 },
  // Wave 1 (0:30): Mais variedade
  { enemies: [{ type: 'rattata', weight: 2 }, { type: 'caterpie', weight: 1 }, { type: 'weedle', weight: 1 }, { type: 'pidgey', weight: 1 }],
    spawnRate: 1200, maxEnemies: 35 },
  // Wave 2 (1:00): Zubat aparece
  { enemies: [{ type: 'pidgey', weight: 2 }, { type: 'weedle', weight: 2 }, { type: 'zubat', weight: 1 }],
    spawnRate: 1000, maxEnemies: 45 },
  // Wave 3 (1:30): Geodude aparece
  { enemies: [{ type: 'zubat', weight: 2 }, { type: 'geodude', weight: 1 }, { type: 'pidgey', weight: 1 }, { type: 'rattata', weight: 1 }],
    spawnRate: 900, maxEnemies: 50 },
  // Wave 4 (2:00): Mais rocks
  { enemies: [{ type: 'geodude', weight: 2 }, { type: 'zubat', weight: 2 }, { type: 'weedle', weight: 1 }],
    spawnRate: 800, maxEnemies: 55 },
  // Wave 5 (2:30): Transição
  { enemies: [{ type: 'geodude', weight: 2 }, { type: 'zubat', weight: 1 }, { type: 'caterpie', weight: 1 }],
    spawnRate: 700, maxEnemies: 60 },
  // Wave 6 (3:00): Gastly entra!
  { enemies: [{ type: 'gastly', weight: 2 }, { type: 'geodude', weight: 1 }, { type: 'zubat', weight: 1 }],
    spawnRate: 600, maxEnemies: 65 },
  // Wave 7 (3:30+): Endgame
  { enemies: [{ type: 'gastly', weight: 3 }, { type: 'geodude', weight: 2 }],
    spawnRate: 500, maxEnemies: 70 },
] as const;
