import type { SpriteConfig } from '../../types';

/** Sprites de inimigos e wild Pokémon (existentes + novos Phase 1) */
export const ENEMY_SPRITES: Readonly<Record<string, SpriteConfig>> = {
  // ── Existentes ────────────────────────────────────────────────────
  rattata:   { key: 'rattata-walk',   path: 'assets/pokemon/rattata-walk.png',   frameWidth: 48, frameHeight: 40, frameCount: 7,  directions: 8 },
  pidgey:    { key: 'pidgey-walk',    path: 'assets/pokemon/pidgey-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 5,  directions: 8 },
  zubat:     { key: 'zubat-walk',     path: 'assets/pokemon/zubat-walk.png',     frameWidth: 32, frameHeight: 56, frameCount: 8,  directions: 8 },
  geodude:   { key: 'geodude-walk',   path: 'assets/pokemon/geodude-walk.png',   frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  gastly:    { key: 'gastly-walk',    path: 'assets/pokemon/gastly-walk.png',    frameWidth: 48, frameHeight: 64, frameCount: 12, directions: 8 },
  caterpie:  { key: 'caterpie-walk',  path: 'assets/pokemon/caterpie-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 3,  directions: 8 },
  weedle:    { key: 'weedle-walk',    path: 'assets/pokemon/weedle-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 3,  directions: 8 },

  // ── Novos comuns (Phase 1) ────────────────────────────────────────
  spearow:   { key: 'spearow-walk',   path: 'assets/pokemon/spearow-walk.png',   frameWidth: 32, frameHeight: 40, frameCount: 5,  directions: 8 },
  ekans:     { key: 'ekans-walk',     path: 'assets/pokemon/ekans-walk.png',     frameWidth: 40, frameHeight: 48, frameCount: 6,  directions: 8 },
  oddish:    { key: 'oddish-walk',    path: 'assets/pokemon/oddish-walk.png',    frameWidth: 24, frameHeight: 40, frameCount: 8,  directions: 8 },
  mankey:    { key: 'mankey-walk',    path: 'assets/pokemon/mankey-walk.png',    frameWidth: 32, frameHeight: 56, frameCount: 8,  directions: 8 },

  // ── Novos elite (Phase 1) ─────────────────────────────────────────
  haunter:   { key: 'haunter-walk',   path: 'assets/pokemon/haunter-walk.png',   frameWidth: 32, frameHeight: 56, frameCount: 10, directions: 8 },
  machop:    { key: 'machop-walk',    path: 'assets/pokemon/machop-walk.png',    frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  golbat:    { key: 'golbat-walk',    path: 'assets/pokemon/golbat-walk.png',    frameWidth: 40, frameHeight: 64, frameCount: 8,  directions: 8 },

  // ── Bosses (Phase 1) ──────────────────────────────────────────────
  raticate:  { key: 'raticate-walk',  path: 'assets/pokemon/raticate-walk.png',  frameWidth: 40, frameHeight: 48, frameCount: 6,  directions: 8 },
  arbok:     { key: 'arbok-walk',     path: 'assets/pokemon/arbok-walk.png',     frameWidth: 40, frameHeight: 56, frameCount: 6,  directions: 8 },
  nidoking:  { key: 'nidoking-walk',  path: 'assets/pokemon/nidoking-walk.png',  frameWidth: 40, frameHeight: 48, frameCount: 4,  directions: 8 },
  snorlax:   { key: 'snorlax-walk',   path: 'assets/pokemon/snorlax-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },

  // ── Phase 2 comuns ──────────────────────────────────────────────
  metapod:   { key: 'metapod-walk',   path: 'assets/pokemon/metapod-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 10, directions: 8 },
  kakuna:    { key: 'kakuna-walk',    path: 'assets/pokemon/kakuna-walk.png',    frameWidth: 24, frameHeight: 40, frameCount: 5,  directions: 8 },
  gloom:     { key: 'gloom-walk',     path: 'assets/pokemon/gloom-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  paras:     { key: 'paras-walk',     path: 'assets/pokemon/paras-walk.png',     frameWidth: 32, frameHeight: 24, frameCount: 4,  directions: 8 },
  venonat:   { key: 'venonat-walk',   path: 'assets/pokemon/venonat-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 5,  directions: 8 },
  drowzee:   { key: 'drowzee-walk',   path: 'assets/pokemon/drowzee-walk.png',   frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  cubone:    { key: 'cubone-walk',    path: 'assets/pokemon/cubone-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },

  // ── Phase 3 elite ───────────────────────────────────────────────
  butterfree: { key: 'butterfree-walk', path: 'assets/pokemon/butterfree-walk.png', frameWidth: 32, frameHeight: 56, frameCount: 12, directions: 8 },
  parasect:  { key: 'parasect-walk',  path: 'assets/pokemon/parasect-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  venomoth:  { key: 'venomoth-walk',  path: 'assets/pokemon/venomoth-walk.png',  frameWidth: 40, frameHeight: 48, frameCount: 12, directions: 8 },
  hypno:     { key: 'hypno-walk',     path: 'assets/pokemon/hypno-walk.png',     frameWidth: 40, frameHeight: 40, frameCount: 4,  directions: 8 },
  marowak:   { key: 'marowak-walk',   path: 'assets/pokemon/marowak-walk.png',   frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },

  // ── Phase 2 elite (evoluções) ───────────────────────────────────
  pidgeotto: { key: 'pidgeotto-walk', path: 'assets/pokemon/pidgeotto-walk.png', frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },

  // ── Phase 3 elite (evoluções) ─────────────────────────────────
  graveler:  { key: 'graveler-walk',  path: 'assets/pokemon/graveler-walk.png',  frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },
  machoke:   { key: 'machoke-walk',   path: 'assets/pokemon/machoke-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },

  // ── Phase 3 novos ──────────────────────────────────────────────
  koffing:    { key: 'koffing-walk',    path: 'assets/pokemon/koffing-walk.png',    frameWidth: 32, frameHeight: 56, frameCount: 10, directions: 8 },
  magnemite:  { key: 'magnemite-walk',  path: 'assets/pokemon/magnemite-walk.png',  frameWidth: 24, frameHeight: 32, frameCount: 6,  directions: 8 },
  tentacool:  { key: 'tentacool-walk',  path: 'assets/pokemon/tentacool-walk.png',  frameWidth: 24, frameHeight: 40, frameCount: 4,  directions: 8 },
  rhyhorn:    { key: 'rhyhorn-walk',    path: 'assets/pokemon/rhyhorn-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },

  // ── Phase 4 novos ──────────────────────────────────────────────
  weezing:    { key: 'weezing-walk',    path: 'assets/pokemon/weezing-walk.png',    frameWidth: 32, frameHeight: 56, frameCount: 6,  directions: 8 },
  magneton:   { key: 'magneton-walk',   path: 'assets/pokemon/magneton-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 8,  directions: 8 },
  tentacruel: { key: 'tentacruel-walk', path: 'assets/pokemon/tentacruel-walk.png', frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  rhydon:     { key: 'rhydon-walk',     path: 'assets/pokemon/rhydon-walk.png',     frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },
  scyther:    { key: 'scyther-walk',    path: 'assets/pokemon/scyther-walk.png',    frameWidth: 40, frameHeight: 48, frameCount: 4,  directions: 8 },
  mrMime:     { key: 'mr-mime-walk',    path: 'assets/pokemon/mr-mime-walk.png',    frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },
  hitmonlee:  { key: 'hitmonlee-walk',  path: 'assets/pokemon/hitmonlee-walk.png',  frameWidth: 40, frameHeight: 48, frameCount: 4,  directions: 8 },
  electabuzz: { key: 'electabuzz-walk', path: 'assets/pokemon/electabuzz-walk.png', frameWidth: 40, frameHeight: 56, frameCount: 4,  directions: 8 },

  // ── Phase 4 elite ───────────────────────────────────────────────
  alakazam:  { key: 'alakazam-walk',  path: 'assets/pokemon/alakazam-walk.png',  frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  electrode: { key: 'electrode-walk', path: 'assets/pokemon/electrode-walk.png', frameWidth: 32, frameHeight: 40, frameCount: 7,  directions: 8 },
  crobat:    { key: 'crobat-walk',    path: 'assets/pokemon/crobat-walk.png',    frameWidth: 40, frameHeight: 56, frameCount: 8,  directions: 8 },

  // ── Bosses (Phase 1) ──────────────────────────────────────────
  beedrill:  { key: 'beedrill-walk',  path: 'assets/pokemon/beedrill-walk.png',  frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },
  vileplume: { key: 'vileplume-walk', path: 'assets/pokemon/vileplume-walk.png', frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  primeape:  { key: 'primeape-walk',  path: 'assets/pokemon/primeape-walk.png',  frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  gengar:    { key: 'gengar-walk',    path: 'assets/pokemon/gengar-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },

  // ── Bosses (novos — evoluções finais) ─────────────────────────
  fearow:    { key: 'fearow-walk',    path: 'assets/pokemon/fearow-walk.png',    frameWidth: 40, frameHeight: 64, frameCount: 6,  directions: 8 },
  pidgeot:   { key: 'pidgeot-walk',   path: 'assets/pokemon/pidgeot-walk.png',   frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  machamp:   { key: 'machamp-walk',   path: 'assets/pokemon/machamp-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },
  golem:     { key: 'golem-walk',     path: 'assets/pokemon/golem-walk.png',     frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
} as const;
