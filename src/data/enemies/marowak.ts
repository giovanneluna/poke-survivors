import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MAROWAK: EnemyConfig = {
  key: 'marowak',
  name: 'Marowak',
  sprite: SPRITES.marowak,
  hp: 160,
  speed: 40,
  damage: 18,
  xpValue: 18,
  scale: 1.1,
  boomerang: {
    projectileKey: 'bone-projectile',
    damage: 18,
    speed: 150,
    cooldownMs: 3000,
    range: 300,
    projectileScale: 1.2,
  },
};
