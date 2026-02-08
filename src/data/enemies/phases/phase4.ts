import type { PhaseConfig } from '../../../types';

/** Phase 4 — 30:00 to 40:00, 20 waves + 4 boss events */
export const PHASE4: PhaseConfig = {
  waves: [
    // Wave 60 (30:00): BIG INTRO — Alakazam + Electrode (teleport psychic + death explosion)
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 100, maxEnemies: 120 },
    // Wave 61 (30:30): Duo se consolida, caos imediato
    { enemies: [{ type: 'electrode', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'parasect', weight: 1 }],
      spawnRate: 98, maxEnemies: 122 },
    // Wave 62 (31:00): Teleport + explosion combo
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 95, maxEnemies: 125 },
    // Wave 63 (31:30): Elite overload
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 1 }, { type: 'electrode', weight: 1 }, { type: 'marowak', weight: 1 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 92, maxEnemies: 125 },
    // Wave 64 (32:00): Status hell
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 90, maxEnemies: 128 },
    // Wave 65 (32:30): Pre-boss rush
    { enemies: [{ type: 'electrode', weight: 3 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 88, maxEnemies: 130 },

    // ── BOSS: Beedrill ×2 @ 33:00 ──

    // Wave 66 (33:00): Explosion swarm
    { enemies: [{ type: 'electrode', weight: 3 }, { type: 'venomoth', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 85, maxEnemies: 130 },
    // Wave 67 (33:30): Psychic barrage
    { enemies: [{ type: 'alakazam', weight: 3 }, { type: 'hypno', weight: 2 }, { type: 'electrode', weight: 1 }],
      spawnRate: 82, maxEnemies: 132 },
    // Wave 68 (34:00): Bone + teleport
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 80, maxEnemies: 135 },
    // Wave 69 (34:30): Tank fortress
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 78, maxEnemies: 135 },
    // Wave 70 (35:00): All elites
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 75, maxEnemies: 138 },
    // Wave 71 (35:30): Pre-boss surge
    { enemies: [{ type: 'electrode', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 72, maxEnemies: 140 },

    // ── BOSS: Gengar ×2 @ 36:00 ──

    // Wave 72 (36:00): Endgame push
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'marowak', weight: 2 }],
      spawnRate: 70, maxEnemies: 140 },
    // Wave 73 (36:30): Explosion carnival
    { enemies: [{ type: 'electrode', weight: 4 }, { type: 'alakazam', weight: 2 }],
      spawnRate: 68, maxEnemies: 142 },
    // Wave 74 (37:00): Psychic swarm
    { enemies: [{ type: 'hypno', weight: 3 }, { type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 1 }],
      spawnRate: 65, maxEnemies: 142 },
    // Wave 75 (37:30): Bone apocalypse
    { enemies: [{ type: 'marowak', weight: 3 }, { type: 'cubone', weight: 2 }, { type: 'electrode', weight: 1 }],
      spawnRate: 62, maxEnemies: 145 },
    // Wave 76 (38:00): Status storm
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'electrode', weight: 1 }],
      spawnRate: 58, maxEnemies: 145 },
    // Wave 77 (38:30): Pre-final rush
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 55, maxEnemies: 148 },

    // ── BOSS: Snorlax ×2 @ 39:00 ──

    // Wave 78 (39:00): Final wave — everything
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 52, maxEnemies: 150 },
    // Wave 79 (39:30): Victory lap — absolute chaos
    { enemies: [{ type: 'electrode', weight: 3 }, { type: 'alakazam', weight: 3 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 2 }],
      spawnRate: 50, maxEnemies: 150 },
  ],

  bosses: [
    { type: 'beedrill', timeSeconds: 1800, count: 2, hpMultiplier: 1.5, dmgMultiplier: 1.3 },
    { type: 'gengar',   timeSeconds: 1980, count: 2, hpMultiplier: 1.5, dmgMultiplier: 1.3 },
    { type: 'snorlax',  timeSeconds: 2160, count: 2, hpMultiplier: 1.5, dmgMultiplier: 1.3 },
    { type: 'nidoking', timeSeconds: 2340, hpMultiplier: 2, dmgMultiplier: 1.5 },
    { type: 'gengar',   timeSeconds: 2342, hpMultiplier: 2, dmgMultiplier: 1.5 },
    { type: 'snorlax',  timeSeconds: 2344, hpMultiplier: 2, dmgMultiplier: 1.5 },
  ],
};
