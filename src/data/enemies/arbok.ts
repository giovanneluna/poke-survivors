import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ARBOK: BossConfig = {
  key: 'arbok',
  name: 'Arbok',
  sprite: SPRITES.arbok,
  hp: 1800,
  speed: 58,
  damage: 30,
  xpValue: 120,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Gunk Shot',
    pattern: 'fan',
    damage: 20,
    cooldownMs: 3500,
    projectileCount: 5,
  },
};
