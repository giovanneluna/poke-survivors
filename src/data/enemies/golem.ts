import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GOLEM: BossConfig = {
  key: 'golem',
  name: 'Golem',
  sprite: SPRITES.golem,
  hp: 5500,
  speed: 40,
  damage: 42,
  xpValue: 280,
  scale: 1.6,
  isBoss: true,
  bossAttack: {
    name: 'Earthquake',
    pattern: 'aoe-tremor',
    damage: 60,
    cooldownMs: 3500,
    aoeRadius: 180,
  },
};
