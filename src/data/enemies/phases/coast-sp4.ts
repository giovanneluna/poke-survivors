import type { PhaseConfig } from '../../../types';

/** Coast Sub-Phase 4 — 30:00 to 52:00, 20 waves + 4 bosses (including final Lapras)
 *  Final Challenge: All elites together, max intensity, boss gauntlet */
export const COAST_SP4: PhaseConfig = {
  waves: [
    // Wave 60 (30:00): Full elite roster — all types present
    { enemies: [{ type: 'pikachu', weight: 2 }, { type: 'growlithe', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'haunter', weight: 1 }, { type: 'machop', weight: 1 }],
      spawnRate: 150, maxEnemies: 40 },
    // Wave 61 (30:30): Status overload
    { enemies: [{ type: 'psyduck', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'exeggcute', weight: 2 }, { type: 'jigglypuff', weight: 1 }],
      spawnRate: 145, maxEnemies: 42 },
    // Wave 62 (31:00): Speed + charger rush
    { enemies: [{ type: 'ponyta', weight: 3 }, { type: 'doduo', weight: 2 }, { type: 'pikachu', weight: 2 }, { type: 'golbat', weight: 1 }],
      spawnRate: 140, maxEnemies: 44 },
    // Wave 63 (31:30): Tank + confusion
    { enemies: [{ type: 'slowpoke', weight: 3 }, { type: 'shellder', weight: 2 }, { type: 'psyduck', weight: 2 }, { type: 'machop', weight: 1 }],
      spawnRate: 135, maxEnemies: 46 },
    // Wave 64 (32:00): Fire barrage
    { enemies: [{ type: 'vulpix', weight: 2 }, { type: 'growlithe', weight: 3 }, { type: 'ponyta', weight: 2 }, { type: 'haunter', weight: 1 }],
      spawnRate: 130, maxEnemies: 48 },
    // Wave 65 (32:30): Pre-boss — berserker hell
    { enemies: [{ type: 'krabby', weight: 3 }, { type: 'farfetchd', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'golbat', weight: 1 }],
      spawnRate: 125, maxEnemies: 50 },

    // ── BOSS: Poliwrath @ 40:00 ──

    // Wave 66 (33:00): Post-boss recovery
    { enemies: [{ type: 'seel', weight: 2 }, { type: 'staryu', weight: 2 }, { type: 'goldeen', weight: 2 }, { type: 'horsea', weight: 1 }],
      spawnRate: 120, maxEnemies: 52 },
    // Wave 67 (33:30): Teleporter + swooper chaos
    { enemies: [{ type: 'diglett', weight: 3 }, { type: 'meowth', weight: 2 }, { type: 'pikachu', weight: 2 }],
      spawnRate: 115, maxEnemies: 54 },
    // Wave 68 (34:00): Poison + confusion duo
    { enemies: [{ type: 'grimer-p2', weight: 3 }, { type: 'psyduck', weight: 2 }, { type: 'exeggcute', weight: 2 }],
      spawnRate: 110, maxEnemies: 56 },
    // Wave 69 (34:30): Tank fortress max
    { enemies: [{ type: 'slowpoke', weight: 3 }, { type: 'shellder', weight: 3 }, { type: 'sandshrew', weight: 2 }, { type: 'geodude', weight: 1 }],
      spawnRate: 105, maxEnemies: 58 },
    // Wave 70 (35:00): All chargers
    { enemies: [{ type: 'growlithe', weight: 3 }, { type: 'doduo', weight: 3 }, { type: 'ponyta', weight: 2 }],
      spawnRate: 100, maxEnemies: 60 },
    // Wave 71 (35:30): Pre-boss surge — mixed
    { enemies: [{ type: 'haunter', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'golbat', weight: 2 }, { type: 'krabby', weight: 2 }],
      spawnRate: 95, maxEnemies: 62 },

    // ── BOSS: Snorlax @ 44:00 (recycled) ──
    // ── BOSS: Gengar @ 48:00 (recycled) ──

    // Wave 72 (36:00): Endgame — everything weight 2+
    { enemies: [{ type: 'pikachu', weight: 2 }, { type: 'growlithe', weight: 2 }, { type: 'krabby', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'farfetchd', weight: 2 }],
      spawnRate: 90, maxEnemies: 65 },
    // Wave 73 (36:30): Full roster weight 2
    { enemies: [{ type: 'ponyta', weight: 2 }, { type: 'psyduck', weight: 2 }, { type: 'exeggcute', weight: 2 }, { type: 'jigglypuff', weight: 2 }],
      spawnRate: 85, maxEnemies: 68 },
    // Wave 74 (37:00): Ranged + status
    { enemies: [{ type: 'horsea', weight: 3 }, { type: 'haunter', weight: 2 }, { type: 'staryu', weight: 2 }, { type: 'goldeen', weight: 1 }],
      spawnRate: 80, maxEnemies: 70 },
    // Wave 75 (37:30): Speed swarm
    { enemies: [{ type: 'doduo', weight: 3 }, { type: 'pikachu', weight: 3 }, { type: 'ponyta', weight: 3 }, { type: 'golbat', weight: 1 }],
      spawnRate: 75, maxEnemies: 72 },
    // Wave 76 (38:00): Everything weight 2-3
    { enemies: [{ type: 'krabby', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'slowpoke', weight: 2 }, { type: 'haunter', weight: 2 }, { type: 'farfetchd', weight: 2 }],
      spawnRate: 72, maxEnemies: 75 },
    // Wave 77 (38:30): Pre-final chaos
    { enemies: [{ type: 'psyduck', weight: 3 }, { type: 'exeggcute', weight: 3 }, { type: 'jigglypuff', weight: 2 }, { type: 'pikachu', weight: 2 }],
      spawnRate: 68, maxEnemies: 78 },

    // ── Pre-Final Boss ──

    // Wave 78 (39:00): Final wave — all types max
    { enemies: [{ type: 'growlithe', weight: 3 }, { type: 'krabby', weight: 3 }, { type: 'ponyta', weight: 2 }, { type: 'haunter', weight: 2 }, { type: 'grimer-p2', weight: 2 }, { type: 'machop', weight: 2 }],
      spawnRate: 65, maxEnemies: 80 },
    // Wave 79 (39:30): Victory lap
    { enemies: [{ type: 'pikachu', weight: 2 }, { type: 'doduo', weight: 2 }, { type: 'ponyta', weight: 3 }, { type: 'krabby', weight: 3 }, { type: 'psyduck', weight: 2 }, { type: 'grimer-p2', weight: 3 }, { type: 'farfetchd', weight: 2 }, { type: 'golbat', weight: 1 }],
      spawnRate: 60, maxEnemies: 85 },
  ],

  bosses: [
    { type: 'poliwrath', timeSeconds: 2400 },    // 40:00
    { type: 'snorlax', timeSeconds: 2640 },       // 44:00 (recycled)
    { type: 'gengar', timeSeconds: 2880 },         // 48:00 (recycled)
    // ── BOSS FINAL: Lapras — Ice/Water Tank Supremo ──
    { type: 'lapras', timeSeconds: 3120 },         // 52:00
  ],
};
