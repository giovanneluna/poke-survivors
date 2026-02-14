import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SANDSHREW: EnemyConfig = {
  key: 'sandshrew',
  name: 'Sandshrew',
  sprite: SPRITES.sandshrew,
  hp: 35,
  speed: 40,
  damage: 4,
  xpValue: 3,
  scale: 1.0,
  behavior: 'tank',
};
