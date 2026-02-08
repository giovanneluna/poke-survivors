import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VILEPLUME: BossConfig = {
  key: 'vileplume',
  name: 'Vileplume',
  sprite: SPRITES.vileplume,
  hp: 1500,
  speed: 30,
  damage: 20,
  xpValue: 130,
  scale: 1.6,
  isBoss: true,
  contactEffect: {
    type: 'poison',
    durationMs: 5000,
    dps: 5,
  },
  bossAttack: {
    name: 'Petal Dance',
    pattern: 'aoe-tremor',
    damage: 25,
    cooldownMs: 6000,
    aoeRadius: 160,
  },
};
