import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const HITMONLEE: EnemyConfig = {
  key: 'hitmonlee',
  name: 'Hitmonlee',
  sprite: SPRITES.hitmonlee,
  hp: 90,
  speed: 30,
  damage: 40,
  xpValue: 100,
  scale: 1.1,
  behavior: 'leaper',
};
