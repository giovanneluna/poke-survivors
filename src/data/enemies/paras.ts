import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PARAS: EnemyConfig = {
  key: 'paras',
  name: 'Paras',
  sprite: SPRITES.paras,
  hp: 45,
  speed: 35,
  damage: 10,
  xpValue: 20,
  scale: 1.0,
  contactEffect: {
    type: 'poison',
    durationMs: 4000,
    dps: 3,
  },
};
