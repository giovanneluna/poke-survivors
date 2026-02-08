import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const NIDOKING: BossConfig = {
  key: 'nidoking',
  name: 'Nidoking',
  sprite: SPRITES.nidoking,
  hp: 1200,
  speed: 40,
  damage: 30,
  xpValue: 120,
  scale: 1.6,
  isBoss: true,
  bossAttack: {
    name: 'Thrash',
    pattern: 'aoe-tremor',
    damage: 20,
    cooldownMs: 6000,
    aoeRadius: 150,
  },
};
