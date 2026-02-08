import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GLOOM: EnemyConfig = {
  key: 'gloom',
  name: 'Gloom',
  sprite: SPRITES.gloom,
  hp: 60,
  speed: 30,
  damage: 5,
  xpValue: 12,
  scale: 1.0,
  contactEffect: {
    type: 'slow',
    durationMs: 2000,
  },
  healAura: {
    hpPerSecond: 3,
    radius: 80,
  },
};
