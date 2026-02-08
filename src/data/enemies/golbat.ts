import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GOLBAT: EnemyConfig = {
  key: 'golbat',
  name: 'Golbat',
  sprite: SPRITES.golbat,
  hp: 50,
  speed: 90,
  damage: 14,
  xpValue: 12,
  scale: 0.8,
};
