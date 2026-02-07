import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const CATERPIE: EnemyConfig = {
  key: 'caterpie',
  name: 'Caterpie',
  sprite: SPRITES.caterpie,
  hp: 8,
  speed: 40,
  damage: 3,
  xpValue: 2,
  scale: 1.0,
  contactEffect: {
    type: 'slow',
    durationMs: 1500,
    multiplier: 0.4,
  },
};
