import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const BELLSPROUT: EnemyConfig = {
  key: 'bellsprout',
  name: 'Bellsprout',
  sprite: SPRITES.bellsprout,
  hp: 12,
  speed: 45,
  damage: 3,
  xpValue: 3,
  scale: 1.0,
  behavior: 'healer',
};
