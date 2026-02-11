import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SCYTHER: EnemyConfig = {
  key: 'scyther',
  name: 'Scyther',
  sprite: SPRITES.scyther,
  hp: 80,
  speed: 55,
  damage: 25,
  xpValue: 100,
  scale: 1.1,
  behavior: 'slasher',
};
