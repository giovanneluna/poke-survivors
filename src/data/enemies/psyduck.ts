import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PSYDUCK: EnemyConfig = {
  key: 'psyduck',
  name: 'Psyduck',
  sprite: SPRITES.psyduck,
  hp: 14,
  speed: 45,
  damage: 6,
  xpValue: 8,
  scale: 1.0,
  behavior: 'confuser',
  contactEffect: { type: 'confusion', durationMs: 1500 },
};
