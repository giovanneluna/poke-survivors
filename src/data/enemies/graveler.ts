import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GRAVELER: EnemyConfig = {
  key: 'graveler',
  name: 'Graveler',
  sprite: SPRITES.graveler,
  hp: 80,
  speed: 40,
  damage: 16,
  xpValue: 13,
  scale: 0.9,
};
