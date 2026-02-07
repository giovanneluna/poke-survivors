import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

// Zubat: melee puro (sem rangedAttack)
// Buff de speed e damage para compensar ausência de projéteis
export const ZUBAT: EnemyConfig = {
  key: 'zubat',
  name: 'Zubat',
  sprite: SPRITES.zubat,
  hp: 12,
  speed: 80,
  damage: 6,
  xpValue: 4,
  scale: 0.8,
};
