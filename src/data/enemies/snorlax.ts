import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SNORLAX: BossConfig = {
  key: 'snorlax',
  name: 'Snorlax',
  sprite: SPRITES.snorlax,
  hp: 5000,
  speed: 35,
  damage: 45,
  xpValue: 300,
  scale: 1.8,
  isBoss: true,
  bossAttack: {
    name: 'Body Slam',
    pattern: 'aoe-land',
    damage: 50,
    cooldownMs: 6000,
    aoeRadius: 250,
  },
};
