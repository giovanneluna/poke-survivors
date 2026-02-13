import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GOLDEEN: EnemyConfig = {
  key: 'goldeen',
  name: 'Goldeen',
  sprite: SPRITES.goldeen,
  hp: 20,
  speed: 70,
  damage: 6,
  xpValue: 4,
  scale: 1.0,
  behavior: 'swooper',
};
