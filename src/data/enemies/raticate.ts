import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const RATICATE: BossConfig = {
  key: 'raticate',
  name: 'Raticate',
  sprite: SPRITES.raticate,
  hp: 500,
  speed: 50,
  damage: 20,
  xpValue: 50,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Hyper Fang',
    pattern: 'charge',
    damage: 25,
    cooldownMs: 5000,
    range: 300,
  },
};
