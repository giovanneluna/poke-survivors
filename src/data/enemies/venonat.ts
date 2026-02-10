import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VENONAT: EnemyConfig = {
  key: 'venonat',
  name: 'Venonat',
  sprite: SPRITES.venonat,
  hp: 40,
  speed: 40,
  damage: 8,
  xpValue: 25,
  scale: 1.0,
  behavior: 'sporeWalker',
  contactEffect: { type: 'poison', durationMs: 3000, dps: 2 },
};
