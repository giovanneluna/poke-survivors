import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const PRIMEAPE: BossConfig = {
  key: 'primeape',
  name: 'Primeape',
  sprite: SPRITES.primeape,
  hp: 4000,
  speed: 68,
  damage: 38,
  xpValue: 220,
  scale: 1.5,
  isBoss: true,
  bossAttack: {
    name: 'Close Combat',
    pattern: 'charge',
    damage: 45,
    cooldownMs: 2800,
    range: 450,
  },
};
