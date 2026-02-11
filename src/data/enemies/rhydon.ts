import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const RHYDON: EnemyConfig = {
  key: 'rhydon',
  name: 'Rhydon',
  sprite: SPRITES.rhydon,
  hp: 250,
  speed: 20,
  damage: 35,
  xpValue: 110,
  scale: 1.4,
  behavior: 'rammer',
  contactEffect: { type: 'knockback', durationMs: 500, force: 400 },
};
