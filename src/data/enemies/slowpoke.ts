import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SLOWPOKE: EnemyConfig = {
  key: 'slowpoke',
  name: 'Slowpoke',
  sprite: SPRITES.slowpoke,
  hp: 50,
  speed: 25,
  damage: 4,
  xpValue: 5,
  scale: 1.0,
  behavior: 'tank',
};
