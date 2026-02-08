import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const METAPOD: EnemyConfig = {
  key: 'metapod',
  name: 'Metapod',
  sprite: SPRITES.metapod,
  hp: 120,
  speed: 15,
  damage: 2,
  xpValue: 5,
  scale: 1.0,
};
