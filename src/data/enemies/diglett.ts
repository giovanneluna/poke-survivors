import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const DIGLETT: EnemyConfig = {
  key: 'diglett',
  name: 'Diglett',
  sprite: SPRITES.diglett,
  hp: 6,
  speed: 70,
  damage: 5,
  xpValue: 6,
  scale: 1.0,
  behavior: 'teleporter',
  teleport: { cooldownMs: 4000, range: 150 },
};
