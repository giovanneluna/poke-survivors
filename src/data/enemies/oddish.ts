import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ODDISH: EnemyConfig = {
  key: 'oddish',
  name: 'Oddish',
  sprite: SPRITES.oddish,
  hp: 25,
  speed: 35,
  damage: 5,
  xpValue: 6,
  scale: 1.0,
  contactEffect: {
    type: 'slow',
    durationMs: 2000,
    multiplier: 0.5,
  },
};
