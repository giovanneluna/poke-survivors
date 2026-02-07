import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const RATTATA: EnemyConfig = {
  key: 'rattata',
  name: 'Rattata',
  sprite: SPRITES.rattata,
  hp: 15,
  speed: 60,
  damage: 5,
  xpValue: 3,
  scale: 1.0,
};
