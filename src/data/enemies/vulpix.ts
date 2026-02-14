import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VULPIX: EnemyConfig = {
  key: 'vulpix',
  name: 'Vulpix',
  sprite: SPRITES.vulpix,
  hp: 18,
  speed: 55,
  damage: 5,
  xpValue: 3,
  scale: 1.0,
  behavior: 'circler',
  contactEffect: { type: 'slow', durationMs: 1000, multiplier: 0.6 },
};
