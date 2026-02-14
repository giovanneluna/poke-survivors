import type { PhaseConfig } from '../../../types';

/** Coast Sub-Phase 1 — 0:00 to 10:00, 20 waves + 3 bosses
 *  Kanto Route theme: Pikachu, Sandshrew, Growlithe, Poliwag, Bellsprout etc. */
export const COAST_SP1: PhaseConfig = {
  waves: [
    // Wave 0 (0:00): Intro fácil — Pikachu + Poliwag
    { enemies: [{ type: 'pikachu', weight: 2 }, { type: 'poliwag', weight: 2 }, { type: 'bellsprout', weight: 1 }],
      spawnRate: 1200, maxEnemies: 30 },
    // Wave 1 (0:30): + Sandshrew tank
    { enemies: [{ type: 'pikachu', weight: 2 }, { type: 'poliwag', weight: 1 }, { type: 'sandshrew', weight: 2 }, { type: 'bellsprout', weight: 1 }],
      spawnRate: 900, maxEnemies: 40 },
    // Wave 2 (1:00): Growlithe charger entra
    { enemies: [{ type: 'growlithe', weight: 2 }, { type: 'pikachu', weight: 2 }, { type: 'sandshrew', weight: 1 }],
      spawnRate: 750, maxEnemies: 50 },
    // Wave 3 (1:30): Vulpix circler + Diglett teleporter
    { enemies: [{ type: 'vulpix', weight: 2 }, { type: 'diglett', weight: 1 }, { type: 'growlithe', weight: 1 }, { type: 'poliwag', weight: 1 }],
      spawnRate: 650, maxEnemies: 55 },
    // Wave 4 (2:00): Meowth swooper (coin dropper!)
    { enemies: [{ type: 'meowth', weight: 2 }, { type: 'vulpix', weight: 1 }, { type: 'pikachu', weight: 2 }],
      spawnRate: 550, maxEnemies: 60 },
    // Wave 5 (2:30): Diglett + Sandshrew combo
    { enemies: [{ type: 'diglett', weight: 2 }, { type: 'sandshrew', weight: 2 }, { type: 'meowth', weight: 1 }],
      spawnRate: 500, maxEnemies: 65 },
    // Wave 6 (3:00): Ponyta swooper entra
    { enemies: [{ type: 'ponyta', weight: 2 }, { type: 'growlithe', weight: 2 }, { type: 'vulpix', weight: 1 }],
      spawnRate: 450, maxEnemies: 70 },
    // Wave 7 (3:30): Pre-boss rush — Jigglypuff entra
    { enemies: [{ type: 'ponyta', weight: 2 }, { type: 'jigglypuff', weight: 1 }, { type: 'pikachu', weight: 2 }, { type: 'growlithe', weight: 1 }],
      spawnRate: 400, maxEnemies: 75 },

    // ── BOSS: Arcanine @ 4:00 ──

    // Wave 8 (4:00): Zubat recycled entra + Doduo charger
    { enemies: [{ type: 'zubat', weight: 2 }, { type: 'doduo', weight: 2 }, { type: 'ponyta', weight: 1 }, { type: 'meowth', weight: 1 }],
      spawnRate: 380, maxEnemies: 80 },
    // Wave 9 (4:30): Doduo + Pikachu rush
    { enemies: [{ type: 'doduo', weight: 3 }, { type: 'pikachu', weight: 2 }, { type: 'vulpix', weight: 1 }],
      spawnRate: 350, maxEnemies: 80 },
    // Wave 10 (5:00): Farfetch'd berserker + Geodude recycled
    { enemies: [{ type: 'farfetchd', weight: 2 }, { type: 'geodude', weight: 2 }, { type: 'ponyta', weight: 1 }, { type: 'jigglypuff', weight: 1 }],
      spawnRate: 330, maxEnemies: 85 },
    // Wave 11 (5:30): Farfetch'd + tanks
    { enemies: [{ type: 'farfetchd', weight: 2 }, { type: 'sandshrew', weight: 2 }, { type: 'geodude', weight: 2 }],
      spawnRate: 300, maxEnemies: 85 },

    // ── BOSS: Ninetales @ 8:00 ──

    // Wave 12 (6:00): Full SP1 roster
    { enemies: [{ type: 'pikachu', weight: 1 }, { type: 'growlithe', weight: 2 }, { type: 'ponyta', weight: 2 }, { type: 'doduo', weight: 1 }],
      spawnRate: 280, maxEnemies: 90 },
    // Wave 13 (6:30): Fire trio dominates
    { enemies: [{ type: 'vulpix', weight: 2 }, { type: 'growlithe', weight: 2 }, { type: 'ponyta', weight: 2 }],
      spawnRate: 260, maxEnemies: 90 },
    // Wave 14 (7:00): Charger swarm
    { enemies: [{ type: 'doduo', weight: 3 }, { type: 'growlithe', weight: 2 }, { type: 'farfetchd', weight: 1 }],
      spawnRate: 250, maxEnemies: 95 },
    // Wave 15 (7:30): Confuser wave
    { enemies: [{ type: 'jigglypuff', weight: 2 }, { type: 'diglett', weight: 2 }, { type: 'zubat', weight: 2 }],
      spawnRate: 230, maxEnemies: 95 },

    // ── BOSS: Victreebel @ 12:00 ──

    // Wave 16 (8:00): All basic types mixed
    { enemies: [{ type: 'meowth', weight: 2 }, { type: 'pikachu', weight: 2 }, { type: 'sandshrew', weight: 1 }, { type: 'bellsprout', weight: 1 }],
      spawnRate: 220, maxEnemies: 100 },
    // Wave 17 (8:30): Speed wave
    { enemies: [{ type: 'ponyta', weight: 3 }, { type: 'doduo', weight: 2 }, { type: 'pikachu', weight: 1 }],
      spawnRate: 200, maxEnemies: 100 },
    // Wave 18 (9:00): Tank + healer
    { enemies: [{ type: 'sandshrew', weight: 3 }, { type: 'geodude', weight: 2 }, { type: 'bellsprout', weight: 2 }],
      spawnRate: 190, maxEnemies: 105 },
    // Wave 19 (9:30): Final SP1 — everything
    { enemies: [{ type: 'growlithe', weight: 2 }, { type: 'ponyta', weight: 2 }, { type: 'farfetchd', weight: 1 }, { type: 'jigglypuff', weight: 1 }, { type: 'pikachu', weight: 1 }],
      spawnRate: 180, maxEnemies: 110 },
  ],

  bosses: [
    { type: 'arcanine', timeSeconds: 240 },    // 4:00
    { type: 'ninetales', timeSeconds: 480 },    // 8:00
    { type: 'victreebel', timeSeconds: 720 },   // 12:00
  ],
};
