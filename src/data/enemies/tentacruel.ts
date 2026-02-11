import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const TENTACRUEL: EnemyConfig = {
  key: 'tentacruel',
  name: 'Tentacruel',
  sprite: SPRITES.tentacruel,
  hp: 130,
  speed: 50,
  damage: 16,
  xpValue: 105,
  scale: 1.2,
  behavior: 'trapperElite',
  contactEffect: { type: 'stun', durationMs: 2500 },
};
