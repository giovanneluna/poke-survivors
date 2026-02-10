import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PIDGEOTTO: EnemyConfig = {
  key: 'pidgeotto',
  name: 'Pidgeotto',
  sprite: SPRITES.pidgeotto,
  hp: 40,
  speed: 85,
  damage: 12,
  xpValue: 10,
  scale: 0.8,
  behavior: 'circler',
};
