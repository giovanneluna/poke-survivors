import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MANKEY: EnemyConfig = {
  key: 'mankey',
  name: 'Mankey',
  sprite: SPRITES.mankey,
  hp: 35,
  speed: 80,
  damage: 12,
  xpValue: 8,
  scale: 1.0,
};
