import type { SpriteConfig } from '../types';

export const SPRITES: Readonly<Record<string, SpriteConfig>> = {
  charmander:  { key: 'charmander-walk',  path: 'assets/pokemon/charmander-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  charmeleon:  { key: 'charmeleon-walk',  path: 'assets/pokemon/charmeleon-walk.png',  frameWidth: 32, frameHeight: 32, frameCount: 3,  directions: 8 },
  charizard:   { key: 'charizard-walk',   path: 'assets/pokemon/charizard-walk.png',   frameWidth: 40, frameHeight: 48, frameCount: 4,  directions: 8 },
  bulbasaur:   { key: 'bulbasaur-walk',   path: 'assets/pokemon/bulbasaur-walk.png',   frameWidth: 48, frameHeight: 40, frameCount: 5,  directions: 8 },
  squirtle:    { key: 'squirtle-walk',    path: 'assets/pokemon/squirtle-walk.png',    frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  rattata:     { key: 'rattata-walk',     path: 'assets/pokemon/rattata-walk.png',     frameWidth: 48, frameHeight: 40, frameCount: 7,  directions: 8 },
  pidgey:      { key: 'pidgey-walk',      path: 'assets/pokemon/pidgey-walk.png',      frameWidth: 32, frameHeight: 32, frameCount: 5,  directions: 8 },
  zubat:       { key: 'zubat-walk',       path: 'assets/pokemon/zubat-walk.png',       frameWidth: 32, frameHeight: 56, frameCount: 8,  directions: 8 },
  geodude:     { key: 'geodude-walk',     path: 'assets/pokemon/geodude-walk.png',     frameWidth: 32, frameHeight: 32, frameCount: 4,  directions: 8 },
  gastly:      { key: 'gastly-walk',      path: 'assets/pokemon/gastly-walk.png',      frameWidth: 48, frameHeight: 64, frameCount: 12, directions: 8 },
} as const;
