import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const KRABBY: EnemyConfig = {
  key: 'krabby',
  name: 'Krabby',
  sprite: SPRITES.krabby,
  hp: 13,
  speed: 50,
  damage: 8,
  xpValue: 8,
  scale: 1.0,
  behavior: 'berserker',
};
