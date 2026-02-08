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
  resistance: 0.3,
  hpRegenPerSec: 15,
  archetype: 'tank',
  bossAttacks: [{
    name: 'Body Slam',
    pattern: 'aoe-land',
    damage: 50,
    cooldownMs: 6000,
    aoeRadius: 250,
  }, {
    name: 'Hyper Beam',
    pattern: 'beam',
    damage: 60,
    cooldownMs: 8000,
    range: 300,
    beamDuration: 1500,
    beamWidth: 32,
    tintColor: 0xffffff,
    aoeColor: 0xffffaa,
  }, {
    name: 'Rest',
    pattern: 'buff',
    damage: 0,
    cooldownMs: 20000,
    buffType: 'heal',
    buffValue: 0.3,
    buffDuration: 3000,
    tintColor: 0x4488ff,
    aoeColor: 0x4488ff,
  }],
};
