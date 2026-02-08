import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VENOMOTH: EnemyConfig = {
  key: 'venomoth',
  name: 'Venomoth',
  sprite: SPRITES.venomoth,
  hp: 80,
  speed: 80,
  damage: 12,
  xpValue: 18,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'confusion-wave',
    damage: 12,
    speed: 120,
    cooldownMs: 2800,
    range: 300,
    homing: false,
    projectileScale: 1.0,
    effect: 'confusion',
    effectDurationMs: 3000,
  },
};
