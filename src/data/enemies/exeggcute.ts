import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const EXEGGCUTE: EnemyConfig = {
  key: 'exeggcute',
  name: 'Exeggcute',
  sprite: SPRITES.exeggcute,
  hp: 28,
  speed: 40,
  damage: 6,
  xpValue: 5,
  scale: 1.0,
  behavior: 'confuser',
  contactEffect: { type: 'confusion', durationMs: 1200 },
};
