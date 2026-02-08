import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const KAKUNA: EnemyConfig = {
  key: 'kakuna',
  name: 'Kakuna',
  sprite: SPRITES.kakuna,
  hp: 130,
  speed: 15,
  damage: 3,
  xpValue: 12,
  scale: 1.0,
  contactEffect: {
    type: 'poison',
    durationMs: 2000,
    dps: 2,
  },
};
