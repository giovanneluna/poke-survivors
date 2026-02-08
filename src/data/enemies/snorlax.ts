import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SNORLAX: BossConfig = {
  key: 'snorlax',
  name: 'Snorlax',
  sprite: SPRITES.snorlax,
  hp: 2000,
  speed: 30,
  damage: 35,
  xpValue: 200,
  scale: 1.8,
  isBoss: true,
  bossAttack: {
    name: 'Body Slam',
    pattern: 'aoe-land',
    damage: 40,
    cooldownMs: 7000,
    aoeRadius: 180,
  },
};
