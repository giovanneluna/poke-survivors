import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PIDGEY: EnemyConfig = {
  key: 'pidgey',
  name: 'Pidgey',
  sprite: SPRITES.pidgey,
  hp: 20,
  speed: 50,
  damage: 8,
  xpValue: 5,
  scale: 1.0,
};
