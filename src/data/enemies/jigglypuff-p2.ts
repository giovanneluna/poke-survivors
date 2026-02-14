import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const JIGGLYPUFF: EnemyConfig = {
  key: 'jigglypuff',
  name: 'Jigglypuff',
  sprite: SPRITES.jigglypuff,
  hp: 14,
  speed: 40,
  damage: 4,
  xpValue: 8,
  scale: 1.0,
  behavior: 'confuser',
  contactEffect: { type: 'stun', durationMs: 2000 },
};
