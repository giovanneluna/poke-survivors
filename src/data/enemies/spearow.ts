import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SPEAROW: EnemyConfig = {
  key: 'spearow',
  name: 'Spearow',
  sprite: SPRITES.spearow,
  hp: 20,
  speed: 85,
  damage: 7,
  xpValue: 5,
  scale: 1.0,
};
