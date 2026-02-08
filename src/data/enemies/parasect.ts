import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PARASECT: EnemyConfig = {
  key: 'parasect',
  name: 'Parasect',
  sprite: SPRITES.parasect,
  hp: 150,
  speed: 25,
  damage: 15,
  xpValue: 55,
  scale: 1.2,
  contactEffect: {
    type: 'poison',
    durationMs: 4000,
    dps: 4,
  },
  slowAura: {
    radius: 100,
    multiplier: 0.4,
  },
};
