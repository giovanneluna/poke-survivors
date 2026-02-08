import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const FEAROW: BossConfig = {
  key: 'fearow',
  name: 'Fearow',
  sprite: SPRITES.fearow,
  hp: 3000,
  speed: 80,
  damage: 30,
  xpValue: 180,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Drill Peck',
    pattern: 'charge',
    damage: 40,
    cooldownMs: 2200,
    range: 480,
  },
};
