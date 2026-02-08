import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const BEEDRILL: BossConfig = {
  key: 'beedrill',
  name: 'Beedrill',
  sprite: SPRITES.beedrill,
  hp: 1000,
  speed: 70,
  damage: 25,
  xpValue: 100,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Twineedle',
    pattern: 'charge',
    damage: 30,
    cooldownMs: 4000,
    range: 350,
  },
};
