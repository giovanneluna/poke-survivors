import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SEEL: EnemyConfig = {
  key: 'seel',
  name: 'Seel',
  sprite: SPRITES.seel,
  hp: 30,
  speed: 40,
  damage: 5,
  xpValue: 4,
  scale: 1.0,
  contactEffect: { type: 'slow', durationMs: 1500, multiplier: 0.4 },
};
