import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const NIDOKING: BossConfig = {
  key: 'nidoking',
  name: 'Nidoking',
  sprite: SPRITES.nidoking,
  hp: 3000,
  speed: 45,
  damage: 35,
  xpValue: 180,
  scale: 1.6,
  isBoss: true,
  bossAttack: {
    name: 'Thrash',
    pattern: 'aoe-tremor',
    damage: 30,
    cooldownMs: 5000,
    aoeRadius: 220,
  },
};
