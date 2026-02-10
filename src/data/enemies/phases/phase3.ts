import type { PhaseConfig } from '../../../types';

/** Phase 3 — 20:00 to 30:00, 20 waves + 3 bosses */
export const PHASE3: PhaseConfig = {
  waves: [
    // Wave 40 (20:00): BIG INTRO — Butterfree + Parasect + Venomoth (confusion swarm + slow aura)
    { enemies: [{ type: 'butterfree', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'cubone', weight: 1 }],
      spawnRate: 80, maxEnemies: 165 },
    // Wave 41 (20:30): Trio se consolida, confusion por todos os lados
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'drowzee', weight: 1 }],
      spawnRate: 78, maxEnemies: 170 },
    // Wave 42 (21:00): Confusion + slow aura dominam
    { enemies: [{ type: 'butterfree', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'parasect', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 75, maxEnemies: 175 },

    // ── BOSS: Primeape @ 21:00 ──

    // Wave 43 (21:30): P2 elites reforçam, preparando pro duo
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'cubone', weight: 1 }, { type: 'venonat', weight: 1 }],
      spawnRate: 72, maxEnemies: 178 },
    // Wave 44 (22:00): PSYCHIC DUO + EVOLUTIONS — Hypno + Marowak + Graveler + Machoke
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'graveler', weight: 1 }, { type: 'machoke', weight: 1 }, { type: 'crobat', weight: 1 }],
      spawnRate: 70, maxEnemies: 180 },
    // Wave 45 (22:30): Duo se integra ao roster
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'parasect', weight: 1 }],
      spawnRate: 68, maxEnemies: 182 },
    // Wave 46 (23:00): Status overload — tudo junto
    { enemies: [{ type: 'butterfree', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'drowzee', weight: 1 }],
      spawnRate: 65, maxEnemies: 185 },
    // Wave 47 (23:30): Pre-Gengar — bone + psychic rush
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 62, maxEnemies: 188 },

    // ── BOSS: Gengar @ 24:00 ──

    // Wave 48 (24:00): Post-Gengar — Graveler + Machoke reforçam
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'graveler', weight: 1 }, { type: 'machoke', weight: 1 }, { type: 'hypno', weight: 1 }, { type: 'parasect', weight: 1 }],
      spawnRate: 60, maxEnemies: 190 },
    // Wave 49 (24:30): Confusion swarm + Crobat air attack
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }, { type: 'crobat', weight: 1 }, { type: 'hypno', weight: 1 }],
      spawnRate: 58, maxEnemies: 192 },
    // Wave 50 (25:00): Tank avalanche
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'cubone', weight: 2 }],
      spawnRate: 56, maxEnemies: 195 },
    // Wave 51 (25:30): Mixed elite
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'venomoth', weight: 1 }, { type: 'marowak', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 54, maxEnemies: 198 },
    // Wave 52 (26:00): Rock + Bone storm
    { enemies: [{ type: 'marowak', weight: 2 }, { type: 'graveler', weight: 2 }, { type: 'machoke', weight: 1 }, { type: 'hypno', weight: 1 }],
      spawnRate: 52, maxEnemies: 200 },
    // Wave 53 (26:30): Pre-respawn rush
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'butterfree', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 50, maxEnemies: 202 },

    // ── BOSS: Raticate ×2 @ 27:00 ──

    // Wave 54 (27:00): Post-respawn
    { enemies: [{ type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'venomoth', weight: 1 }],
      spawnRate: 48, maxEnemies: 205 },
    // Wave 55 (27:30): Elite swarm + Crobat
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'crobat', weight: 1 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 46, maxEnemies: 208 },
    // Wave 56 (28:00): Stun + bone combo
    { enemies: [{ type: 'hypno', weight: 3 }, { type: 'marowak', weight: 2 }, { type: 'parasect', weight: 1 }],
      spawnRate: 44, maxEnemies: 210 },
    // Wave 57 (28:30): Healer + tank fortress
    { enemies: [{ type: 'parasect', weight: 2 }, { type: 'gloom', weight: 2 }, { type: 'marowak', weight: 2 }],
      spawnRate: 42, maxEnemies: 212 },
    // Wave 58 (29:00): Peak P3
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'butterfree', weight: 1 }],
      spawnRate: 40, maxEnemies: 215 },
    // Wave 59 (29:30): Final P3 — everything maxed
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'marowak', weight: 2 }, { type: 'parasect', weight: 1 }, { type: 'gloom', weight: 1 }],
      spawnRate: 38, maxEnemies: 220 },
  ],

  bosses: [
    { type: 'primeape', timeSeconds: 1260 },
    { type: 'pidgeot',  timeSeconds: 1350 },
    { type: 'gengar',   timeSeconds: 1440 },
    { type: 'golem',    timeSeconds: 1530 },
    { type: 'raticate', timeSeconds: 1620, count: 2, hpMultiplier: 1.5, dmgMultiplier: 1.3 },
  ],
};
