import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const BEEDRILL: BossConfig = {
  key: 'beedrill',
  name: 'Beedrill',
  sprite: SPRITES.beedrill,
  hp: 2500,
  speed: 80,
  damage: 35,
  xpValue: 150,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Twineedle',
    pattern: 'charge',
    damage: 40,
    cooldownMs: 3000,
    range: 420,
  },
};
