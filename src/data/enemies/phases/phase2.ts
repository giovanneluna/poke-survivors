import type { PhaseConfig } from '../../../types';

/** Phase 2 — 10:00 to 20:00, 20 waves + 2 bosses */
export const PHASE2: PhaseConfig = {
  waves: [
    // Wave 20 (10:00): BIG INTRO — Metapod + Kakuna + Gloom (tank wall + healer)
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 2 }, { type: 'gloom', weight: 1 }, { type: 'haunter', weight: 1 }],
      spawnRate: 180, maxEnemies: 110 },
    // Wave 21 (10:30): Tanks consolidam, Gloom heala
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 1 }, { type: 'gloom', weight: 2 }, { type: 'machop', weight: 1 }],
      spawnRate: 170, maxEnemies: 115 },
    // Wave 22 (11:00): Pidgeotto entra como elite voador
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'gloom', weight: 1 }, { type: 'pidgeotto', weight: 1 }, { type: 'golbat', weight: 1 }],
      spawnRate: 160, maxEnemies: 120 },
    // Wave 23 (11:30): STATUS TRIO — Paras + Venonat + Drowzee (poison, confusion, stun)
    { enemies: [{ type: 'paras', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 155, maxEnemies: 125 },
    // Wave 24 (12:00): Status trio + tanks misturados
    { enemies: [{ type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 1 }, { type: 'paras', weight: 1 }, { type: 'metapod', weight: 1 }, { type: 'kakuna', weight: 1 }],
      spawnRate: 150, maxEnemies: 128 },
    // Wave 25 (12:30): Status + Gloom healer combo
    { enemies: [{ type: 'drowzee', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'gloom', weight: 2 }],
      spawnRate: 145, maxEnemies: 130 },
    // Wave 26 (13:00): CUBONE ENTERS — boomerang bones!
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 1 }, { type: 'paras', weight: 1 }],
      spawnRate: 140, maxEnemies: 132 },
    // Wave 27 (13:30): Tank rush + healers + boomerangs
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 2 }, { type: 'gloom', weight: 1 }, { type: 'cubone', weight: 1 }],
      spawnRate: 135, maxEnemies: 135 },
    // Wave 28 (14:00): Ranged dominance
    { enemies: [{ type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'cubone', weight: 2 }, { type: 'haunter', weight: 1 }],
      spawnRate: 130, maxEnemies: 138 },
    // Wave 29 (14:30): Pre-boss — full P2 roster maxed
    { enemies: [{ type: 'paras', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 125, maxEnemies: 140 },

    // ── BOSS: Beedrill @ 15:00 ──

    // Wave 30 (15:00): Post-boss intensity — Pidgeotto reforça
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'pidgeotto', weight: 1 }, { type: 'golbat', weight: 1 }],
      spawnRate: 120, maxEnemies: 142 },
    // Wave 31 (15:30): Status hell
    { enemies: [{ type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'paras', weight: 1 }],
      spawnRate: 115, maxEnemies: 145 },
    // Wave 32 (16:00): Tank + healer combo
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 112, maxEnemies: 148 },
    // Wave 33 (16:30): Mixed threat
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'paras', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'haunter', weight: 1 }],
      spawnRate: 108, maxEnemies: 150 },
    // Wave 34 (17:00): Boomerang + status
    { enemies: [{ type: 'cubone', weight: 3 }, { type: 'drowzee', weight: 2 }, { type: 'venonat', weight: 1 }],
      spawnRate: 105, maxEnemies: 152 },
    // Wave 35 (17:30): Pre-boss rush
    { enemies: [{ type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'cubone', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 100, maxEnemies: 155 },

    // ── BOSS: Vileplume @ 18:00 ──

    // Wave 36 (18:00): Endurance push
    { enemies: [{ type: 'paras', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'cubone', weight: 2 }, { type: 'golbat', weight: 1 }],
      spawnRate: 95, maxEnemies: 158 },
    // Wave 37 (18:30): Swarm
    { enemies: [{ type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'paras', weight: 2 }],
      spawnRate: 90, maxEnemies: 160 },
    // Wave 38 (19:00): Peak P2
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 85, maxEnemies: 162 },
    // Wave 39 (19:30): Final P2 — everything maxed
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 2 }, { type: 'paras', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 80, maxEnemies: 165 },
  ],

  bosses: [
    { type: 'beedrill',  timeSeconds: 900 },
    { type: 'fearow',    timeSeconds: 990 },
    { type: 'vileplume', timeSeconds: 1080 },
  ],
};
