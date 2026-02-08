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
} as const;
