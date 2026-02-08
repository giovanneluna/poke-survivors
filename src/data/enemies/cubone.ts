import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const CUBONE: EnemyConfig = {
  key: 'cubone',
  name: 'Cubone',
  sprite: SPRITES.cubone,
  hp: 80,
  speed: 35,
  damage: 12,
  xpValue: 10,
  scale: 1.0,
  boomerang: {
    projectileKey: 'bone-projectile',
    damage: 10,
    speed: 120,
    cooldownMs: 3500,
    range: 250,
    projectileScale: 1.0,
  },
};
