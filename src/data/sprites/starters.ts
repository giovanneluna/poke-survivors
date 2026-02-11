import type { SpriteConfig } from '../../types';

/** Sprites dos starters jogáveis (Charmander line + Bulbasaur + Squirtle) */
export const STARTER_SPRITES: Readonly<Record<string, SpriteConfig>> = {
  charmander:  { key: 'charmander-walk',  path: 'assets/pokemon/charmander-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  charmeleon:  { key: 'charmeleon-walk',  path: 'assets/pokemon/charmeleon-walk.png',  frameWidth: 24, frameHeight: 32, frameCount: 4,  directions: 8 },
  charizard:   { key: 'charizard-walk',   path: 'assets/pokemon/charizard-walk.png',   frameWidth: 40, frameHeight: 48, frameCount: 4,  directions: 8 },
  bulbasaur:   { key: 'bulbasaur-walk',   path: 'assets/pokemon/bulbasaur-walk.png',   frameWidth: 40, frameHeight: 40, frameCount: 6,  directions: 8 },
  ivysaur:     { key: 'ivysaur-walk',     path: 'assets/pokemon/ivysaur-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  venusaur:    { key: 'venusaur-walk',     path: 'assets/pokemon/venusaur-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  squirtle:    { key: 'squirtle-walk',    path: 'assets/pokemon/squirtle-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  wartortle:   { key: 'wartortle-walk',   path: 'assets/pokemon/wartortle-walk.png',   frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  blastoise:   { key: 'blastoise-walk',   path: 'assets/pokemon/blastoise-walk.png',   frameWidth: 32, frameHeight: 40, frameCount: 4,  directions: 8 },
  jigglypuff:  { key: 'jigglypuff-walk',  path: 'assets/pokemon/jigglypuff-walk.png',  frameWidth: 32, frameHeight: 40, frameCount: 5,  directions: 8 },
  abra:        { key: 'abra-walk',        path: 'assets/pokemon/abra-walk.png',        frameWidth: 32, frameHeight: 48, frameCount: 8,  directions: 8 },
} as const;
