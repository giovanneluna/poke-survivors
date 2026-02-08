import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const HAUNTER: EnemyConfig = {
  key: 'haunter',
  name: 'Haunter',
  sprite: SPRITES.haunter,
  hp: 40,
  speed: 55,
  damage: 12,
  xpValue: 12,
  scale: 0.8,
  rangedAttack: {
    projectileKey: 'atk-shadow-ball',
    damage: 10,
    speed: 60,
    cooldownMs: 4000,
    range: 350,
    homing: true,
  },
};
