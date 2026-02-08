import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PIDGEOTTO: EnemyConfig = {
  key: 'pidgeotto',
  name: 'Pidgeotto',
  sprite: SPRITES.pidgeotto,
  hp: 40,
  speed: 85,
  damage: 12,
  xpValue: 10,
  scale: 0.8,
  rangedAttack: {
    projectileKey: 'atk-air-slash',
    damage: 7,
    speed: 130,
    cooldownMs: 3200,
    range: 260,
    homing: false,
    projectileScale: 1.0,
  },
};
