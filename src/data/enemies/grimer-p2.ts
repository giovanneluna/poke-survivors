import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GRIMER_P2: EnemyConfig = {
  key: 'grimer-p2',
  name: 'Grimer',
  sprite: SPRITES.grimer_p2,
  hp: 35,
  speed: 35,
  damage: 5,
  xpValue: 5,
  scale: 1.0,
  behavior: 'sporeWalker',
  contactEffect: { type: 'poison', durationMs: 3000, dps: 3 },
};
