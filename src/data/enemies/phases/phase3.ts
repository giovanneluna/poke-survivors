import type { PhaseConfig } from '../../../types';

/** Phase 3 — 20:00 to 30:00, 20 waves + 3 bosses */
export const PHASE3: PhaseConfig = {
  waves: [
    // Wave 40 (20:00): BIG INTRO — Butterfree + Parasect + Venomoth (confusion swarm + slow aura)
    { enemies: [{ type: 'butterfree', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'venomoth', weight: 2 }, { type: 'cubone', weight: 1 }],
      spawnRate: 200, maxEnemies: 90 },
    // Wave 41 (20:30): Trio se consolida, confusion por todos os lados
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'butterfree', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'drowzee', weight: 1 }],
      spawnRate: 195, maxEnemies: 92 },
    // Wave 42 (21:00): Confusion + slow aura dominam
    { enemies: [{ type: 'butterfree', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 190, maxEnemies: 95 },

    // ── BOSS: Primeape @ 21:00 ──

    // Wave 43 (21:30): P2 elites reforçam, preparando pro duo
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'cubone', weight: 1 }, { type: 'venonat', weight: 1 }],
      spawnRate: 185, maxEnemies: 95 },
    // Wave 44 (22:00): PSYCHIC DUO — Hypno + Marowak (stun homing + bone boomerang)
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'butterfree', weight: 1 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 180, maxEnemies: 98 },
    // Wave 45 (22:30): Duo se integra ao roster
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'venomoth', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 175, maxEnemies: 100 },
    // Wave 46 (23:00): Status overload — tudo junto
    { enemies: [{ type: 'butterfree', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'drowzee', weight: 1 }],
      spawnRate: 170, maxEnemies: 100 },
    // Wave 47 (23:30): Pre-Gengar — bone + psychic rush
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 165, maxEnemies: 102 },

    // ── BOSS: Gengar @ 24:00 ──

    // Wave 48 (24:00): Post-Gengar intensity
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'venonat', weight: 1 }],
      spawnRate: 160, maxEnemies: 105 },
    // Wave 49 (24:30): Confusion swarm
    { enemies: [{ type: 'venomoth', weight: 3 }, { type: 'butterfree', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 155, maxEnemies: 105 },
    // Wave 50 (25:00): Tank avalanche
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'cubone', weight: 2 }],
      spawnRate: 150, maxEnemies: 108 },
    // Wave 51 (25:30): Mixed elite
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 145, maxEnemies: 108 },
    // Wave 52 (26:00): Bone storm
    { enemies: [{ type: 'marowak', weight: 3 }, { type: 'cubone', weight: 2 }, { type: 'hypno', weight: 1 }],
      spawnRate: 140, maxEnemies: 110 },
    // Wave 53 (26:30): Pre-respawn rush
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'butterfree', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 135, maxEnemies: 112 },

    // ── BOSS: Raticate ×2 @ 27:00 ──

    // Wave 54 (27:00): Post-respawn
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'venomoth', weight: 2 }],
      spawnRate: 130, maxEnemies: 112 },
    // Wave 55 (27:30): Elite swarm
    { enemies: [{ type: 'venomoth', weight: 3 }, { type: 'hypno', weight: 2 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 125, maxEnemies: 115 },
    // Wave 56 (28:00): Stun + bone combo
    { enemies: [{ type: 'hypno', weight: 3 }, { type: 'marowak', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 120, maxEnemies: 115 },
    // Wave 57 (28:30): Healer + tank fortress
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'marowak', weight: 2 }],
      spawnRate: 115, maxEnemies: 118 },
    // Wave 58 (29:00): Peak P3
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 110, maxEnemies: 118 },
    // Wave 59 (29:30): Final P3 — everything maxed
    { enemies: [{ type: 'venomoth', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 100, maxEnemies: 120 },
  ],

  bosses: [
    { type: 'primeape', timeSeconds: 1260 },
    { type: 'gengar',   timeSeconds: 1440 },
    { type: 'raticate', timeSeconds: 1620, count: 2, hpMultiplier: 1.5, dmgMultiplier: 1.3 },
  ],
};
