import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MR_MIME: EnemyConfig = {
  key: 'mr-mime',
  name: 'Mr. Mime',
  sprite: SPRITES.mrMime,
  hp: 60,
  speed: 35,
  damage: 8,
  xpValue: 120,
  scale: 1.0,
  behavior: 'shielder',
};
