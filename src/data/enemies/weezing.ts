import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const WEEZING: EnemyConfig = {
  key: 'weezing',
  name: 'Weezing',
  sprite: SPRITES.weezing,
  hp: 180,
  speed: 25,
  damage: 15,
  xpValue: 100,
  scale: 1.3,
  behavior: 'gasSpreader',
  deathCloud: { radius: 70, dps: 5, durationMs: 6000 },
};
