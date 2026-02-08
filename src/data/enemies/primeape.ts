import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PRIMEAPE: BossConfig = {
  key: 'primeape',
  name: 'Primeape',
  sprite: SPRITES.primeape,
  hp: 1800,
  speed: 60,
  damage: 30,
  xpValue: 150,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Close Combat',
    pattern: 'charge',
    damage: 35,
    cooldownMs: 3500,
    range: 400,
  },
};
