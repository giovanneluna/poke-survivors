import type { PhaseConfig } from '../../../types';

/** Phase 3 — 20:00 to 30:00, 20 waves + 3 bosses (Vileplume, Primeape, Gengar)
 * New enemies: Koffing (deathCloud), Magnemite (puller), Tentacool (trapper), Rhyhorn (rammer) */
export const PHASE3: PhaseConfig = {
  waves: [
    // Wave 40 (20:00): BIG INTRO — Butterfree + Parasect + Venomoth + Koffing + Magnemite
    { enemies: [{ type: 'butterfree', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'cubone', weight: 1 }, { type: 'koffing', weight: 1 }, { type: 'magnemite', weight: 1 }],
      spawnRate: 80, maxEnemies: 165 },
    // Wave 41 (20:30): Trio se consolida + koffing + magnemite
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'drowzee', weight: 1 }, { type: 'koffing', weight: 1 }, { type: 'magnemite', weight: 1 }],
      spawnRate: 78, maxEnemies: 170 },
    // Wave 42 (21:00): Confusion + slow aura + koffing
    { enemies: [{ type: 'butterfree', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'gloom', weight: 1 }, { type: 'koffing', weight: 1 }, { type: 'magnemite', weight: 1 }],
      spawnRate: 75, maxEnemies: 175 },

    // -- BOSS: Vileplume @ 22:00 --

    // Wave 43 (21:30): P2 elites reforçam + koffing
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'cubone', weight: 1 }, { type: 'venonat', weight: 1 }, { type: 'koffing', weight: 1 }, { type: 'magnemite', weight: 1 }],
      spawnRate: 72, maxEnemies: 178 },
    // Wave 44 (22:00): PSYCHIC DUO + Tentacool joins
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'graveler', weight: 1 }, { type: 'machoke', weight: 1 }, { type: 'crobat', weight: 1 }, { type: 'tentacool', weight: 1 }],
      spawnRate: 70, maxEnemies: 180 },
    // Wave 45 (22:30): Duo + tentacool
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'tentacool', weight: 1 }],
      spawnRate: 68, maxEnemies: 182 },
    // Wave 46 (23:00): Status overload + tentacool
    { enemies: [{ type: 'butterfree', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'drowzee', weight: 1 }, { type: 'tentacool', weight: 1 }],
      spawnRate: 65, maxEnemies: 185 },
    // Wave 47 (23:30): Pre-Gengar + tentacool
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }, { type: 'tentacool', weight: 1 }],
      spawnRate: 62, maxEnemies: 188 },

    // -- BOSS: Primeape @ 25:00 --
    // -- BOSS: Gengar @ 28:00 --

    // Wave 48 (24:00): Rhyhorn joins — all 4 new present
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'graveler', weight: 1 }, { type: 'machoke', weight: 1 }, { type: 'hypno', weight: 1 }, { type: 'koffing', weight: 1 }, { type: 'rhyhorn', weight: 1 }],
      spawnRate: 100, maxEnemies: 90 },
    // Wave 49 (24:30): All 4 new + crobat
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }, { type: 'crobat', weight: 1 }, { type: 'magnemite', weight: 1 }, { type: 'tentacool', weight: 1 }, { type: 'rhyhorn', weight: 1 }],
      spawnRate: 95, maxEnemies: 92 },
    // Wave 50 (25:00): Tank avalanche + rhyhorn
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'cubone', weight: 1 }, { type: 'rhyhorn', weight: 1 }],
      spawnRate: 92, maxEnemies: 95 },
    // Wave 51 (25:30): Mixed elite + all 4 new
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'koffing', weight: 1 }, { type: 'magnemite', weight: 1 }, { type: 'rhyhorn', weight: 1 }],
      spawnRate: 90, maxEnemies: 98 },
    // Wave 52 (26:00): New enemies weight 2
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'graveler', weight: 1 }, { type: 'koffing', weight: 2 }, { type: 'magnemite', weight: 2 }, { type: 'tentacool', weight: 2 }, { type: 'rhyhorn', weight: 2 }],
      spawnRate: 88, maxEnemies: 100 },
    // Wave 53 (26:30): Pre-respawn rush + new enemies w2
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'koffing', weight: 2 }, { type: 'tentacool', weight: 2 }, { type: 'magnemite', weight: 2 }],
      spawnRate: 85, maxEnemies: 105 },

    // -- End Phase 3 --

    // Wave 54 (27:00): Post-respawn — new enemies at weight 2
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'koffing', weight: 2 }, { type: 'rhyhorn', weight: 2 }],
      spawnRate: 80, maxEnemies: 110 },
    // Wave 55 (27:30): Elite swarm + all new w2
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'crobat', weight: 1 }, { type: 'koffing', weight: 2 }, { type: 'magnemite', weight: 2 }, { type: 'tentacool', weight: 2 }, { type: 'rhyhorn', weight: 2 }],
      spawnRate: 75, maxEnemies: 115 },
    // Wave 56 (28:00): All 4 new at weight 2-3
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'koffing', weight: 3 }, { type: 'magnemite', weight: 2 }, { type: 'tentacool', weight: 2 }, { type: 'rhyhorn', weight: 3 }],
      spawnRate: 72, maxEnemies: 118 },
    // Wave 57 (28:30): Fortress + pullers
    { enemies: [{ type: 'parasect', weight: 1 }, { type: 'gloom', weight: 1 }, { type: 'marowak', weight: 2 }, { type: 'koffing', weight: 2 }, { type: 'magnemite', weight: 3 }, { type: 'rhyhorn', weight: 2 }],
      spawnRate: 68, maxEnemies: 120 },
    // Wave 58 (29:00): Peak P3 — all new at w2-3
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'koffing', weight: 3 }, { type: 'magnemite', weight: 2 }, { type: 'tentacool', weight: 3 }, { type: 'rhyhorn', weight: 2 }],
      spawnRate: 65, maxEnemies: 125 },
    // Wave 59 (29:30): Final P3 — everything maxed
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'koffing', weight: 3 }, { type: 'magnemite', weight: 3 }, { type: 'tentacool', weight: 2 }, { type: 'rhyhorn', weight: 3 }],
      spawnRate: 60, maxEnemies: 130 },
  ],

  bosses: [
    { type: 'vileplume', timeSeconds: 1680 },   // 28:00
    { type: 'primeape',  timeSeconds: 1920 },   // 32:00
    { type: 'gengar',    timeSeconds: 2160 },   // 36:00
  ],
};
