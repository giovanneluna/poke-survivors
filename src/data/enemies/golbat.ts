import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GOLBAT: EnemyConfig = {
  key: 'golbat',
  name: 'Golbat',
  sprite: SPRITES.golbat,
  hp: 50,
  speed: 90,
  damage: 14,
  xpValue: 12,
  scale: 0.8,
  rangedAttack: {
    projectileKey: 'atk-hyper-voice',
    damage: 8,
    speed: 100,
    cooldownMs: 3500,
    range: 280,
    homing: false,
    projectileScale: 0.8,
  },
};
