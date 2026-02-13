import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const POLIWAG: EnemyConfig = {
  key: 'poliwag',
  name: 'Poliwag',
  sprite: SPRITES.poliwag,
  hp: 15,
  speed: 50,
  damage: 4,
  xpValue: 3,
  scale: 1.0,
};
