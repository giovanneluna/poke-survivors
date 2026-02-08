import type { PhaseConfig } from '../../../types';

/** Phase 2 — 10:00 to 20:00, 20 waves + 2 bosses */
export const PHASE2: PhaseConfig = {
  waves: [
    // Wave 20 (10:00): BIG INTRO — Metapod + Kakuna + Gloom (tank wall + healer)
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 2 }, { type: 'gloom', weight: 1 }, { type: 'haunter', weight: 1 }],
      spawnRate: 400, maxEnemies: 60 },
    // Wave 21 (10:30): Tanks consolidam, Gloom heala
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 1 }, { type: 'gloom', weight: 2 }, { type: 'machop', weight: 1 }],
      spawnRate: 400, maxEnemies: 62 },
    // Wave 22 (11:00): Paras começa a aparecer com os tanks
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'gloom', weight: 1 }, { type: 'kakuna', weight: 1 }, { type: 'golbat', weight: 1 }],
      spawnRate: 380, maxEnemies: 65 },
    // Wave 23 (11:30): STATUS TRIO — Paras + Venonat + Drowzee (poison, confusion, stun)
    { enemies: [{ type: 'paras', weight: 2 }, { type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 370, maxEnemies: 68 },
    // Wave 24 (12:00): Status trio + tanks misturados
    { enemies: [{ type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 1 }, { type: 'paras', weight: 1 }, { type: 'metapod', weight: 1 }, { type: 'kakuna', weight: 1 }],
      spawnRate: 360, maxEnemies: 70 },
    // Wave 25 (12:30): Status + Gloom healer combo
    { enemies: [{ type: 'drowzee', weight: 2 }, { type: 'venonat', weight: 2 }, { type: 'gloom', weight: 2 }],
      spawnRate: 350, maxEnemies: 70 },
    // Wave 26 (13:00): CUBONE ENTERS — boomerang bones!
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'drowzee', weight: 1 }, { type: 'paras', weight: 1 }],
      spawnRate: 340, maxEnemies: 72 },
    // Wave 27 (13:30): Tank rush + healers + boomerangs
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 2 }, { type: 'gloom', weight: 1 }, { type: 'cubone', weight: 1 }],
      spawnRate: 330, maxEnemies: 72 },
    // Wave 28 (14:00): Ranged dominance
    { enemies: [{ type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'cubone', weight: 2 }, { type: 'haunter', weight: 1 }],
      spawnRate: 320, maxEnemies: 75 },
    // Wave 29 (14:30): Pre-boss — full P2 roster maxed
    { enemies: [{ type: 'paras', weight: 2 }, { type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 310, maxEnemies: 75 },

    // ── BOSS: Beedrill @ 15:00 ──

    // Wave 30 (15:00): Post-boss intensity
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'machop', weight: 1 }, { type: 'golbat', weight: 1 }],
      spawnRate: 300, maxEnemies: 78 },
    // Wave 31 (15:30): Status hell
    { enemies: [{ type: 'venonat', weight: 3 }, { type: 'drowzee', weight: 2 }, { type: 'paras', weight: 1 }],
      spawnRate: 290, maxEnemies: 78 },
    // Wave 32 (16:00): Tank + healer combo
    { enemies: [{ type: 'metapod', weight: 2 }, { type: 'kakuna', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 280, maxEnemies: 80 },
    // Wave 33 (16:30): Mixed threat
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'paras', weight: 2 }, { type: 'venonat', weight: 1 }, { type: 'haunter', weight: 1 }],
      spawnRate: 270, maxEnemies: 82 },
    // Wave 34 (17:00): Boomerang + status
    { enemies: [{ type: 'cubone', weight: 3 }, { type: 'drowzee', weight: 2 }, { type: 'venonat', weight: 1 }],
      spawnRate: 260, maxEnemies: 82 },
    // Wave 35 (17:30): Pre-boss rush
    { enemies: [{ type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'cubone', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 250, maxEnemies: 85 },

    // ── BOSS: Vileplume @ 18:00 ──

    // Wave 36 (18:00): Endurance push
    { enemies: [{ type: 'paras', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'cubone', weight: 2 }, { type: 'golbat', weight: 1 }],
      spawnRate: 240, maxEnemies: 85 },
    // Wave 37 (18:30): Swarm
    { enemies: [{ type: 'venonat', weight: 3 }, { type: 'drowzee', weight: 2 }, { type: 'paras', weight: 2 }],
      spawnRate: 220, maxEnemies: 88 },
    // Wave 38 (19:00): Peak P2
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 210, maxEnemies: 88 },
    // Wave 39 (19:30): Final P2 — everything maxed
    { enemies: [{ type: 'cubone', weight: 2 }, { type: 'venonat', weight: 2 }, { type: 'drowzee', weight: 2 }, { type: 'paras', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 200, maxEnemies: 90 },
  ],

  bosses: [
    { type: 'beedrill',  timeSeconds: 900 },
    { type: 'vileplume', timeSeconds: 1080 },
  ],
};
