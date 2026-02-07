import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const WEEDLE: EnemyConfig = {
  key: 'weedle',
  name: 'Weedle',
  sprite: SPRITES.weedle,
  hp: 10,
  speed: 45,
  damage: 4,
  xpValue: 2,
  scale: 1.0,
  contactEffect: {
    type: 'slow',
    durationMs: 2000,
    multiplier: 0.4,
  },
};
