import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PIKACHU: EnemyConfig = {
  key: 'pikachu',
  name: 'Pikachu',
  sprite: SPRITES.pikachu,
  hp: 11,
  speed: 75,
  damage: 6,
  xpValue: 6,
  scale: 1.0,
  behavior: 'dasher',
  contactEffect: { type: 'stun', durationMs: 300 },
};
