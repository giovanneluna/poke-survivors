import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const RATICATE: BossConfig = {
  key: 'raticate',
  name: 'Raticate',
  sprite: SPRITES.raticate,
  hp: 1200,
  speed: 65,
  damage: 25,
  xpValue: 80,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Hyper Fang',
    pattern: 'charge',
    damage: 30,
    cooldownMs: 4500,
    range: 380,
  },
};
