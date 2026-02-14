import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const HORSEA: EnemyConfig = {
  key: 'horsea',
  name: 'Horsea',
  sprite: SPRITES.horsea,
  hp: 14,
  speed: 45,
  damage: 4,
  xpValue: 4,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'water-particle',
    damage: 5,
    speed: 200,
    cooldownMs: 2500,
    range: 200,
    homing: false,
  },
};
