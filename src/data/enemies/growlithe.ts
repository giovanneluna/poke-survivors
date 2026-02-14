import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GROWLITHE: EnemyConfig = {
  key: 'growlithe',
  name: 'Growlithe',
  sprite: SPRITES.growlithe,
  hp: 13,
  speed: 65,
  damage: 7,
  xpValue: 6,
  scale: 1.0,
  behavior: 'charger',
  contactEffect: { type: 'knockback', durationMs: 200, force: 100 },
};
