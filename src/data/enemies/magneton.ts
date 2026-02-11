import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MAGNETON: EnemyConfig = {
  key: 'magneton',
  name: 'Magneton',
  sprite: SPRITES.magneton,
  hp: 100,
  speed: 45,
  damage: 14,
  xpValue: 95,
  scale: 1.0,
  behavior: 'pullerElite',
};
