import { SPRITES } from '../sprites';
import { CHARMANDER_FORMS } from './charmander-line';
import { SQUIRTLE_FORMS } from './squirtle-line';
import { BULBASAUR_FORMS } from './bulbasaur-line';
import type { StarterConfig } from './charmander-line';

export { CHARMANDER_FORMS, BLAZE_TIERS } from './charmander-line';
export { SQUIRTLE_FORMS, TORRENT_TIERS } from './squirtle-line';
export { BULBASAUR_FORMS, OVERGROW_TIERS } from './bulbasaur-line';
export type { StarterConfig } from './charmander-line';

export const STARTERS: readonly StarterConfig[] = [
  { key: 'charmander',  name: 'Charmander',  sprite: SPRITES.charmander,  type: 'Fogo',     description: 'O lagarto de fogo. Ataques poderosos de chamas!',  unlocked: true,  forms: CHARMANDER_FORMS },
  { key: 'squirtle',    name: 'Squirtle',    sprite: SPRITES.squirtle,    type: 'Água',     description: 'A tartaruga aquática. Jatos de água precisos!',    unlocked: true,  forms: SQUIRTLE_FORMS },
  { key: 'bulbasaur',   name: 'Bulbasaur',   sprite: SPRITES.bulbasaur,   type: 'Planta',   description: 'O dinossauro planta. Esporos e vinhas!',           unlocked: true,  forms: BULBASAUR_FORMS },
  { key: 'jigglypuff',  name: 'Jigglypuff',  sprite: SPRITES.jigglypuff,  type: 'Fada',     description: 'A cantora encantadora. Melodias hipnotizantes!',   unlocked: false },
  { key: 'gastly',      name: 'Gastly',       sprite: SPRITES.gastly,      type: 'Fantasma', description: 'O fantasma gasoso. Maldições e sombras!',          unlocked: false },
  { key: 'abra',        name: 'Abra',         sprite: SPRITES.abra,        type: 'Psíquico', description: 'O psíquico adormecido. Poderes da mente!',         unlocked: false },
] as const;
