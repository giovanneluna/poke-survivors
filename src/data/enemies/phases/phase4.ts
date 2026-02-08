import type { PhaseConfig } from '../../../types';

/** Phase 4 — 30:00 to 40:00, 20 waves + 4 boss events */
export const PHASE4: PhaseConfig = {
  waves: [
    // Wave 60 (30:00): BIG INTRO — Alakazam + Electrode (teleport psychic + death explosion)
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 38, maxEnemies: 220 },
    // Wave 61 (30:30): Duo se consolida, caos imediato
    { enemies: [{ type: 'electrode', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'parasect', weight: 1 }],
      spawnRate: 36, maxEnemies: 225 },
    // Wave 62 (31:00): Teleport + explosion combo
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 35, maxEnemies: 228 },
    // Wave 63 (31:30): Elite overload
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 1 }, { type: 'electrode', weight: 1 }, { type: 'marowak', weight: 1 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 34, maxEnemies: 230 },
    // Wave 64 (32:00): Status hell
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 33, maxEnemies: 232 },
    // Wave 65 (32:30): Pre-boss rush
    { enemies: [{ type: 'electrode', weight: 3 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 32, maxEnemies: 235 },

    // ── BOSS: Beedrill ×2 @ 33:00 ──

    // Wave 66 (33:00): Explosion swarm
    { enemies: [{ type: 'electrode', weight: 3 }, { type: 'venomoth', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 30, maxEnemies: 238 },
    // Wave 67 (33:30): Psychic barrage
    { enemies: [{ type: 'alakazam', weight: 3 }, { type: 'hypno', weight: 2 }, { type: 'electrode', weight: 1 }],
      spawnRate: 29, maxEnemies: 240 },
    // Wave 68 (34:00): Bone + teleport
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 28, maxEnemies: 242 },
    // Wave 69 (34:30): Tank fortress
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 27, maxEnemies: 245 },
    // Wave 70 (35:00): All elites
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 26, maxEnemies: 248 },
    // Wave 71 (35:30): Pre-boss surge
    { enemies: [{ type: 'electrode', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 25, maxEnemies: 250 },

    // ── BOSS: Gengar ×2 @ 36:00 ──

    // Wave 72 (36:00): Endgame push
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'marowak', weight: 2 }],
      spawnRate: 24, maxEnemies: 252 },
    // Wave 73 (36:30): Explosion carnival
    { enemies: [{ type: 'electrode', weight: 4 }, { type: 'alakazam', weight: 2 }],
      spawnRate: 23, maxEnemies: 255 },
    // Wave 74 (37:00): Psychic swarm
    { enemies: [{ type: 'hypno', weight: 3 }, { type: 'venomoth', weight: 2 }, { type: 'alakazam', weight: 1 }],
      spawnRate: 22, maxEnemies: 258 },
    // Wave 75 (37:30): Bone apocalypse
    { enemies: [{ type: 'marowak', weight: 3 }, { type: 'cubone', weight: 2 }, { type: 'electrode', weight: 1 }],
      spawnRate: 21, maxEnemies: 260 },
    // Wave 76 (38:00): Status storm
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'electrode', weight: 1 }],
      spawnRate: 20, maxEnemies: 262 },
    // Wave 77 (38:30): Pre-final rush
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 18, maxEnemies: 265 },

    // ── BOSS: Snorlax ×2 @ 39:00 ──

    // Wave 78 (39:00): Final wave — everything
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 16, maxEnemies: 270 },
    // Wave 79 (39:30): Victory lap — absolute chaos
    { enemies: [{ type: 'electrode', weight: 3 }, { type: 'alakazam', weight: 3 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 2 }],
      spawnRate: 15, maxEnemies: 280 },
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
