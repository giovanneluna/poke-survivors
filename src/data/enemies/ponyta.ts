import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PONYTA: EnemyConfig = {
  key: 'ponyta',
  name: 'Ponyta',
  sprite: SPRITES.ponyta,
  hp: 20,
  speed: 80,
  damage: 6,
  xpValue: 4,
  scale: 1.0,
  behavior: 'swooper',
};
