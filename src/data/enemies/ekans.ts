import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const EKANS: EnemyConfig = {
  key: 'ekans',
  name: 'Ekans',
  sprite: SPRITES.ekans,
  hp: 30,
  speed: 45,
  damage: 8,
  xpValue: 6,
  scale: 1.0,
  contactEffect: {
    type: 'poison',
    durationMs: 3000,
    dps: 2,
  },
};
