import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PONYTA: EnemyConfig = {
  key: 'ponyta',
  name: 'Ponyta',
  sprite: SPRITES.ponyta,
  hp: 11,
  speed: 80,
  damage: 6,
  xpValue: 6,
  scale: 1.0,
  behavior: 'swooper',
};
