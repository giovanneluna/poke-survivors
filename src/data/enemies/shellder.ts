import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SHELLDER: EnemyConfig = {
  key: 'shellder',
  name: 'Shellder',
  sprite: SPRITES.shellder,
  hp: 40,
  speed: 30,
  damage: 4,
  xpValue: 4,
  scale: 1.0,
  behavior: 'tank',
};
