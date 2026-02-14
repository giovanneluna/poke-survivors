import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SHELLDER: EnemyConfig = {
  key: 'shellder',
  name: 'Shellder',
  sprite: SPRITES.shellder,
  hp: 22,
  speed: 30,
  damage: 4,
  xpValue: 6,
  scale: 1.0,
  behavior: 'tank',
};
