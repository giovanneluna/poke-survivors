import type { PhaseConfig } from '../../../types';

/** Coast Sub-Phase 3 — 20:00 to 30:00, 20 waves + 3 bosses
 *  Elite Route: SP1+SP2 commons intensified, recycled elites (Haunter, Machop) */
export const COAST_SP3: PhaseConfig = {
  waves: [
    // Wave 40 (20:00): Haunter + Machop recycled join, elite mix
    { enemies: [{ type: 'haunter', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'pikachu', weight: 1 }, { type: 'krabby', weight: 1 }],
      spawnRate: 80, maxEnemies: 165 },
    // Wave 41 (20:30): Status overload
    { enemies: [{ type: 'psyduck', weight: 2 }, { type: 'jigglypuff', weight: 2 }, { type: 'grimer-p2', weight: 1 }, { type: 'haunter', weight: 1 }],
      spawnRate: 78, maxEnemies: 170 },
    // Wave 42 (21:00): Tank + confuser combo
    { enemies: [{ type: 'slowpoke', weight: 2 }, { type: 'exeggcute', weight: 2 }, { type: 'shellder', weight: 1 }, { type: 'machop', weight: 1 }],
      spawnRate: 75, maxEnemies: 175 },

    // ── BOSS: Rapidash @ 28:00 ──

    // Wave 43 (21:30): Charger swarm
    { enemies: [{ type: 'growlithe', weight: 2 }, { type: 'doduo', weight: 2 }, { type: 'ponyta', weight: 2 }, { type: 'pikachu', weight: 1 }],
      spawnRate: 72, maxEnemies: 178 },
    // Wave 44 (22:00): Berserker wave
    { enemies: [{ type: 'krabby', weight: 3 }, { type: 'farfetchd', weight: 2 }, { type: 'machop', weight: 1 }, { type: 'haunter', weight: 1 }],
      spawnRate: 70, maxEnemies: 180 },
    // Wave 45 (22:30): Poison swamp
    { enemies: [{ type: 'grimer-p2', weight: 3 }, { type: 'oddish', weight: 2 }, { type: 'bellsprout', weight: 1 }],
      spawnRate: 68, maxEnemies: 182 },
    // Wave 46 (23:00): Water elite wall
    { enemies: [{ type: 'slowpoke', weight: 3 }, { type: 'shellder', weight: 2 }, { type: 'seel', weight: 1 }, { type: 'staryu', weight: 1 }],
      spawnRate: 65, maxEnemies: 185 },
    // Wave 47 (23:30): Fire + psychic assault
    { enemies: [{ type: 'vulpix', weight: 2 }, { type: 'ponyta', weight: 2 }, { type: 'psyduck', weight: 2 }, { type: 'exeggcute', weight: 1 }],
      spawnRate: 62, maxEnemies: 188 },

    // ── BOSS: Starmie @ 32:00 ──

    // Wave 48 (24:00): Golbat recycled joins
    { enemies: [{ type: 'golbat', weight: 2 }, { type: 'haunter', weight: 2 }, { type: 'doduo', weight: 1 }, { type: 'pikachu', weight: 1 }],
      spawnRate: 100, maxEnemies: 90 },
    // Wave 49 (24:30): Speed rush
    { enemies: [{ type: 'ponyta', weight: 3 }, { type: 'doduo', weight: 2 }, { type: 'pikachu', weight: 2 }, { type: 'golbat', weight: 1 }],
      spawnRate: 95, maxEnemies: 92 },
    // Wave 50 (25:00): Confusion hell
    { enemies: [{ type: 'psyduck', weight: 3 }, { type: 'exeggcute', weight: 2 }, { type: 'jigglypuff', weight: 2 }],
      spawnRate: 92, maxEnemies: 95 },
    // Wave 51 (25:30): Tank + berserker
    { enemies: [{ type: 'sandshrew', weight: 2 }, { type: 'geodude', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'farfetchd', weight: 1 }],
      spawnRate: 90, maxEnemies: 98 },
    // Wave 52 (26:00): Mixed elite all types
    { enemies: [{ type: 'haunter', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'golbat', weight: 1 }, { type: 'grimer-p2', weight: 2 }],
      spawnRate: 88, maxEnemies: 100 },
    // Wave 53 (26:30): Teleporter + swooper chaos
    { enemies: [{ type: 'diglett', weight: 2 }, { type: 'meowth', weight: 2 }, { type: 'goldeen', weight: 2 }, { type: 'ponyta', weight: 1 }],
      spawnRate: 85, maxEnemies: 105 },

    // ── BOSS: Slowbro @ 36:00 ──

    // Wave 54 (27:00): Ranged army
    { enemies: [{ type: 'horsea', weight: 3 }, { type: 'haunter', weight: 2 }, { type: 'staryu', weight: 2 }],
      spawnRate: 80, maxEnemies: 110 },
    // Wave 55 (27:30): Everything intensified
    { enemies: [{ type: 'ponyta', weight: 2 }, { type: 'growlithe', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'machop', weight: 1 }, { type: 'golbat', weight: 1 }],
      spawnRate: 75, maxEnemies: 115 },
    // Wave 56 (28:00): Tank fortress
    { enemies: [{ type: 'slowpoke', weight: 3 }, { type: 'shellder', weight: 3 }, { type: 'geodude', weight: 2 }],
      spawnRate: 72, maxEnemies: 118 },
    // Wave 57 (28:30): Status + speed
    { enemies: [{ type: 'psyduck', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'pikachu', weight: 2 }, { type: 'doduo', weight: 2 }],
      spawnRate: 68, maxEnemies: 120 },
    // Wave 58 (29:00): Peak SP3
    { enemies: [{ type: 'haunter', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'golbat', weight: 1 }, { type: 'farfetchd', weight: 1 }],
      spawnRate: 65, maxEnemies: 125 },
    // Wave 59 (29:30): Final SP3
    { enemies: [{ type: 'ponyta', weight: 2 }, { type: 'exeggcute', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'haunter', weight: 1 }, { type: 'machop', weight: 1 }, { type: 'golbat', weight: 1 }],
      spawnRate: 60, maxEnemies: 130 },
  ],

  bosses: [
    { type: 'rapidash', timeSeconds: 1680 },    // 28:00
    { type: 'starmie', timeSeconds: 1920 },      // 32:00
    { type: 'slowbro', timeSeconds: 2160 },      // 36:00
  ],
};
