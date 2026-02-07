import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GEODUDE: EnemyConfig = {
  key: 'geodude',
  name: 'Geodude',
  sprite: SPRITES.geodude,
  hp: 50,
  speed: 35,
  damage: 15,
  xpValue: 10,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'atk-rock-slide',
    damage: 12,
    speed: 100,
    cooldownMs: 4000,
    range: 280,
    homing: false,
    projectileScale: 1.2,
  },
};
