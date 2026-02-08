import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const BUTTERFREE: EnemyConfig = {
  key: 'butterfree',
  name: 'Butterfree',
  sprite: SPRITES.butterfree,
  hp: 70,
  speed: 65,
  damage: 10,
  xpValue: 18,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'confusion-wave',
    damage: 10,
    speed: 110,
    cooldownMs: 3000,
    range: 280,
    homing: false,
    projectileScale: 1.2,
    effect: 'confusion',
    effectDurationMs: 2500,
  },
};
