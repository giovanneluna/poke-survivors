import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const TENTACOOL: EnemyConfig = {
  key: 'tentacool',
  name: 'Tentacool',
  sprite: SPRITES.tentacool,
  hp: 70,
  speed: 45,
  damage: 10,
  xpValue: 50,
  scale: 1.0,
  behavior: 'trapper',
  contactEffect: { type: 'stun', durationMs: 1500 },
};
