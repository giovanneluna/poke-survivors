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
    name: 'Explosion',
    pattern: 'aoe-tremor',
    damage: 70,
    cooldownMs: 4000,
    aoeRadius: 200,
    spriteKey: 'atk-golem-explosion',
    animKey: 'anim-golem-explosion',
    spriteScale: 2,
    tintColor: 0xff6600,
    aoeColor: 0xff4400,
  },
};
