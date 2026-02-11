import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const RHYHORN: EnemyConfig = {
  key: 'rhyhorn',
  name: 'Rhyhorn',
  sprite: SPRITES.rhyhorn,
  hp: 120,
  speed: 25,
  damage: 22,
  xpValue: 55,
  scale: 1.2,
  behavior: 'rammer',
  contactEffect: { type: 'knockback', durationMs: 300, force: 300 },
};
