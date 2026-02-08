import type { BossConfig } from '../../types';
import { SPRITES } from '../sprites';

export const GENGAR: BossConfig = {
  key: 'gengar',
  name: 'Gengar',
  sprite: SPRITES.gengar,
  hp: 5000,
  speed: 60,
  damage: 32,
  xpValue: 280,
  scale: 1.6,
  isBoss: true,
  bossAttack: {
    name: 'Shadow Storm',
    pattern: 'teleport-fan',
    damage: 28,
    cooldownMs: 4000,
    projectileCount: 7,
    teleportRange: 180,
  },
};
