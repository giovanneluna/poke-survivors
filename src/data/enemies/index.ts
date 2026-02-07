import type { EnemyConfig, WaveConfig } from '../../types';
import { RATTATA } from './rattata';
import { PIDGEY } from './pidgey';
import { ZUBAT } from './zubat';
import { GEODUDE } from './geodude';
import { GASTLY } from './gastly';

export const ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  rattata: RATTATA,
  pidgey: PIDGEY,
  zubat: ZUBAT,
  geodude: GEODUDE,
  gastly: GASTLY,
} as const;

export const WAVES: readonly WaveConfig[] = [
  { enemies: [{ type: 'rattata', weight: 1 }],                                                              spawnRate: 1400, maxEnemies: 30  },
  { enemies: [{ type: 'rattata', weight: 3 }, { type: 'pidgey', weight: 1 }],                               spawnRate: 1200, maxEnemies: 40  },
  { enemies: [{ type: 'rattata', weight: 2 }, { type: 'pidgey', weight: 2 }, { type: 'zubat', weight: 1 }], spawnRate: 1000, maxEnemies: 50  },
  { enemies: [{ type: 'pidgey', weight: 2 }, { type: 'zubat', weight: 2 }, { type: 'geodude', weight: 1 }], spawnRate: 800,  maxEnemies: 60  },
  { enemies: [{ type: 'zubat', weight: 2 }, { type: 'geodude', weight: 2 }, { type: 'gastly', weight: 1 }], spawnRate: 600,  maxEnemies: 80  },
  { enemies: [{ type: 'geodude', weight: 2 }, { type: 'gastly', weight: 3 }],                               spawnRate: 400,  maxEnemies: 100 },
] as const;
