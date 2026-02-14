import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const POLIWAG: EnemyConfig = {
  key: 'poliwag',
  name: 'Poliwag',
  sprite: SPRITES.poliwag,
  hp: 8,
  speed: 50,
  damage: 4,
  xpValue: 5,
  scale: 1.0,
};
