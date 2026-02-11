import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const KOFFING: EnemyConfig = {
  key: 'koffing',
  name: 'Koffing',
  sprite: SPRITES.koffing,
  hp: 100,
  speed: 30,
  damage: 12,
  xpValue: 50,
  scale: 1.1,
  behavior: 'deathCloud',
  deathCloud: { radius: 50, dps: 4, durationMs: 4000 },
};
