import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ARBOK: BossConfig = {
  key: 'arbok',
  name: 'Arbok',
  sprite: SPRITES.arbok,
  hp: 800,
  speed: 45,
  damage: 25,
  xpValue: 80,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Poison Sting',
    pattern: 'fan',
    damage: 15,
    cooldownMs: 4000,
    projectileCount: 3,
  },
};
