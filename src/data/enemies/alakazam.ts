import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ALAKAZAM: EnemyConfig = {
  key: 'alakazam',
  name: 'Alakazam',
  sprite: SPRITES.alakazam,
  hp: 90,
  speed: 50,    // Behavior applies 40% multiplier
  damage: 12,
  xpValue: 110,
  scale: 1.0,
  behavior: 'teleporter',
  contactEffect: { type: 'stun', durationMs: 1000 },
};
