import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MEOWTH: EnemyConfig = {
  key: 'meowth',
  name: 'Meowth',
  sprite: SPRITES.meowth,
  hp: 8,
  speed: 65,
  damage: 5,
  xpValue: 8,
  scale: 1.0,
  behavior: 'swooper',
};
