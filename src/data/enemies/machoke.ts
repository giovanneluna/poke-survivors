import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MACHOKE: EnemyConfig = {
  key: 'machoke',
  name: 'Machoke',
  sprite: SPRITES.machoke,
  hp: 65,
  speed: 60,
  damage: 18,
  xpValue: 14,
  scale: 0.9,
};
