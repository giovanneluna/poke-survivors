import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GENGAR: BossConfig = {
  key: 'gengar',
  name: 'Gengar',
  sprite: SPRITES.gengar,
  hp: 2500,
  speed: 55,
  damage: 25,
  xpValue: 180,
  scale: 1.6,
  isBoss: true,
  bossAttack: {
    name: 'Shadow Storm',
    pattern: 'teleport-fan',
    damage: 20,
    cooldownMs: 5000,
    projectileCount: 5,
    teleportRange: 150,
  },
};
