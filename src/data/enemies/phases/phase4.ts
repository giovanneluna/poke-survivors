import type { PhaseConfig } from '../../../types';

/** Phase 4 — 30:00 to 40:00, 20 waves + boss gauntlet
 *  Design: Poucos inimigos de elite, cada um perigoso individualmente.
 *  New enemies: Weezing, Magneton, Tentacruel, Rhydon, Scyther, Mr. Mime, Hitmonlee, Electabuzz */
export const PHASE4: PhaseConfig = {
  waves: [
    // Wave 60 (30:00): BIG INTRO — Alakazam + Electrode + Weezing + Magneton
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 2 }, { type: 'weezing', weight: 1 }, { type: 'magneton', weight: 1 }],
      spawnRate: 150, maxEnemies: 40 },
    // Wave 61 (30:30): Duo se consolida + weezing
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'marowak', weight: 1 }, { type: 'weezing', weight: 1 }, { type: 'magneton', weight: 1 }],
      spawnRate: 145, maxEnemies: 42 },
    // Wave 62 (31:00): Teleport + gas combo
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'hypno', weight: 1 }, { type: 'weezing', weight: 1 }, { type: 'magneton', weight: 1 }],
      spawnRate: 140, maxEnemies: 44 },
    // Wave 63 (31:30): Elite overload + weezing + magneton
    { enemies: [{ type: 'venomoth', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'graveler', weight: 1 }, { type: 'weezing', weight: 1 }, { type: 'magneton', weight: 1 }],
      spawnRate: 135, maxEnemies: 46 },
    // Wave 64 (32:00): Tentacruel + Rhydon + Scyther join
    { enemies: [{ type: 'hypno', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'tentacruel', weight: 1 }, { type: 'rhydon', weight: 1 }, { type: 'scyther', weight: 1 }],
      spawnRate: 130, maxEnemies: 48 },
    // Wave 65 (32:30): Pre-boss + new trio
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'tentacruel', weight: 1 }, { type: 'rhydon', weight: 1 }, { type: 'scyther', weight: 1 }],
      spawnRate: 125, maxEnemies: 50 },

    // -- BOSS: Pidgeot @ 31:00 --

    // Wave 66 (33:00): Post-boss + tentacruel + rhydon
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'venomoth', weight: 1 }, { type: 'weezing', weight: 1 }, { type: 'tentacruel', weight: 1 }, { type: 'rhydon', weight: 1 }],
      spawnRate: 120, maxEnemies: 52 },
    // Wave 67 (33:30): Psychic + scyther slasher
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'hypno', weight: 1 }, { type: 'scyther', weight: 1 }, { type: 'magneton', weight: 1 }],
      spawnRate: 115, maxEnemies: 54 },
    // Wave 68 (34:00): Mr. Mime + Hitmonlee join
    { enemies: [{ type: 'marowak', weight: 1 }, { type: 'alakazam', weight: 1 }, { type: 'weezing', weight: 1 }, { type: 'mr-mime', weight: 1 }, { type: 'hitmonlee', weight: 1 }],
      spawnRate: 110, maxEnemies: 56 },
    // Wave 69 (34:30): Tank fortress + shielder
    { enemies: [{ type: 'parasect', weight: 1 }, { type: 'rhydon', weight: 2 }, { type: 'mr-mime', weight: 1 }, { type: 'hitmonlee', weight: 1 }],
      spawnRate: 105, maxEnemies: 58 },
    // Wave 70 (35:00): All elites + mr-mime + hitmonlee
    { enemies: [{ type: 'alakazam', weight: 2 }, { type: 'electrode', weight: 1 }, { type: 'mr-mime', weight: 1 }, { type: 'hitmonlee', weight: 1 }, { type: 'scyther', weight: 1 }],
      spawnRate: 100, maxEnemies: 60 },
    // Wave 71 (35:30): Pre-boss surge
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 2 }, { type: 'weezing', weight: 1 }, { type: 'hitmonlee', weight: 1 }, { type: 'mr-mime', weight: 1 }],
      spawnRate: 95, maxEnemies: 62 },

    // -- BOSS: Golem @ 34:00 --
    // -- BOSS: Machamp @ 37:00 --

    // Wave 72 (36:00): Electabuzz joins — all 8 present, weights to 2
    { enemies: [{ type: 'alakazam', weight: 1 }, { type: 'weezing', weight: 2 }, { type: 'magneton', weight: 2 }, { type: 'tentacruel', weight: 2 }, { type: 'rhydon', weight: 2 }, { type: 'electabuzz', weight: 1 }],
      spawnRate: 90, maxEnemies: 65 },
    // Wave 73 (36:30): Full roster weight 2
    { enemies: [{ type: 'scyther', weight: 2 }, { type: 'mr-mime', weight: 2 }, { type: 'hitmonlee', weight: 2 }, { type: 'electabuzz', weight: 2 }],
      spawnRate: 85, maxEnemies: 68 },
    // Wave 74 (37:00): Gas + pull + stun
    { enemies: [{ type: 'weezing', weight: 2 }, { type: 'magneton', weight: 2 }, { type: 'electabuzz', weight: 2 }, { type: 'tentacruel', weight: 1 }],
      spawnRate: 80, maxEnemies: 70 },
    // Wave 75 (37:30): Rammer + slasher + leaper
    { enemies: [{ type: 'rhydon', weight: 3 }, { type: 'scyther', weight: 2 }, { type: 'hitmonlee', weight: 2 }, { type: 'electrode', weight: 1 }],
      spawnRate: 75, maxEnemies: 72 },
    // Wave 76 (38:00): Full roster weight 2-3, reduce legacy P3 enemies
    { enemies: [{ type: 'weezing', weight: 2 }, { type: 'magneton', weight: 2 }, { type: 'tentacruel', weight: 2 }, { type: 'rhydon', weight: 2 }, { type: 'scyther', weight: 2 }, { type: 'mr-mime', weight: 2 }, { type: 'hitmonlee', weight: 2 }, { type: 'electabuzz', weight: 2 }],
      spawnRate: 72, maxEnemies: 75 },
    // Wave 77 (38:30): Pre-final — shielder + stunner chaos
    { enemies: [{ type: 'mr-mime', weight: 3 }, { type: 'electabuzz', weight: 3 }, { type: 'scyther', weight: 2 }, { type: 'hitmonlee', weight: 2 }],
      spawnRate: 68, maxEnemies: 78 },

    // -- Pre-Final Boss --

    // Wave 78 (39:00): Final wave — full new roster
    { enemies: [{ type: 'weezing', weight: 2 }, { type: 'magneton', weight: 2 }, { type: 'tentacruel', weight: 2 }, { type: 'rhydon', weight: 3 }, { type: 'scyther', weight: 2 }, { type: 'mr-mime', weight: 2 }, { type: 'hitmonlee', weight: 2 }, { type: 'electabuzz', weight: 3 }],
      spawnRate: 65, maxEnemies: 80 },
    // Wave 79 (39:30): Victory lap — everything maxed
    { enemies: [{ type: 'electrode', weight: 1 }, { type: 'alakazam', weight: 1 }, { type: 'weezing', weight: 3 }, { type: 'magneton', weight: 3 }, { type: 'tentacruel', weight: 2 }, { type: 'rhydon', weight: 3 }, { type: 'scyther', weight: 3 }, { type: 'mr-mime', weight: 2 }, { type: 'hitmonlee', weight: 3 }, { type: 'electabuzz', weight: 3 }],
      spawnRate: 60, maxEnemies: 85 },
  ],

  bosses: [
    { type: 'pidgeot',       timeSeconds: 2400 },   // 40:00
    { type: 'golem',         timeSeconds: 2640 },   // 44:00
    { type: 'machamp',       timeSeconds: 2880 },   // 48:00
    // -- BOSS FINAL: Alakazam — Caster Supremo --
    { type: 'alakazam-boss', timeSeconds: 3120 },   // 52:00
  ],
};
