import type { SpriteConfig, AttackAnimConfig } from '../../types';

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

  // ── Stage 2 — Kanto Coast: commons ──────────────────────────────────
  pikachu:    { key: 'pikachu-walk',    path: 'assets/pokemon/pikachu-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  sandshrew:  { key: 'sandshrew-walk',  path: 'assets/pokemon/sandshrew-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  vulpix:     { key: 'vulpix-walk',     path: 'assets/pokemon/vulpix-walk.png',     frameWidth: 32, frameHeight: 40, frameCount: 5,  directions: 8 },
  diglett:    { key: 'diglett-walk',    path: 'assets/pokemon/diglett-walk.png',    frameWidth: 40, frameHeight: 40, frameCount: 3,  directions: 8 },
  meowth:     { key: 'meowth-walk',     path: 'assets/pokemon/meowth-walk.png',     frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  psyduck:    { key: 'psyduck-walk',    path: 'assets/pokemon/psyduck-walk.png',    frameWidth: 24, frameHeight: 40, frameCount: 4,  directions: 8 },
  growlithe:  { key: 'growlithe-walk',  path: 'assets/pokemon/growlithe-walk.png',  frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  poliwag:    { key: 'poliwag-walk',    path: 'assets/pokemon/poliwag-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 5,  directions: 8 },
  bellsprout: { key: 'bellsprout-walk', path: 'assets/pokemon/bellsprout-walk.png', frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  ponyta:     { key: 'ponyta-walk',     path: 'assets/pokemon/ponyta-walk.png',     frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  slowpoke:   { key: 'slowpoke-walk',   path: 'assets/pokemon/slowpoke-walk.png',   frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  farfetchd:  { key: 'farfetchd-walk',  path: 'assets/pokemon/farfetchd-walk.png',  frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  doduo:      { key: 'doduo-walk',      path: 'assets/pokemon/doduo-walk.png',      frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  seel:       { key: 'seel-walk',       path: 'assets/pokemon/seel-walk.png',       frameWidth: 32, frameHeight: 40, frameCount: 7,  directions: 8 },
  grimer_p2:  { key: 'grimer-p2-walk',  path: 'assets/pokemon/grimer-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 6,  directions: 8 },
  shellder:   { key: 'shellder-walk',   path: 'assets/pokemon/shellder-walk.png',   frameWidth: 24, frameHeight: 32, frameCount: 6,  directions: 8 },
  krabby:     { key: 'krabby-walk',     path: 'assets/pokemon/krabby-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  exeggcute:  { key: 'exeggcute-walk',  path: 'assets/pokemon/exeggcute-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  horsea:     { key: 'horsea-walk',     path: 'assets/pokemon/horsea-walk.png',     frameWidth: 24, frameHeight: 48, frameCount: 4,  directions: 8 },
  goldeen:    { key: 'goldeen-walk',    path: 'assets/pokemon/goldeen-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 8,  directions: 8 },
  staryu:     { key: 'staryu-walk',     path: 'assets/pokemon/staryu-walk.png',     frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  jigglypuff: { key: 'jigglypuff-walk', path: 'assets/pokemon/jigglypuff-walk.png', frameWidth: 32, frameHeight: 40, frameCount: 5,  directions: 8 },

  // ── Stage 2 — Kanto Coast: bosses ───────────────────────────────────
  arcanine:   { key: 'arcanine-walk',   path: 'assets/pokemon/arcanine-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 4,  directions: 8 },
  ninetales:  { key: 'ninetales-walk',  path: 'assets/pokemon/ninetales-walk.png',  frameWidth: 40, frameHeight: 40, frameCount: 4,  directions: 8 },
  victreebel: { key: 'victreebel-walk', path: 'assets/pokemon/victreebel-walk.png', frameWidth: 32, frameHeight: 56, frameCount: 4,  directions: 8 },
  golduck:    { key: 'golduck-walk',    path: 'assets/pokemon/golduck-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  cloyster:   { key: 'cloyster-walk',   path: 'assets/pokemon/cloyster-walk.png',   frameWidth: 32, frameHeight: 48, frameCount: 6,  directions: 8 },
  muk:        { key: 'muk-walk',        path: 'assets/pokemon/muk-walk.png',        frameWidth: 48, frameHeight: 40, frameCount: 5,  directions: 8 },
  rapidash:   { key: 'rapidash-walk',   path: 'assets/pokemon/rapidash-walk.png',   frameWidth: 40, frameHeight: 56, frameCount: 4,  directions: 8 },
  starmie:    { key: 'starmie-walk',    path: 'assets/pokemon/starmie-walk.png',    frameWidth: 24, frameHeight: 40, frameCount: 4,  directions: 8 },
  slowbro:    { key: 'slowbro-walk',    path: 'assets/pokemon/slowbro-walk.png',    frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  poliwrath:  { key: 'poliwrath-walk',  path: 'assets/pokemon/poliwrath-walk.png',  frameWidth: 40, frameHeight: 40, frameCount: 4,  directions: 8 },
  lapras:     { key: 'lapras-walk',     path: 'assets/pokemon/lapras-walk.png',     frameWidth: 48, frameHeight: 56, frameCount: 4,  directions: 8 },
} as const;

/** Attack/Shoot/Charge animation sprites (PMDCollab) — auto-generated */
export const ENEMY_ATTACK_SPRITES: Readonly<Record<string, AttackAnimConfig>> = {
  rattata:    { key: 'rattata-attack',    path: 'assets/pokemon/rattata-attack.png',    frameWidth: 64,  frameHeight: 72, frameCount: 10, directions: 8, animType: 'attack' },
  pidgey:     { key: 'pidgey-attack',     path: 'assets/pokemon/pidgey-attack.png',     frameWidth: 64,  frameHeight: 72, frameCount: 14, directions: 8, animType: 'attack' },
  zubat:      { key: 'zubat-attack',      path: 'assets/pokemon/zubat-attack.png',      frameWidth: 72,  frameHeight: 80, frameCount: 11, directions: 8, animType: 'attack' },
  geodude:    { key: 'geodude-charge',    path: 'assets/pokemon/geodude-charge.png',    frameWidth: 32,  frameHeight: 40, frameCount: 10, directions: 8, animType: 'charge' },
  gastly:     { key: 'gastly-shoot',      path: 'assets/pokemon/gastly-shoot.png',      frameWidth: 48,  frameHeight: 64, frameCount: 11, directions: 8, animType: 'shoot' },
  caterpie:   { key: 'caterpie-attack',   path: 'assets/pokemon/caterpie-attack.png',   frameWidth: 64,  frameHeight: 64, frameCount: 11, directions: 8, animType: 'attack' },
  weedle:     { key: 'weedle-attack',     path: 'assets/pokemon/weedle-attack.png',     frameWidth: 64,  frameHeight: 64, frameCount: 11, directions: 8, animType: 'attack' },
  spearow:    { key: 'spearow-attack',    path: 'assets/pokemon/spearow-attack.png',    frameWidth: 64,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  ekans:      { key: 'ekans-attack',      path: 'assets/pokemon/ekans-attack.png',      frameWidth: 72,  frameHeight: 72, frameCount: 11, directions: 8, animType: 'attack' },
  oddish:     { key: 'oddish-attack',     path: 'assets/pokemon/oddish-attack.png',     frameWidth: 72,  frameHeight: 80, frameCount: 15, directions: 8, animType: 'attack' },
  mankey:     { key: 'mankey-attack',     path: 'assets/pokemon/mankey-attack.png',     frameWidth: 64,  frameHeight: 80, frameCount: 15, directions: 8, animType: 'attack' },
  haunter:    { key: 'haunter-shoot',     path: 'assets/pokemon/haunter-shoot.png',     frameWidth: 56,  frameHeight: 56, frameCount: 12, directions: 8, animType: 'shoot' },
  machop:     { key: 'machop-attack',     path: 'assets/pokemon/machop-attack.png',     frameWidth: 64,  frameHeight: 80, frameCount: 10, directions: 8, animType: 'attack' },
  golbat:     { key: 'golbat-attack',     path: 'assets/pokemon/golbat-attack.png',     frameWidth: 72,  frameHeight: 88, frameCount: 11, directions: 8, animType: 'attack' },
  raticate:   { key: 'raticate-attack',   path: 'assets/pokemon/raticate-attack.png',   frameWidth: 72,  frameHeight: 72, frameCount: 13, directions: 8, animType: 'attack' },
  arbok:      { key: 'arbok-attack',      path: 'assets/pokemon/arbok-attack.png',      frameWidth: 80,  frameHeight: 88, frameCount: 10, directions: 8, animType: 'attack' },
  nidoking:   { key: 'nidoking-attack',   path: 'assets/pokemon/nidoking-attack.png',   frameWidth: 72,  frameHeight: 80, frameCount: 13, directions: 8, animType: 'attack' },
  snorlax:    { key: 'snorlax-attack',    path: 'assets/pokemon/snorlax-attack.png',    frameWidth: 64,  frameHeight: 88, frameCount: 10, directions: 8, animType: 'attack' },
  metapod:    { key: 'metapod-attack',    path: 'assets/pokemon/metapod-attack.png',    frameWidth: 72,  frameHeight: 80, frameCount: 10, directions: 8, animType: 'attack' },
  kakuna:     { key: 'kakuna-attack',     path: 'assets/pokemon/kakuna-attack.png',     frameWidth: 64,  frameHeight: 72, frameCount: 14, directions: 8, animType: 'attack' },
  gloom:      { key: 'gloom-attack',      path: 'assets/pokemon/gloom-attack.png',      frameWidth: 72,  frameHeight: 80, frameCount: 15, directions: 8, animType: 'attack' },
  paras:      { key: 'paras-attack',      path: 'assets/pokemon/paras-attack.png',      frameWidth: 64,  frameHeight: 72, frameCount: 13, directions: 8, animType: 'attack' },
  venonat:    { key: 'venonat-attack',    path: 'assets/pokemon/venonat-attack.png',    frameWidth: 72,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  drowzee:    { key: 'drowzee-shoot',     path: 'assets/pokemon/drowzee-shoot.png',     frameWidth: 56,  frameHeight: 56, frameCount: 11, directions: 8, animType: 'shoot' },
  cubone:     { key: 'cubone-attack',     path: 'assets/pokemon/cubone-attack.png',     frameWidth: 64,  frameHeight: 72, frameCount: 10, directions: 8, animType: 'attack' },
  butterfree: { key: 'butterfree-attack', path: 'assets/pokemon/butterfree-attack.png', frameWidth: 72,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  parasect:   { key: 'parasect-attack',   path: 'assets/pokemon/parasect-attack.png',   frameWidth: 72,  frameHeight: 72, frameCount: 19, directions: 8, animType: 'attack' },
  venomoth:   { key: 'venomoth-attack',   path: 'assets/pokemon/venomoth-attack.png',   frameWidth: 72,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  hypno:      { key: 'hypno-shoot',       path: 'assets/pokemon/hypno-shoot.png',       frameWidth: 56,  frameHeight: 48, frameCount: 14, directions: 8, animType: 'shoot' },
  marowak:    { key: 'marowak-attack',    path: 'assets/pokemon/marowak-attack.png',    frameWidth: 72,  frameHeight: 88, frameCount: 9,  directions: 8, animType: 'attack' },
  pidgeotto:  { key: 'pidgeotto-attack',  path: 'assets/pokemon/pidgeotto-attack.png',  frameWidth: 64,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  graveler:   { key: 'graveler-attack',   path: 'assets/pokemon/graveler-attack.png',   frameWidth: 80,  frameHeight: 80, frameCount: 10, directions: 8, animType: 'attack' },
  machoke:    { key: 'machoke-attack',    path: 'assets/pokemon/machoke-attack.png',    frameWidth: 72,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  koffing:    { key: 'koffing-attack',    path: 'assets/pokemon/koffing-attack.png',    frameWidth: 72,  frameHeight: 80, frameCount: 15, directions: 8, animType: 'attack' },
  magnemite:  { key: 'magnemite-attack',  path: 'assets/pokemon/magnemite-attack.png',  frameWidth: 72,  frameHeight: 72, frameCount: 19, directions: 8, animType: 'attack' },
  tentacool:  { key: 'tentacool-attack',  path: 'assets/pokemon/tentacool-attack.png',  frameWidth: 64,  frameHeight: 72, frameCount: 14, directions: 8, animType: 'attack' },
  rhyhorn:    { key: 'rhyhorn-charge',    path: 'assets/pokemon/rhyhorn-charge.png',    frameWidth: 32,  frameHeight: 32, frameCount: 10, directions: 8, animType: 'charge' },
  weezing:    { key: 'weezing-attack',    path: 'assets/pokemon/weezing-attack.png',    frameWidth: 72,  frameHeight: 80, frameCount: 12, directions: 8, animType: 'attack' },
  magneton:   { key: 'magneton-attack',   path: 'assets/pokemon/magneton-attack.png',   frameWidth: 72,  frameHeight: 72, frameCount: 10, directions: 8, animType: 'attack' },
  tentacruel: { key: 'tentacruel-attack', path: 'assets/pokemon/tentacruel-attack.png', frameWidth: 64,  frameHeight: 72, frameCount: 14, directions: 8, animType: 'attack' },
  rhydon:     { key: 'rhydon-charge',     path: 'assets/pokemon/rhydon-charge.png',     frameWidth: 48,  frameHeight: 48, frameCount: 10, directions: 8, animType: 'charge' },
  scyther:    { key: 'scyther-attack',    path: 'assets/pokemon/scyther-attack.png',    frameWidth: 72,  frameHeight: 80, frameCount: 10, directions: 8, animType: 'attack' },
  'mr-mime':  { key: 'mr-mime-attack',    path: 'assets/pokemon/mr-mime-attack.png',    frameWidth: 72,  frameHeight: 88, frameCount: 11, directions: 8, animType: 'attack' },
  hitmonlee:  { key: 'hitmonlee-charge',  path: 'assets/pokemon/hitmonlee-charge.png',  frameWidth: 40,  frameHeight: 40, frameCount: 10, directions: 8, animType: 'charge' },
  electabuzz: { key: 'electabuzz-attack', path: 'assets/pokemon/electabuzz-attack.png', frameWidth: 72,  frameHeight: 72, frameCount: 10, directions: 8, animType: 'attack' },
  alakazam:   { key: 'alakazam-attack',   path: 'assets/pokemon/alakazam-attack.png',   frameWidth: 72,  frameHeight: 72, frameCount: 10, directions: 8, animType: 'attack' },
  electrode:  { key: 'electrode-attack',  path: 'assets/pokemon/electrode-attack.png',  frameWidth: 64,  frameHeight: 72, frameCount: 13, directions: 8, animType: 'attack' },
  crobat:     { key: 'crobat-charge',     path: 'assets/pokemon/crobat-charge.png',     frameWidth: 32,  frameHeight: 56, frameCount: 10, directions: 8, animType: 'charge' },
  beedrill:   { key: 'beedrill-attack',   path: 'assets/pokemon/beedrill-attack.png',   frameWidth: 64,  frameHeight: 80, frameCount: 18, directions: 8, animType: 'attack' },
  vileplume:  { key: 'vileplume-attack',  path: 'assets/pokemon/vileplume-attack.png',  frameWidth: 72,  frameHeight: 72, frameCount: 15, directions: 8, animType: 'attack' },
  primeape:   { key: 'primeape-attack',   path: 'assets/pokemon/primeape-attack.png',   frameWidth: 72,  frameHeight: 80, frameCount: 14, directions: 8, animType: 'attack' },
  gengar:     { key: 'gengar-attack',     path: 'assets/pokemon/gengar-attack.png',     frameWidth: 72,  frameHeight: 80, frameCount: 11, directions: 8, animType: 'attack' },
  fearow:     { key: 'fearow-attack',     path: 'assets/pokemon/fearow-attack.png',     frameWidth: 64,  frameHeight: 72, frameCount: 15, directions: 8, animType: 'attack' },
  pidgeot:    { key: 'pidgeot-attack',    path: 'assets/pokemon/pidgeot-attack.png',    frameWidth: 72,  frameHeight: 72, frameCount: 14, directions: 8, animType: 'attack' },
  machamp:    { key: 'machamp-attack',    path: 'assets/pokemon/machamp-attack.png',    frameWidth: 72,  frameHeight: 88, frameCount: 13, directions: 8, animType: 'attack' },
  golem:      { key: 'golem-attack',      path: 'assets/pokemon/golem-attack.png',      frameWidth: 72,  frameHeight: 80, frameCount: 15, directions: 8, animType: 'attack' },
} as const;
