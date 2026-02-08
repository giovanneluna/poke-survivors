import type { PhaseConfig } from '../../../types';

/** Phase 1 — Fire Red: 10 minutos, 20 waves + 4 bosses */
export const PHASE1: PhaseConfig = {
  waves: [
    // Wave 0 (0:00): Intro fácil
    { enemies: [{ type: 'rattata', weight: 3 }, { type: 'caterpie', weight: 1 }],
      spawnRate: 1200, maxEnemies: 30 },
    // Wave 1 (0:30): Mais variedade
    { enemies: [{ type: 'rattata', weight: 2 }, { type: 'caterpie', weight: 1 }, { type: 'weedle', weight: 1 }, { type: 'pidgey', weight: 1 }],
      spawnRate: 900, maxEnemies: 40 },
    // Wave 2 (1:00): Zubat entra — mob count sobe
    { enemies: [{ type: 'pidgey', weight: 2 }, { type: 'weedle', weight: 2 }, { type: 'zubat', weight: 1 }],
      spawnRate: 750, maxEnemies: 50 },
    // Wave 3 (1:30): Geodude entra
    { enemies: [{ type: 'zubat', weight: 2 }, { type: 'geodude', weight: 1 }, { type: 'pidgey', weight: 1 }, { type: 'rattata', weight: 1 }],
      spawnRate: 650, maxEnemies: 55 },
    // Wave 4 (2:00): Spearow entra
    { enemies: [{ type: 'geodude', weight: 2 }, { type: 'zubat', weight: 2 }, { type: 'spearow', weight: 1 }],
      spawnRate: 550, maxEnemies: 60 },
    // Wave 5 (2:30): Ekans entra
    { enemies: [{ type: 'geodude', weight: 2 }, { type: 'spearow', weight: 2 }, { type: 'ekans', weight: 1 }],
      spawnRate: 500, maxEnemies: 65 },
    // Wave 6 (3:00): Ekans + Spearow dominam
    { enemies: [{ type: 'ekans', weight: 2 }, { type: 'spearow', weight: 1 }, { type: 'zubat', weight: 1 }],
      spawnRate: 450, maxEnemies: 70 },
    // Wave 7 (3:30): Pre-boss rush
    { enemies: [{ type: 'ekans', weight: 2 }, { type: 'geodude', weight: 2 }, { type: 'spearow', weight: 1 }],
      spawnRate: 400, maxEnemies: 75 },

    // ── BOSS: Raticate @ 4:00 ──

    // Wave 8 (4:00): Oddish + Mankey entram
    { enemies: [{ type: 'oddish', weight: 2 }, { type: 'mankey', weight: 1 }, { type: 'ekans', weight: 1 }, { type: 'spearow', weight: 1 }],
      spawnRate: 380, maxEnemies: 80 },
    // Wave 9 (4:30): Mankey dominante
    { enemies: [{ type: 'mankey', weight: 2 }, { type: 'oddish', weight: 2 }, { type: 'geodude', weight: 1 }],
      spawnRate: 350, maxEnemies: 80 },
    // Wave 10 (5:00): Gastly retorna
    { enemies: [{ type: 'gastly', weight: 1 }, { type: 'mankey', weight: 2 }, { type: 'oddish', weight: 1 }],
      spawnRate: 330, maxEnemies: 85 },
    // Wave 11 (5:30): Gastly + Geodude
    { enemies: [{ type: 'gastly', weight: 2 }, { type: 'geodude', weight: 1 }, { type: 'mankey', weight: 1 }],
      spawnRate: 300, maxEnemies: 85 },

    // ── BOSS: Arbok @ 6:00 ──

    // Wave 12 (6:00): Haunter + Machop entram
    { enemies: [{ type: 'haunter', weight: 2 }, { type: 'machop', weight: 1 }, { type: 'gastly', weight: 1 }],
      spawnRate: 280, maxEnemies: 90 },
    // Wave 13 (6:30): Elite dominante
    { enemies: [{ type: 'haunter', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'mankey', weight: 1 }],
      spawnRate: 260, maxEnemies: 90 },
    // Wave 14 (7:00): Mix pesado
    { enemies: [{ type: 'machop', weight: 2 }, { type: 'haunter', weight: 1 }, { type: 'gastly', weight: 1 }, { type: 'geodude', weight: 1 }],
      spawnRate: 250, maxEnemies: 95 },
    // Wave 15 (7:30): Pre-boss rush
    { enemies: [{ type: 'haunter', weight: 3 }, { type: 'machop', weight: 2 }],
      spawnRate: 230, maxEnemies: 95 },

    // ── BOSS: Nidoking @ 8:00 ──

    // Wave 16 (8:00): Golbat entra
    { enemies: [{ type: 'golbat', weight: 2 }, { type: 'haunter', weight: 2 }, { type: 'machop', weight: 1 }],
      spawnRate: 220, maxEnemies: 100 },
    // Wave 17 (8:30): Golbat + Haunter
    { enemies: [{ type: 'golbat', weight: 3 }, { type: 'haunter', weight: 2 }, { type: 'geodude', weight: 1 }],
      spawnRate: 200, maxEnemies: 100 },
    // Wave 18 (9:00): Endgame mix
    { enemies: [{ type: 'golbat', weight: 2 }, { type: 'machop', weight: 2 }, { type: 'haunter', weight: 2 }],
      spawnRate: 190, maxEnemies: 105 },
    // Wave 19 (9:30): Final wave — tudo ao máximo
    { enemies: [{ type: 'golbat', weight: 3 }, { type: 'haunter', weight: 3 }, { type: 'machop', weight: 2 }],
      spawnRate: 180, maxEnemies: 110 },

    // ── BOSS: Snorlax @ 10:00 ──
  ],

  bosses: [
    { type: 'raticate', timeSeconds: 240 },
    { type: 'arbok',    timeSeconds: 360 },
    { type: 'nidoking', timeSeconds: 480 },
    { type: 'snorlax',  timeSeconds: 600 },
  ],
};
