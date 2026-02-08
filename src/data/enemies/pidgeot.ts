import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PIDGEOT: BossConfig = {
  key: 'pidgeot',
  name: 'Pidgeot',
  sprite: SPRITES.pidgeot,
  hp: 4500,
  speed: 75,
  damage: 35,
  xpValue: 250,
  scale: 1.6,
  isBoss: true,
  bossAttack: {
    name: 'Brave Bird',
    pattern: 'charge',
    damage: 50,
    cooldownMs: 2500,
    range: 500,
  },
};
