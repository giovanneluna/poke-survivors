import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MAGNEMITE: EnemyConfig = {
  key: 'magnemite',
  name: 'Magnemite',
  sprite: SPRITES.magnemite,
  hp: 60,
  speed: 40,
  damage: 10,
  xpValue: 45,
  scale: 0.8,
  behavior: 'puller',
};
