import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const RAPIDASH_BOSS: BossConfig = {
  key: 'rapidash',
  name: 'Rapidash',
  sprite: SPRITES.rapidash,
  hp: 5000,
  speed: 80,
  damage: 35,
  xpValue: 300,
  scale: 1.6,
  isBoss: true,
  resistance: 0.15,
  hpRegenPerSec: 15,
  archetype: 'striker',
  bossAttacks: [{
    name: 'Flame Charge',
    pattern: 'charge',
    damage: 45,
    cooldownMs: 3000,
    range: 250,
    tintColor: 0xff4400,
  }, {
    name: 'Fire Blast',
    pattern: 'fan',
    damage: 35,
    cooldownMs: 5000,
    projectileCount: 5,
    spriteKey: 'atk-fire-blast',
    animKey: 'anim-fire-blast',
    spriteScale: 1.5,
    tintColor: 0xff2200,
  }, {
    name: 'Megahorn',
    pattern: 'aoe-land',
    damage: 50,
    cooldownMs: 8000,
    aoeRadius: 130,
    aoeColor: 0x88aa22,
  }],
};
