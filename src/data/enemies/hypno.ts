import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const HYPNO: EnemyConfig = {
  key: 'hypno',
  name: 'Hypno',
  sprite: SPRITES.hypno,
  hp: 100,
  speed: 40,
  damage: 15,
  xpValue: 20,
  scale: 1.1,
  rangedAttack: {
    projectileKey: 'psychic-projectile',
    damage: 15,
    speed: 130,
    cooldownMs: 3500,
    range: 320,
    homing: true,
    projectileScale: 1.2,
    effect: 'stun',
    effectDurationMs: 2000,
  },
};
