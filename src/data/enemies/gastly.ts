import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GASTLY: EnemyConfig = {
  key: 'gastly',
  name: 'Gastly',
  sprite: SPRITES.gastly,
  hp: 25,
  speed: 50,
  damage: 10,
  xpValue: 15,
  scale: 0.7,
  rangedAttack: {
    projectileKey: 'atk-shadow-ball',
    damage: 8,
    speed: 55,
    cooldownMs: 4500,
    range: 350,
    homing: false,
  },
};
