import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MACHOP: EnemyConfig = {
  key: 'machop',
  name: 'Machop',
  sprite: SPRITES.machop,
  hp: 80,
  speed: 40,
  damage: 18,
  xpValue: 10,
  scale: 1.2,
};
