import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VENONAT: EnemyConfig = {
  key: 'venonat',
  name: 'Venonat',
  sprite: SPRITES.venonat,
  hp: 40,
  speed: 45,
  damage: 8,
  xpValue: 25,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'atk-psybeam',
    damage: 8,
    speed: 100,
    cooldownMs: 3500,
    range: 250,
    homing: false,
    projectileScale: 0.5,
    effect: 'confusion',
    effectDurationMs: 2000,
  },
};
