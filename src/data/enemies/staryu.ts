import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const STARYU: EnemyConfig = {
  key: 'staryu',
  name: 'Staryu',
  sprite: SPRITES.staryu,
  hp: 18,
  speed: 60,
  damage: 5,
  xpValue: 4,
  scale: 1.0,
  behavior: 'circler',
};
