import type { PhaseConfig } from '../../../types';

/** Phase 4 — 30:00 to 40:00, 20 waves + boss gauntlet
 *  Design: Poucos inimigos de elite, cada um perigoso individualmente.
 *  Electrode é raro — explosão de morte pune posicionamento ruim, não spam.
 */
export const PHASE4: PhaseConfig = {
  waves: [
    // Wave 60 (30:00): BIG INTRO — Alakazam + Electrode (teleport psychic + death explosion)
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 150, maxEnemies: 40 },
    // Wave 61 (30:30): Duo se consolida
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 145, maxEnemies: 42 },
    // Wave 62 (31:00): Teleport + explosion combo
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 2 }],
      spawnRate: 140, maxEnemies: 44 },
    // Wave 63 (31:30): Elite overload — Graveler + Machoke
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'graveler', weight: 1 }, { type: 'machoke', weight: 1 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 135, maxEnemies: 46 },
    // Wave 64 (32:00): Status hell
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'gloom', weight: 1 }],
      spawnRate: 130, maxEnemies: 48 },
    // Wave 65 (32:30): Pre-boss rush
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }],
      spawnRate: 125, maxEnemies: 50 },

    // ── BOSS: Pidgeot @ 31:00 ──

    // Wave 66 (33:00): Post-boss — Electrode mais presente
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'hypno', weight: 1 }],
      spawnRate: 120, maxEnemies: 52 },
    // Wave 67 (33:30): Psychic barrage
    { enemies: [{ type: 'alakazam', weight: 3 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 115, maxEnemies: 54 },
    // Wave 68 (34:00): Bone + teleport
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 110, maxEnemies: 56 },
    // Wave 69 (34:30): Tank fortress
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'graveler', weight: 1 }],
      spawnRate: 105, maxEnemies: 58 },
    // Wave 70 (35:00): All elites
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 100, maxEnemies: 60 },
    // Wave 71 (35:30): Pre-boss surge
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 2 }],
      spawnRate: 95, maxEnemies: 62 },

    // ── BOSS: Golem @ 34:00 ──
    // ── BOSS: Machamp @ 37:00 ──

    // Wave 72 (36:00): Endgame push
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'marowak', weight: 2 }, { type: 'machoke', weight: 1 }],
      spawnRate: 90, maxEnemies: 65 },
    // Wave 73 (36:30): Explosion + psychic elite
    { enemies: [{ type: 'electrode', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 85, maxEnemies: 68 },
    // Wave 74 (37:00): Psychic swarm
    { enemies: [{ type: 'hypno', weight: 3 }, { type: 'venomoth', weight: 1 }, { type: 'alakazam', weight: 1 }],
      spawnRate: 80, maxEnemies: 70 },
    // Wave 75 (37:30): Bone apocalypse
    { enemies: [{ type: 'marowak', weight: 3 }, { type: 'graveler', weight: 2 }, { type: 'electrode', weight: 1 }],
      spawnRate: 75, maxEnemies: 72 },
    // Wave 76 (38:00): Status storm
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'electrode', weight: 1 }],
      spawnRate: 72, maxEnemies: 75 },
    // Wave 77 (38:30): Pre-final rush
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 68, maxEnemies: 78 },

    // ── Pre-Final Boss ──

    // Wave 78 (39:00): Final wave — elite mix
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 65, maxEnemies: 80 },
    // Wave 79 (39:30): Victory lap — elite gauntlet
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'marowak', weight: 1 }],
      spawnRate: 60, maxEnemies: 85 },
  ],

  bosses: [
    { type: 'pidgeot',       timeSeconds: 2400 },   // 40:00
    { type: 'golem',         timeSeconds: 2640 },   // 44:00
    { type: 'machamp',       timeSeconds: 2880 },   // 48:00
    // ── BOSS FINAL: Alakazam — Caster Supremo ──
    { type: 'alakazam-boss', timeSeconds: 3120 },   // 52:00
  ],
};
