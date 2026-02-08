import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const MACHAMP: BossConfig = {
  key: 'machamp',
  name: 'Machamp',
  sprite: SPRITES.machamp,
  hp: 6000,
  speed: 55,
  damage: 45,
  xpValue: 300,
  scale: 1.7,
  isBoss: true,
  bossAttack: {
    name: 'Dynamic Punch',
    pattern: 'aoe-tremor',
    damage: 55,
    cooldownMs: 3000,
    aoeRadius: 160,
  },
};
