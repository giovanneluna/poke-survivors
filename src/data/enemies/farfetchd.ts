import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const FARFETCHD: EnemyConfig = {
  key: 'farfetchd',
  name: "Farfetch'd",
  sprite: SPRITES.farfetchd,
  hp: 13,
  speed: 60,
  damage: 8,
  xpValue: 8,
  scale: 1.0,
  behavior: 'berserker',
};
