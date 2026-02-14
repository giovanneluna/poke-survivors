import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const STARYU: EnemyConfig = {
  key: 'staryu',
  name: 'Staryu',
  sprite: SPRITES.staryu,
  hp: 10,
  speed: 60,
  damage: 5,
  xpValue: 6,
  scale: 1.0,
  behavior: 'circler',
};
