import { SPRITES } from '../sprites';
import { CHARMANDER_FORMS } from './charmander-line';
import type { StarterConfig } from './charmander-line';

export { CHARMANDER_FORMS, BLAZE_TIERS } from './charmander-line';
export type { StarterConfig } from './charmander-line';

export const STARTERS: readonly StarterConfig[] = [
  { key: 'charmander', name: 'Charmander', sprite: SPRITES.charmander, type: 'Fogo', description: 'O lagarto de fogo. Ataques poderosos de chamas!', unlocked: true, forms: CHARMANDER_FORMS },
  { key: 'squirtle',   name: 'Squirtle',   sprite: SPRITES.squirtle,   type: 'Água', description: 'A tartaruga aquática. Jatos de água precisos!', unlocked: false, forms: [] },
  { key: 'bulbasaur',  name: 'Bulbasaur',  sprite: SPRITES.bulbasaur,  type: 'Planta', description: 'O dinossauro planta. Esporos e vinhas!', unlocked: false, forms: [] },
] as const;
