import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const CUBONE: EnemyConfig = {
  key: 'cubone',
  name: 'Cubone',
  sprite: SPRITES.cubone,
  hp: 80,
  speed: 35,
  damage: 12,
  xpValue: 25,
  scale: 1.0,
  behavior: 'berserker',
};
