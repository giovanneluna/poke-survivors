import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const DROWZEE: EnemyConfig = {
  key: 'drowzee',
  name: 'Drowzee',
  sprite: SPRITES.drowzee,
  hp: 55,
  speed: 35,
  damage: 8,
  xpValue: 25,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'atk-psychic',
    damage: 10,
    speed: 90,
    cooldownMs: 4000,
    range: 250,
    homing: false,
    projectileScale: 0.7,
    effect: 'stun',
    effectDurationMs: 1500,
  },
};
