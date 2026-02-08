import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VILEPLUME: BossConfig = {
  key: 'vileplume',
  name: 'Vileplume',
  sprite: SPRITES.vileplume,
  hp: 3500,
  speed: 35,
  damage: 28,
  xpValue: 200,
  scale: 1.6,
  isBoss: true,
  contactEffect: {
    type: 'poison',
    durationMs: 6000,
    dps: 8,
  },
  bossAttack: {
    name: 'Petal Dance',
    pattern: 'aoe-tremor',
    damage: 35,
    cooldownMs: 4500,
    aoeRadius: 260,
  },
};
