import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ELECTABUZZ: EnemyConfig = {
  key: 'electabuzz',
  name: 'Electabuzz',
  sprite: SPRITES.electabuzz,
  hp: 100,
  speed: 85,
  damage: 15,
  xpValue: 95,
  scale: 1.1,
  behavior: 'stunner',
  contactEffect: { type: 'stun', durationMs: 500 },
};
