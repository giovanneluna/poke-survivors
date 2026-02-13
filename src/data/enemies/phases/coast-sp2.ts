import type { PhaseConfig } from '../../../types';

/** Coast Sub-Phase 2 — 10:00 to 20:00, 20 waves + 3 bosses
 *  Seaside theme: Psyduck, Seel, Shellder, Horsea, Krabby, Slowpoke, Staryu, Grimer */
export const COAST_SP2: PhaseConfig = {
  waves: [
    // Wave 20 (10:00): Seaside intro — Psyduck + Seel + Shellder
    { enemies: [{ type: 'psyduck', weight: 2 }, { type: 'seel', weight: 2 }, { type: 'shellder', weight: 1 }, { type: 'poliwag', weight: 1 }],
      spawnRate: 180, maxEnemies: 110 },
    // Wave 21 (10:30): Horsea ranged + Krabby berserker
    { enemies: [{ type: 'horsea', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'psyduck', weight: 1 }, { type: 'seel', weight: 1 }],
      spawnRate: 170, maxEnemies: 115 },
    // Wave 22 (11:00): Slowpoke tank + Staryu circler
    { enemies: [{ type: 'slowpoke', weight: 2 }, { type: 'staryu', weight: 2 }, { type: 'shellder', weight: 1 }, { type: 'krabby', weight: 1 }],
      spawnRate: 160, maxEnemies: 120 },
    // Wave 23 (11:30): Grimer sporeWalker entra
    { enemies: [{ type: 'grimer-p2', weight: 2 }, { type: 'psyduck', weight: 2 }, { type: 'staryu', weight: 1 }, { type: 'horsea', weight: 1 }],
      spawnRate: 155, maxEnemies: 125 },
    // Wave 24 (12:00): Full seaside roster
    { enemies: [{ type: 'krabby', weight: 2 }, { type: 'shellder', weight: 1 }, { type: 'slowpoke', weight: 1 }, { type: 'grimer-p2', weight: 1 }, { type: 'seel', weight: 1 }],
      spawnRate: 150, maxEnemies: 128 },
    // Wave 25 (12:30): Confusion wave
    { enemies: [{ type: 'psyduck', weight: 3 }, { type: 'staryu', weight: 2 }, { type: 'grimer-p2', weight: 1 }],
      spawnRate: 145, maxEnemies: 130 },
    // Wave 26 (13:00): Goldeen swooper + Exeggcute confuser
    { enemies: [{ type: 'goldeen', weight: 2 }, { type: 'exeggcute', weight: 2 }, { type: 'krabby', weight: 1 }, { type: 'horsea', weight: 1 }],
      spawnRate: 140, maxEnemies: 132 },
    // Wave 27 (13:30): Oddish recycled + healer combo
    { enemies: [{ type: 'oddish', weight: 2 }, { type: 'bellsprout', weight: 1 }, { type: 'exeggcute', weight: 2 }, { type: 'slowpoke', weight: 1 }],
      spawnRate: 135, maxEnemies: 135 },
    // Wave 28 (14:00): Tank wall
    { enemies: [{ type: 'shellder', weight: 3 }, { type: 'slowpoke', weight: 2 }, { type: 'seel', weight: 1 }, { type: 'goldeen', weight: 1 }],
      spawnRate: 130, maxEnemies: 138 },
    // Wave 29 (14:30): Pre-boss — full SP2
    { enemies: [{ type: 'grimer-p2', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'horsea', weight: 1 }, { type: 'psyduck', weight: 1 }],
      spawnRate: 125, maxEnemies: 140 },

    // ── BOSS: Golduck @ 16:00 ──

    // Wave 30 (15:00): Post-boss intensity
    { enemies: [{ type: 'staryu', weight: 2 }, { type: 'goldeen', weight: 2 }, { type: 'exeggcute', weight: 1 }, { type: 'grimer-p2', weight: 1 }],
      spawnRate: 120, maxEnemies: 142 },
    // Wave 31 (15:30): Status hell — poison + confusion
    { enemies: [{ type: 'grimer-p2', weight: 2 }, { type: 'psyduck', weight: 2 }, { type: 'exeggcute', weight: 2 }],
      spawnRate: 115, maxEnemies: 145 },
    // Wave 32 (16:00): Slow wall
    { enemies: [{ type: 'slowpoke', weight: 3 }, { type: 'shellder', weight: 2 }, { type: 'seel', weight: 2 }],
      spawnRate: 112, maxEnemies: 148 },
    // Wave 33 (16:30): Berserker rush
    { enemies: [{ type: 'krabby', weight: 3 }, { type: 'goldeen', weight: 2 }, { type: 'staryu', weight: 1 }],
      spawnRate: 108, maxEnemies: 150 },
    // Wave 34 (17:00): Ranged domination
    { enemies: [{ type: 'horsea', weight: 3 }, { type: 'psyduck', weight: 2 }, { type: 'exeggcute', weight: 1 }],
      spawnRate: 105, maxEnemies: 152 },
    // Wave 35 (17:30): Pre-boss rush
    { enemies: [{ type: 'grimer-p2', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'slowpoke', weight: 1 }, { type: 'staryu', weight: 1 }],
      spawnRate: 100, maxEnemies: 155 },

    // ── BOSS: Cloyster @ 20:00 ──

    // Wave 36 (18:00): Endurance push
    { enemies: [{ type: 'goldeen', weight: 2 }, { type: 'exeggcute', weight: 2 }, { type: 'seel', weight: 1 }, { type: 'horsea', weight: 1 }],
      spawnRate: 95, maxEnemies: 158 },
    // Wave 37 (18:30): Swarm — water spam
    { enemies: [{ type: 'poliwag', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'staryu', weight: 2 }],
      spawnRate: 90, maxEnemies: 160 },
    // Wave 38 (19:00): Peak SP2
    { enemies: [{ type: 'grimer-p2', weight: 2 }, { type: 'psyduck', weight: 2 }, { type: 'exeggcute', weight: 1 }, { type: 'slowpoke', weight: 1 }],
      spawnRate: 85, maxEnemies: 162 },
    // Wave 39 (19:30): Final SP2
    { enemies: [{ type: 'krabby', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'shellder', weight: 1 }, { type: 'goldeen', weight: 1 }, { type: 'staryu', weight: 1 }],
      spawnRate: 80, maxEnemies: 165 },
  ],

  bosses: [
    { type: 'golduck', timeSeconds: 960 },     // 16:00
    { type: 'cloyster', timeSeconds: 1200 },    // 20:00
    { type: 'muk', timeSeconds: 1440 },         // 24:00
  ],
};
