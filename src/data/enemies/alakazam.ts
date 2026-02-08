import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ALAKAZAM: EnemyConfig = {
  key: 'alakazam',
  name: 'Alakazam',
  sprite: SPRITES.alakazam,
  hp: 90,
  speed: 50,
  damage: 12,
  xpValue: 110,
  scale: 1.0,
  teleport: {
    cooldownMs: 5000,
    range: 150,
  },
  rangedAttack: {
    projectileKey: 'atk-psychic',
    damage: 15,
    speed: 160,
    cooldownMs: 3000,
    range: 350,
    homing: true,
    projectileScale: 0.7,
  },
};
