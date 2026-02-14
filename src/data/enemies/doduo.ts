import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const DODUO: EnemyConfig = {
  key: 'doduo',
  name: 'Doduo',
  sprite: SPRITES.doduo,
  hp: 10,
  speed: 85,
  damage: 5,
  xpValue: 6,
  scale: 1.0,
  behavior: 'charger',
};
