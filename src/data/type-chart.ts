import type { ElementType, EnemyType } from '../types';

// ── Type Effectiveness Multipliers ──────────────────────────────────
// 1.5 = super effective, 0.5 = not very effective, 0 = immune, 1.0 = normal (default)

const TYPE_CHART: Partial<Record<ElementType, Partial<Record<ElementType, number>>>> = {
  fire:     { grass: 1.5, ice: 1.5, bug: 1.5, water: 0.5, rock: 0.5, fire: 0.5, dragon: 0.5 },
  water:    { fire: 1.5, rock: 1.5, ground: 1.5, grass: 0.5, water: 0.5, dragon: 0.5 },
  grass:    { water: 1.5, ground: 1.5, rock: 1.5, fire: 0.5, grass: 0.5, flying: 0.5, poison: 0.5, bug: 0.5, dragon: 0.5 },
  ice:      { grass: 1.5, ground: 1.5, flying: 1.5, dragon: 1.5, fire: 0.5, water: 0.5, ice: 0.5 },
  normal:   { ghost: 0 },
  dragon:   { dragon: 1.5 },
  flying:   { grass: 1.5, fighting: 1.5, bug: 1.5, rock: 0.5 },
  fighting: { normal: 1.5, rock: 1.5, ice: 1.5, dark: 1.5, ghost: 0, flying: 0.5, psychic: 0.5, bug: 0.5 },
  poison:   { grass: 1.5, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
  ground:   { fire: 1.5, rock: 1.5, poison: 1.5, flying: 0, grass: 0.5, bug: 0.5 },
  rock:     { fire: 1.5, ice: 1.5, flying: 1.5, bug: 1.5, fighting: 0.5, ground: 0.5 },
  ghost:    { ghost: 1.5, psychic: 1.5, normal: 0, dark: 0.5 },
  psychic:  { fighting: 1.5, poison: 1.5, dark: 0, psychic: 0.5 },
  bug:      { grass: 1.5, psychic: 1.5, dark: 1.5, fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5 },
  dark:     { ghost: 1.5, psychic: 1.5, fighting: 0.5, dark: 0.5 },
};

// ── Public API ──────────────────────────────────────────────────────

/** Returns the type effectiveness multiplier (default 1.0 for neutral). */
export function getTypeEffectiveness(attackElement: ElementType, defenderType: ElementType): number {
  return TYPE_CHART[attackElement]?.[defenderType] ?? 1.0;
}

export type EffectivenessLabel = 'super-effective' | 'not-very-effective' | 'immune' | 'normal';

/** Converts a numeric multiplier into a human-readable label. */
export function getEffectivenessLabel(multiplier: number): EffectivenessLabel {
  if (multiplier === 0) return 'immune';
  if (multiplier >= 1.5) return 'super-effective';
  if (multiplier <= 0.5) return 'not-very-effective';
  return 'normal';
}

// ── Enemy → ElementType Mapping ─────────────────────────────────────

export const ENEMY_TYPES: Readonly<Record<EnemyType, ElementType>> = {
  // Phase 1 — commons
  rattata:    'normal',
  pidgey:     'flying',
  zubat:      'flying',
  geodude:    'rock',
  gastly:     'ghost',
  caterpie:   'bug',
  weedle:     'bug',
  spearow:    'flying',
  ekans:      'poison',
  oddish:     'grass',
  mankey:     'fighting',
  haunter:    'ghost',
  machop:     'fighting',
  golbat:     'flying',
  // Phase 1 — bosses
  raticate:   'normal',
  arbok:      'poison',
  nidoking:   'ground',
  snorlax:    'normal',
  // Phase 2 — commons + elite
  metapod:    'bug',
  kakuna:     'bug',
  gloom:      'grass',
  paras:      'bug',
  venonat:    'bug',
  drowzee:    'psychic',
  cubone:     'ground',
  pidgeotto:  'flying',
  // Phase 3 — elites + evolutions
  butterfree: 'bug',
  parasect:   'bug',
  venomoth:   'bug',
  hypno:      'psychic',
  marowak:    'ground',
  graveler:   'rock',
  machoke:    'fighting',
  // Phase 3 — novos
  koffing:    'poison',
  magnemite:  'normal',   // Electric not in ElementType, use normal
  tentacool:  'water',
  rhyhorn:    'ground',
  // Phase 4 — novos
  weezing:    'poison',
  magneton:   'normal',   // Electric not in ElementType, use normal
  tentacruel: 'water',
  rhydon:     'ground',
  scyther:    'bug',
  'mr-mime':  'psychic',
  hitmonlee:  'fighting',
  electabuzz: 'normal',   // Electric not in ElementType, use normal
  // Phase 4 — advanced elites
  alakazam:       'psychic',
  'alakazam-boss': 'psychic',
  electrode:  'normal',
  crobat:     'flying',
  // Bosses
  beedrill:   'bug',
  vileplume:  'grass',
  primeape:   'fighting',
  gengar:     'ghost',
  fearow:     'flying',
  pidgeot:    'flying',
  machamp:    'fighting',
  golem:      'rock',
  // Stage 2 — Kanto Coast: commons
  pikachu:    'normal',   // Electric not in ElementType
  sandshrew:  'ground',
  vulpix:     'fire',
  diglett:    'ground',
  meowth:     'normal',
  psyduck:    'water',
  growlithe:  'fire',
  poliwag:    'water',
  bellsprout: 'grass',
  ponyta:     'fire',
  slowpoke:   'water',
  farfetchd:  'flying',
  doduo:      'flying',
  seel:       'water',
  'grimer-p2': 'poison',
  shellder:   'water',
  krabby:     'water',
  exeggcute:  'grass',
  horsea:     'water',
  goldeen:    'water',
  staryu:     'water',
  jigglypuff: 'normal',  // Fairy not in ElementType
  // Stage 2 — Kanto Coast: bosses
  arcanine:   'fire',
  ninetales:  'fire',
  victreebel: 'grass',
  golduck:    'water',
  cloyster:   'water',
  muk:        'poison',
  rapidash:   'fire',
  starmie:    'water',
  slowbro:    'water',
  poliwrath:  'water',
  lapras:     'water',
};
